import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { attestHost, createPaidOrder, deadlineTag, verifyHost, verifyOrder } from "../lib/mesh-access/order";
import type { EngineSettlement } from "../lib/payments/insats-engine";
import { buildNativeProvisionCommand } from "../lib/mesh-access/native-plan";
import { provisionMeshOrder } from "../gateway-agent/mesh-order";

const now = 1_791_218_000;
const enrollment = { routerId: "KM-LAB-001", server: "KM-MESH-001", key: "fixture-router-key-with-at-least-32-bytes" };
const paymentId = randomUUID();
const host = attestHost({ routerId: enrollment.routerId, server: enrollment.server,
  ticketId: randomUUID(), macAddress: "02:11:22:33:44:55", ipAddress: "10.30.0.197", checkedAt: now }, enrollment);
const receipt: EngineSettlement = { paymentId, reference: `mesh-${paymentId}`, amountKes: 10, amountSats: 85,
  destination: "receiver@blink.sv", status: "settled", collectionConfirmed: true, verifiedBitcoinDelivery: true,
  paymentHash: "ab".repeat(32), sourceTransactionId: "fixture-send", settledAt: new Date(now * 1000).toISOString(), resolutionRequired: false };
const input = { paymentId, amountKes: 10, destination: receipt.destination, durationSeconds: 60, host, enrollment, now, receipt };

