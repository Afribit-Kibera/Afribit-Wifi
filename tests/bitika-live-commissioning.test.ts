import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { commissionBitikaLive } from "../scripts/mesh/commission-bitika-live";
import type { BitikaConfig } from "../lib/payments/bitika";

const config: BitikaConfig = { mode: "live", apiKey: "bk_live_fixture", lightningAddress: "merchant@blink.sv" };
async function cleanupFixture(directory: string) {
  const target = resolve(directory);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("mesh-live-fixture-")) throw new Error("Fixture cleanup must stay in its created temporary directory");
  await rm(target, { recursive: true, force: true });
}
function providerFixture() {
  const keys: string[] = [];
  let ambiguous = false;
  let status = "fulfilled";
  const fetcher: typeof fetch = async (url, init) => {
    if (String(url).includes("/exchange/rate")) return Response.json({ success: true, data: { kesAmount: 10, satsAmount: 90, feePercentage: 0.03 } });
    if (String(url).endsWith("/xwift/collect")) {
      keys.push(new Headers(init?.headers).get("Idempotency-Key")!);
      assert.deepEqual(JSON.parse(String(init?.body)), { amount: "10", phone: "254712345678", lightningAddress: config.lightningAddress });
      if (ambiguous) { ambiguous = false; throw new Error("Timeout after acceptance"); }
      return Response.json({ transaction_code: "qadi_e74f5e3f92b28fbb9079d23f", status: "processing" });
    }
    if (String(url).endsWith("/transactions/code/qadi_e74f5e3f92b28fbb9079d23f")) return Response.json({ success: true, data: { transaction_code: "qadi_e74f5e3f92b28fbb9079d23f", amount: 10, lightningAddress: config.lightningAddress,
      status, sats: status === "fulfilled" ? 90 : null, paymentHash: status === "fulfilled" ? "ab".repeat(32) : null } });
    throw new Error("Unexpected fixture URL");
  };
  return { fetcher, keys, timeoutNext: () => { ambiguous = true; }, settlementFailure: () => { status = "payment_failed"; } };
}

test("Live preflight is read-only and collection requires a real payer input", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-live-fixture-"));
  try {
    const fixture = providerFixture();
    const result = await commissionBitikaLive("preflight", config, undefined, directory, fixture.fetcher);
    assert.ok("collectionInitiated" in result);
    assert.equal(result.collectionInitiated, false);
    assert.equal(fixture.keys.length, 0);
    await assert.rejects(commissionBitikaLive("collect", config, undefined, directory, fixture.fetcher), /BITIKA_TEST_PHONE/);
    await assert.rejects(commissionBitikaLive("collect", { ...config, mode: "test", apiKey: "bk_test_fixture" }, "0712345678", directory, fixture.fetcher), /production key/);
    assert.equal(fixture.keys.length, 0);
  } finally { await cleanupFixture(directory); }
});

test("An ambiguous accepted collection reuses its UUID; known codes are lookup-only", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-live-fixture-"));
  try {
    const fixture = providerFixture(); fixture.timeoutNext();
    await assert.rejects(commissionBitikaLive("collect", config, "0712345678", directory, fixture.fetcher), /couldn’t confirm/);
    const retained = JSON.parse(await readFile(join(directory, "purchase.json"), "utf8"));
    assert.equal(retained.paymentId, fixture.keys[0]);
    assert.equal(retained.transactionCode, undefined);
    assert.equal(JSON.stringify(retained).includes("254712345678"), false);
    const result = await commissionBitikaLive("collect", config, "+254712345678", directory, fixture.fetcher);
    assert.ok("verifiedBitcoinDelivery" in result);
    assert.equal(result.verifiedBitcoinDelivery, true);
    assert.equal(result.routerAccessGranted, false);
    assert.equal(fixture.keys[0], fixture.keys[1]);
    await commissionBitikaLive("collect", config, "0712345678", directory, fixture.fetcher);
    await commissionBitikaLive("status", config, undefined, directory, fixture.fetcher);
    assert.equal(fixture.keys.length, 2);
    await assert.rejects(commissionBitikaLive("collect", config, "0712345679", directory, fixture.fetcher), /different payer/);
    await assert.rejects(commissionBitikaLive("status", { ...config, lightningAddress: "other@blink.sv" }, undefined, directory, fixture.fetcher), /different payer or destination/);
    assert.equal(fixture.keys.length, 2);
  } finally { await cleanupFixture(directory); }
});

test("Collected M-Pesa without Bitcoin delivery stays unresolved and cannot be recollected", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-live-fixture-"));
  try {
    const fixture = providerFixture(); fixture.settlementFailure();
    const result = await commissionBitikaLive("collect", config, "0712345678", directory, fixture.fetcher);
    assert.ok("verifiedBitcoinDelivery" in result && "resolutionRequired" in result);
    assert.equal(result.verifiedBitcoinDelivery, false);
    assert.equal(result.resolutionRequired, true);
    assert.equal(result.routerAccessGranted, false);
    await commissionBitikaLive("collect", config, "0712345678", directory, fixture.fetcher);
    assert.equal(fixture.keys.length, 1);
  } finally { await cleanupFixture(directory); }
});
