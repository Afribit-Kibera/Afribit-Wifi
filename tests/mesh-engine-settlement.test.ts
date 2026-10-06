import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { test } from "node:test";
import { InsatsSettlementClient, engineConfigured, meshServiceHeaders, readEngineConfig } from "../lib/payments/insats-engine";
import { PaystackClient, createPaystackProvider, getPaystackReadiness } from "../lib/payments/paystack";

const config = { serviceKey: "mesh-fixture-service-key-at-least-32-bytes", destination: "receiver@blink.sv" };
function receipt(id: string, settled: boolean) {
  return { paymentId: id, reference: `mesh-${id}`, amountKes: 10, amountSats: 93, destination: config.destination,
    status: settled ? "settled" : "registered", collectionConfirmed: true, verifiedBitcoinDelivery: settled,
    paymentHash: settled ? "ab".repeat(32) : null, sourceTransactionId: settled ? "source-tx" : null,
    settledAt: settled ? new Date().toISOString() : null, resolutionRequired: false };
}

test("Mesh Engine has a fixed endpoint and scoped method/path/body/time authentication", () => {
  assert.equal(engineConfigured({}), false);
  const env = { BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: config.serviceKey, MESH_LIGHTNING_ADDRESS: config.destination };
  assert.deepEqual(readEngineConfig(env), config);
  assert.throws(() => readEngineConfig({ ...env, INSATS_ENGINE_URL: "https://untrusted.example" }));
  const signature = meshServiceHeaders(config, "POST", "/rails/mesh/settlements", '{"x":1}', "1791200000");
  assert.equal(signature["x-mesh-signature"], createHmac("sha256", config.serviceKey).update('1791200000\nPOST\n/rails/mesh/settlements\n{"x":1}').digest("hex"));
  const readiness = getPaystackReadiness({ ...env, PAYSTACK_ENABLED: "true", PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture" });
  assert.equal(readiness.settlementReady, true);
  assert.equal(readiness.checkoutReady, false);
  assert.equal(readiness.blocker, "internet_access_not_commissioned");
});

test("Automatic checkout cannot be enabled by flags without an enrolled native router", () => {
  const env = { BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: config.serviceKey,
    MESH_LIGHTNING_ADDRESS: config.destination, PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture",
    PAYSTACK_RECEIPT_EMAIL: "payer@example.org", PAYSTACK_ENABLED: "true",
    MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true" };
  const readiness = getPaystackReadiness(env);
  assert.equal(readiness.settlementReady, true);
  assert.equal(readiness.accessReady, false);
  assert.equal(readiness.checkoutReady, false);
  assert.equal(readiness.blocker, "internet_access_not_commissioned");
});

test("Commissioned automatic checkout still requires live collection, receipt configuration and every independent gate", () => {
  const env = { BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: config.serviceKey,
    MESH_LIGHTNING_ADDRESS: config.destination, PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture",
    PAYSTACK_RECEIPT_EMAIL: "payer@example.org", PAYSTACK_ENABLED: "true",
    MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
    MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    MESH_ROUTER_SERVICE_KEY: "mesh-fixture-router-service-key-at-least-32-bytes", MESH_ACCESS_ROUTER_ID: "KM-LAB-001" };
  const ready = getPaystackReadiness(env);
  assert.equal(ready.accessReady, true);
  assert.equal(ready.checkoutReady, true);
  assert.equal(ready.blocker, null);
  for (const patch of [{ PAYSTACK_ENABLED: "false" }, { PAYSTACK_RECEIPT_EMAIL: "" },
    { PAYSTACK_MODE: "test", PAYSTACK_SECRET_KEY: "sk_test_fixture" },
    { BLINK_SETTLEMENT_ENABLED: "false" }, { MESH_AUTOMATIC_ACCESS_ENABLED: "false" },
    { MESH_NATIVE_ACCESS_COMMISSIONED: "false" }, { MESH_ROUTER_SERVICE_KEY: "short" },
    { MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(16, 7).toString("base64") }, { MESH_ACCESS_ROUTER_ID: "uncommissioned-router" }]) {
    assert.equal(getPaystackReadiness({ ...env, ...patch }).checkoutReady, false, JSON.stringify(patch));
  }
});

test("A verified fiat success asks the Engine to settle and returns its exact Bitcoin receipt", async () => {
  const id = randomUUID();
  const paths: string[] = [];
  const engine = new InsatsSettlementClient(config, async (url, init) => {
    paths.push(String(url));
    assert.equal(new Headers(init?.headers).get("x-mesh-signature")?.length, 64);
    assert.equal(init?.redirect, "error");
    return Response.json(receipt(id, paths.length > 1));
  });
  const fiat = new PaystackClient({ mode: "live", secretKey: "sk_live_fixture" }, async () => Response.json({ status: true, data: {
    reference: `mesh-${id}`, status: "success", amount: 1000, currency: "KES", domain: "live", channel: "mobile_money",
    metadata: { tag: "mesh", source: "mesh", meshPaymentId: id },
  } }));
  const snapshot = await createPaystackProvider(fiat, engine).getSnapshot(`mesh-${id}`, { paystack: { paymentId: id, amountKes: 10, mode: "live" } });
  assert.equal(snapshot.status, "settled");
  assert.equal(snapshot.verifiedBitcoinDelivery, true);
  assert.equal(snapshot.amountSats, 93);
  assert.equal(snapshot.paymentHash, "ab".repeat(32));
  assert.deepEqual(paths, ["https://engine.insats.org/rails/mesh/settlements", `https://engine.insats.org/rails/mesh/settlements/${id}/reconcile`]);
});

test("Unverified M-Pesa never calls the Engine and an ambiguous Engine result never retries a send", async () => {
  const id = randomUUID();
  let calls = 0;
  const engine = new InsatsSettlementClient(config, async () => { calls++; throw new Error("private secret must not escape"); });
  const fiat = new PaystackClient({ mode: "live", secretKey: "sk_live_fixture" }, async () => Response.json({ status: true, data: {
    reference: `mesh-${id}`, status: "ongoing", amount: 1000, currency: "KES", domain: "live", channel: "mobile_money",
    metadata: { tag: "mesh", source: "mesh", meshPaymentId: id },
  } }));
  assert.equal((await createPaystackProvider(fiat, engine).getSnapshot(`mesh-${id}`, { paystack: { paymentId: id, amountKes: 10, mode: "live" } })).status, "processing");
  assert.equal(calls, 0);
  await assert.rejects(engine.settle(id, 10), error => error instanceof Error && !error.message.includes("private secret"));
  assert.equal(calls, 1);
});

test("Receipt checks reject wrong amount, recipient, reference, hash and incomplete settlement evidence", async () => {
  const id = randomUUID();
  for (const change of [{ amountKes: 11 }, { destination: "attacker@blink.sv" }, { reference: `mesh-${randomUUID()}` },
    { paymentHash: null }, { sourceTransactionId: null }, { settledAt: null }, { verifiedBitcoinDelivery: false }, { paymentId: randomUUID() }]) {
    const engine = new InsatsSettlementClient(config, async () => Response.json({ ...receipt(id, true), ...change }));
    await assert.rejects(engine.getReceipt(id, 10));
  }
  let calls = 0;
  const engine = new InsatsSettlementClient(config, async () => { calls++; return Response.json(receipt(id, true)); });
  assert.equal((await engine.settle(id, 10)).verifiedBitcoinDelivery, true);
  assert.equal(calls, 1); // Already settled: no reconcile/send operation.
});