test("Verified receipt binds one fixed deadline to the attested router/phone", () => {
  const signed = createPaidOrder(input);
  const order = verifyOrder(signed, enrollment, now);
  assert.equal(order.expiresAt, now + 60);
  assert.equal(order.macAddress, "02:11:22:33:44:55");
  assert.equal(order.profile, "KM-MESH-DEADLINE-5M");
  assert.equal(deadlineTag(order.expiresAt), `mesh-deadline-v1:${now + 60}`);
  assert.deepEqual(verifyOrder(signed, enrollment, now + 59), order);
  assert.throws(() => verifyOrder(signed, enrollment, now + 60), /expired/);
  assert.throws(() => verifyOrder(signed, enrollment, now + 120), /expired/);
});
test("Spoofed device, different router/key and cross-purpose signatures fail", () => {
  const modified = { ...host, body: host.body.replace("10.30.0.197", "10.30.0.198") };
  assert.throws(() => verifyHost(modified, enrollment, now), /signature/);
  assert.throws(() => verifyHost(host, { ...enrollment, routerId: "KM-LAB-002" }, now), /target/);
  assert.throws(() => verifyHost(host, { ...enrollment, key: "different-key-at-least-32-bytes-long" }, now), /signature/);
  assert.throws(() => verifyOrder(host, enrollment, now), /signature/);
});
test("Stale/future host tickets and management addresses cannot purchase access", () => {
  assert.throws(() => createPaidOrder({ ...input, now: now + 121 }), /expired/);
  assert.throws(() => verifyHost(host, enrollment, now - 6), /expired/);
  for (const ipAddress of ["10.20.0.1", "10.30.0.0", "10.30.0.255", "10.30.0.197; /system reboot"]) {
    assert.throws(() => attestHost({ ...JSON.parse(host.body), ipAddress }, enrollment));
  }
});
test("Fiat success, pending/ambiguous Bitcoin and mismatched receipts never issue access", () => {
  for (const patch of [{ verifiedBitcoinDelivery: false }, { status: "send_started" }, { collectionConfirmed: false },
    { paymentId: randomUUID() }, { reference: `mesh-${randomUUID()}` }, { destination: "attacker@blink.sv" },
    { amountKes: 11 }, { paymentHash: null }, { sourceTransactionId: null }, { settledAt: "invalid" }, { resolutionRequired: true }]) {
    assert.throws(() => createPaidOrder({ ...input, receipt: { ...receipt, ...patch } as EngineSettlement }), /receipt/);
  }
});
test("Bounded lab duration and signatures prevent deadline extension or unsafe tags", () => {
  for (const durationSeconds of [0, -1, 1.5, 301, Infinity]) assert.throws(() => createPaidOrder({ ...input, durationSeconds }));
  const signed = createPaidOrder(input);
  assert.throws(() => verifyOrder({ ...signed, body: signed.body.replace(String(now + 60), String(now + 300)) }, enrollment, now), /signature/);
  assert.throws(() => deadlineTag(1));
  assert.throws(() => deadlineTag(Number.MAX_SAFE_INTEGER));
});
test("Native provisioning is bound to Primary, preserves retries and never creates bypasses", () => {
  const signed = createPaidOrder(input);
  const command = buildNativeProvisionCommand(signed, enrollment, now);
  assert.match(command, /serial-number\] != "HH70A8H82EG"/);
  assert.match(command, /host find where address="10\.30\.0\.197" and mac-address="02:11:22:33:44:55"/);
  assert.match(command, /MESH_NATIVE_RETAINED/);
  assert.doesNotMatch(command, /reset-counters|ip-binding|bypassed/);
  const retryBranch = command.split("} else={")[0];
  assert.doesNotMatch(retryBranch, /user set|user add/);
  assert.throws(() => buildNativeProvisionCommand(signed, enrollment, now + 60), /expired/);
  const node2 = { ...enrollment, routerId: "KM-LAB-002" };
  const node2Host = attestHost({ ...JSON.parse(host.body), routerId: node2.routerId }, node2);
  const node2Order = createPaidOrder({ ...input, enrollment: node2, host: node2Host });
  assert.throws(() => buildNativeProvisionCommand(node2Order, node2, now), /not commissioned/);
});
test("Durable reservation survives ambiguity; retries retain one deadline and used receipts stay closed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-native-test-"));
  let clock = now;
  let calls = 0;
  const signed = createPaidOrder(input);
  const deps = { enrollment, ledgerDirectory: directory, amountKes: 10, destination: receipt.destination,
    now: () => clock, getReceipt: async () => receipt,
    execute: async () => { calls++; throw new Error("Ambiguous native write"); } };
  try {
    await assert.rejects(provisionMeshOrder(signed, deps), /Ambiguous/);
    const reserved = JSON.parse(await readFile(join(directory, `${paymentId}.json`), "utf8"));
    assert.equal(reserved.state, "reserved");
    assert.equal(reserved.expiresAt, now + 60);
    assert.equal(JSON.stringify(reserved).includes(JSON.parse(signed.body).password), false);
    clock = now + 20;
    const retry = await provisionMeshOrder(signed, { ...deps, execute: async () => "retained" });
    assert.equal(retry.result, "retained");
    assert.equal(retry.expiresAt, now + 60);
    assert.equal(retry.customerActive, false);
    const replacement = createPaidOrder({ ...input, now: now + 20 });
    await assert.rejects(provisionMeshOrder(replacement, deps), /already used|another order/);
    clock = now + 60;
    await assert.rejects(provisionMeshOrder(signed, deps), /expired/);
    assert.equal(calls, 1);
    clock = now;
    await writeFile(join(directory, `${paymentId}.json`), JSON.stringify({ state: "consumed", orderHash: "manual-pass" }));
    await assert.rejects(provisionMeshOrder(signed, deps), /already used/);
  } finally {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("mesh-native-test-")) throw new Error("Unsafe fixture cleanup");
    await rm(target, { recursive: true, force: true });
  }
});
test("Parallel consumers cannot execute twice and an unconfirmed receipt never reaches the router", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-native-test-"));
  const signed = createPaidOrder(input);
  let executions = 0;
  const deps = { enrollment, ledgerDirectory: directory, amountKes: 10, destination: receipt.destination,
    now: () => now, getReceipt: async () => receipt,
    execute: async () => { executions++; await new Promise(resolve => setTimeout(resolve, 100)); return "created" as const; } };
  try {
    await assert.rejects(provisionMeshOrder(signed, { ...deps, getReceipt: async () => ({ ...receipt, verifiedBitcoinDelivery: false }) }), /receipt/);
    assert.equal(executions, 0);
    const results = await Promise.allSettled([provisionMeshOrder(signed, deps), provisionMeshOrder(signed, deps)]);
    assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(executions, 1);
  } finally {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("mesh-native-test-")) throw new Error("Unsafe fixture cleanup");
    await rm(target, { recursive: true, force: true });
  }
});
