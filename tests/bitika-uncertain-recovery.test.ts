import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../lib/db/schema";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { encryptAccess } from "../lib/mesh-access/security";

test("Bitika uncertain acknowledgements recover the retained purchase, never create another charge", async t => {
  const env = { ...process.env }, fetcher = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true",
    MESH_NATIVE_ACCESS_COMMISSIONED: "true", MESH_ROUTER_SERVICE_KEY: "recovery-fixture-key-".repeat(3),
    MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"), BITIKA_MODE: "live", BITIKA_API_KEY: "bk_live_fixture",
    BITIKA_LIGHTNING_ADDRESS: "new-destination@blink.sv" });
  const pg = await PGlite.create();
  await pg.exec(`CREATE TYPE payment_status AS ENUM ('new','processing','settled','expired','invalid','refunded');
    CREATE TABLE payments(id uuid PRIMARY KEY,provider text NOT NULL,provider_invoice_id text UNIQUE,status payment_status NOT NULL,
      portal_session_id uuid,package_id uuid,amount_sats integer NOT NULL,checkout_url text,metadata jsonb NOT NULL,
      settled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());`);
  const memory = drizzle(pg, { schema }), { db } = await import("../lib/db"), saved = new Map<string, unknown>();
  for (const key of ["update", "select", "execute"]) {
    saved.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const { bitikaMissingReferenceRecoveryCandidate, recoverBitikaCollection, reconcileBitikaPayment } = await import("../lib/payments/reconcile-bitika");
  const config = readMeshAccessConfig(), code = "qadi_fixture_recovered";
  let collections: { id: string; body: Record<string, unknown> }[] = [], lookups = 0;
  let collectionFailure = false, malformedAck = false, lookupStatus = "processing", badReceipt = false;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/xwift/collect")) {
      collections.push({ id: new Headers(init?.headers).get("Idempotency-Key")!, body: JSON.parse(String(init?.body)) });
      if (collectionFailure) throw new Error("Lost response after provider acceptance");
      return Response.json(malformedAck ? { status: "PENDING" } : { transaction_code: code, status: "PENDING" });
    }
    if (String(url).endsWith(`/transactions/code/${code}`)) {
      lookups++;
      return Response.json({ success: true, data: { transaction_code: code, amount: 30, lightningAddress: "original@blink.sv",
        status: lookupStatus, sats: lookupStatus === "fulfilled" ? 100 : null, paymentHash: badReceipt ? "bad" : "ab".repeat(32) } });
    }
    throw new Error("Only mocked Bitika endpoints are allowed");
  };
  async function fixture(metadataPatch: Record<string, unknown> = {}, payloadPatch: Record<string, unknown> = {}) {
    await pg.exec("TRUNCATE payments"); collections = []; lookups = 0;
    collectionFailure = malformedAck = badReceipt = false; lookupStatus = "processing";
    const id = randomUUID();
    const payload = { paymentId: id, amountKes: 30, phone: "254712345678", lightningAddress: "original@blink.sv", ...payloadPatch };
    const [payment] = await memory.insert(schema.payments).values({ id, provider: "bitika", status: "processing", amountSats: 100,
      metadata: { priceKes: 30, collectionGuardVersion: 1, meshContextId: randomUUID(), bitikaChargeStartedAt: Date.now() - 40_000,
        bitika: { mode: "live", amountKes: 30, lightningAddress: "original@blink.sv" },
        bitikaCollectionRequest: encryptAccess(payload, config), ...metadataPatch } }).returning();
    return payment;
  }
  async function current() { return (await memory.select().from(schema.payments))[0]; }
  try {
    await t.test("Twelve workers share one lease and preserve the exact id, amount, phone and original destination", async () => {
      const payment = await fixture();
      const results = await Promise.all(Array.from({ length: 12 }, () => recoverBitikaCollection(payment)));
      assert.equal(collections.length, 1); assert.equal(results.filter(Boolean).length, 1);
      assert.deepEqual(collections[0], { id: payment.id, body: { amount: "30", phone: "254712345678", lightningAddress: "original@blink.sv" } });
      assert.equal((await current()).providerInvoiceId, code); assert.equal((await current()).status, "processing");
      assert.equal((await current()).settledAt, null);
    });
    await t.test("First send remains in flight; even forced reconciliation cannot recover yet", async () => {
      const payment = await fixture({ bitikaChargeStartedAt: Date.now() });
      await reconcileBitikaPayment(payment, true); assert.equal(collections.length, 0); assert.equal(lookups, 0);
    });
    await t.test("Timeout survives a new worker, throttles retries, then reuses the same idempotency key", async () => {
      const payment = await fixture(); collectionFailure = true;
      await assert.rejects(recoverBitikaCollection(payment));
      assert.equal((await current()).providerInvoiceId, null);
      await reconcileBitikaPayment(await current(), true); assert.equal(collections.length, 1);
      const row = await current();
      await memory.update(schema.payments).set({ metadata: { ...row.metadata, bitikaLastCheckedAt: Date.now() - 40_000 } });
      collectionFailure = false;
      await reconcileBitikaPayment(await current());
      assert.equal(collections.length, 2); assert.equal(collections[0].id, collections[1].id); assert.deepEqual(collections[0].body, collections[1].body);
      assert.equal(lookups, 1); assert.equal((await current()).status, "processing");
      await reconcileBitikaPayment(await current(), true);
      assert.equal(collections.length, 2, "Known codes are lookup-only"); assert.equal(lookups, 2);
    });
    await t.test("Unattested, unencrypted and uninitiated records cannot trigger a provider request", async () => {
      for (const patch of [{ collectionGuardVersion: 0 }, { meshContextId: "arbitrary" }, { bitikaCollectionRequest: undefined },
        { bitikaChargeStartedAt: undefined }, { bitikaChargeStartedAt: "old" }]) {
        const payment = await fixture(patch); await reconcileBitikaPayment(payment, true); assert.equal(collections.length, 0);
      }
    });
    await t.test("Tampered ciphertext and mismatched payment, amount, phone or destination fail before collection", async () => {
      for (const patch of [{ paymentId: randomUUID() }, { amountKes: 40 }, { phone: "0712345678" }, { lightningAddress: "attacker@blink.sv" }, { extra: "not-retained" }]) {
        const payment = await fixture({}, patch); await assert.rejects(recoverBitikaCollection(payment)); assert.equal(collections.length, 0);
      }
      const payment = await fixture({ bitikaCollectionRequest: "not.authenticated.ciphertext" });
      await assert.rejects(recoverBitikaCollection(payment)); assert.equal(collections.length, 0);
    });
    await t.test("Unsupported acknowledgement and unverified Bitcoin receipt never settle or grant access", async () => {
      const payment = await fixture(); malformedAck = true;
      await assert.rejects(reconcileBitikaPayment(payment)); assert.equal((await current()).providerInvoiceId, null);
      assert.equal((await current()).status, "processing"); assert.equal(lookups, 0);
      const next = await fixture(); badReceipt = true; lookupStatus = "fulfilled";
      await assert.rejects(reconcileBitikaPayment(next), /delivery could not be verified/);
      assert.equal((await current()).status, "processing"); assert.equal((await current()).settledAt, null);
    });
    await t.test("A concurrent different reference cannot be overwritten", async () => {
      const payment = await fixture(), ordinaryFetch = globalThis.fetch;
      globalThis.fetch = async (url, init) => {
        if (String(url).endsWith("/xwift/collect")) await memory.update(schema.payments).set({ providerInvoiceId: "qadi_other_reference" });
        return ordinaryFetch(url, init);
      };
      try { await assert.rejects(recoverBitikaCollection(payment), /needs confirmation/); }
      finally { globalThis.fetch = ordinaryFetch; }
      assert.equal((await current()).providerInvoiceId, "qadi_other_reference"); assert.equal(lookups, 0);
    });
    await t.test("Polling selects old retained collections and tolerates malformed legacy timestamps", async () => {
      const now = Date.now(); await fixture({ bitikaChargeStartedAt: now - 40_000 });
      assert.equal((await memory.select().from(schema.payments).where(bitikaMissingReferenceRecoveryCandidate(now))).length, 1);
      for (const patch of [{ bitikaChargeStartedAt: now }, { bitikaChargeStartedAt: "bad" }, { collectionGuardVersion: 0 },
        { bitikaCollectionRequest: undefined }]) {
        await fixture(patch);
        assert.equal((await memory.select().from(schema.payments).where(bitikaMissingReferenceRecoveryCandidate(now))).length, 0);
      }
    });
  } finally {
    for (const [key, value] of saved) Reflect.set(db, key, value);
    globalThis.fetch = fetcher; for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env); await pg.close();
  }
});
