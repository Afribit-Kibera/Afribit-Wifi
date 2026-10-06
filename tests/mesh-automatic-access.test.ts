import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { decryptAccess, encryptAccess, meshAgentHeaders, verifyMeshAgent } from "../lib/mesh-access/security";
import type { EngineSettlement } from "../lib/payments/insats-engine";
import { hashLegacyVoucherCode, hashVoucherCode } from "../lib/voucher-crypto";

test("Automatic access: isolated PostgreSQL, router-bound vouchers and browser ownership", async t => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
    MESH_ACCESS_ROUTER_ID: "KM-LAB-001", MESH_ROUTER_SERVICE_KEY: "router-fixture-key-".repeat(3), MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") });
  globalThis.fetch = async () => { throw new Error("No financial or network calls allowed in access tests"); };
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE access_status AS ENUM ('pending','active','expired','revoked','failed');
    CREATE TABLE portal_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mac_address text NOT NULL,ip_address text,router_id text,login_url text,original_url text,user_agent text,created_at timestamptz NOT NULL DEFAULT now(),last_seen_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE payments(id uuid PRIMARY KEY,portal_session_id uuid,package_id uuid,provider text NOT NULL DEFAULT 'paystack',provider_invoice_id text,status text NOT NULL DEFAULT 'new',amount_sats integer NOT NULL,checkout_url text,metadata jsonb NOT NULL DEFAULT '{}',settled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE voucher_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,package_id uuid,quantity integer NOT NULL,sale_amount_sats integer NOT NULL,access_duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,valid_from timestamptz,valid_until timestamptz,max_redemptions integer NOT NULL DEFAULT 1,prefix text NOT NULL DEFAULT '3W',created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE vouchers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),batch_id uuid NOT NULL REFERENCES voucher_batches,code_hash text NOT NULL UNIQUE,code_ciphertext text NOT NULL,code_last_four text NOT NULL,redemption_count integer NOT NULL DEFAULT 0,disabled boolean NOT NULL DEFAULT false,last_redeemed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE access_grants(id uuid PRIMARY KEY,portal_session_id uuid REFERENCES portal_sessions,payment_id uuid REFERENCES payments,voucher_id uuid,mac_address text NOT NULL,status access_status NOT NULL DEFAULT 'pending',starts_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,data_limit_mb integer,speed_limit_kbps integer,purpose text NOT NULL DEFAULT 'paid',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE mesh_access_contexts(id uuid PRIMARY KEY,router_id text NOT NULL,server text NOT NULL,mac_address text NOT NULL,ip_address text NOT NULL,join_token_hash text NOT NULL UNIQUE,browser_token_hash text NOT NULL,join_expires_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,joined_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE mesh_access_orders(id uuid PRIMARY KEY,context_id uuid NOT NULL REFERENCES mesh_access_contexts,router_id text NOT NULL,payment_id uuid UNIQUE REFERENCES payments,voucher_id uuid REFERENCES vouchers,grant_id uuid NOT NULL REFERENCES access_grants,status text NOT NULL DEFAULT 'queued',encrypted_order text NOT NULL,claim_token_hash text,claimed_at timestamptz,expires_at timestamptz NOT NULL,last_error text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(voucher_id,context_id));
  `);
  const memory = drizzle(pg, { schema });
  await pg.exec(await readFile("scripts/mesh/agent-replay-schema.sql", "utf8"));
  const { db } = await import("../lib/db");
  const savedMethods = new Map<string, unknown>();
  for (const key of ["select", "insert", "update", "execute"]) {
    savedMethods.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const service = await import("../lib/mesh-access/service");
  const config = readMeshAccessConfig();
  const macAddress = "02:11:22:33:44:55";
  async function context(ipAddress = "10.30.0.197") {
    const created = await service.createMeshContext({ macAddress, ipAddress, server: config.server });
    const url = new URL(created.joinUrl), ticket = url.searchParams.get("ticket")!, session = url.searchParams.get("session")!;
    assert.equal(await service.consumeMeshJoin(ticket, session), true);
    assert.equal(await service.consumeMeshJoin(ticket, session), false, "A join ticket is single-use");
    const request = new Request("https://mesh.fixture/", { headers: { cookie: `mesh_session=${session}` } });
    const trusted = await service.getTrustedMeshContext(request);
    assert(trusted);
    const [portal] = await memory.insert(schema.portalSessions).values({ macAddress, ipAddress, routerId: config.routerId }).returning();
    return { request, trusted, portal, session };
  }
  async function voucher(overrides: Partial<typeof schema.voucherBatches.$inferInsert> = {}, disabled = false, redemptionCount = 0) {
    const [batch] = await memory.insert(schema.voucherBatches).values({ name: "Access fixture", quantity: 1, saleAmountSats: 100, accessDurationMinutes: 5, speedLimitKbps: 2000, createdBy: "test", ...overrides }).returning();
    const [item] = await memory.insert(schema.vouchers).values({ batchId: batch.id, codeHash: randomUUID(), codeCiphertext: "fixture", codeLastFour: "1234", disabled, redemptionCount }).returning();
    return { batch, item };
  }
  const first = await context(), second = await context("10.30.0.198");
  const valid = await voucher();
  const queue = (item: Awaited<ReturnType<typeof voucher>>, owner = first) => service.queueMeshVoucherAccess({ voucherId: item.item.id, portalSessionId: owner.portal.id, contextId: owner.trusted.id, durationMinutes: item.batch.accessDurationMinutes, dataLimitMb: item.batch.dataLimitMb, speedLimitKbps: item.batch.speedLimitKbps });
  let grantId = "";
  try {
    await t.test("One voucher produces one immutable pending order and one consumption", async () => {
      const results = await Promise.all([queue(valid), queue(valid), queue(valid)]);
      grantId = results[0].id;
      assert(results.every(result => result.id === grantId));
      assert.equal((await memory.select().from(schema.meshAccessOrders)).length, 1);
      assert.equal((await memory.select().from(schema.accessGrants)).length, 1);
      assert.equal((await memory.select().from(schema.vouchers).where(eq(schema.vouchers.id, valid.item.id)))[0].redemptionCount, 1);
      const before = (await memory.select().from(schema.meshAccessOrders))[0];
      assert.equal((await queue(valid)).id, grantId);
      const after = (await memory.select().from(schema.meshAccessOrders))[0];
      assert.equal(after.encryptedOrder, before.encryptedOrder);
      assert.equal(after.expiresAt.toISOString(), before.expiresAt.toISOString(), "Retry cannot renew a deadline");
      assert.equal((await service.getMeshAccessStatus(first.request, { grantId }))?.status, "pending");
    });
    await t.test("Disabled, not-yet-valid, expired and exhausted vouchers cannot consume or issue", async () => {
      for (const item of [await voucher({}, true), await voucher({ validFrom: new Date(Date.now() + 60_000) }), await voucher({ validUntil: new Date(Date.now() - 1000) }), await voucher({}, false, 1)]) {
        await assert.rejects(queue(item), /Voucher unavailable/);
        assert.equal((await memory.select().from(schema.vouchers).where(eq(schema.vouchers.id, item.item.id)))[0].redemptionCount, item.item.redemptionCount);
      }
      await assert.rejects(queue(valid, second), /Voucher unavailable/);
      assert.equal((await memory.select().from(schema.accessGrants)).length, 1);
    });
    await t.test("Order persistence failure rolls back voucher use and the pending grant", async () => {
      const item = await voucher();
      await pg.exec(`ALTER TABLE mesh_access_orders ADD CONSTRAINT reject_fixture_order CHECK (voucher_id <> '${item.item.id}'::uuid)`);
      try {
        await assert.rejects(queue(item));
        assert.equal((await memory.select().from(schema.vouchers).where(eq(schema.vouchers.id, item.item.id)))[0].redemptionCount, 0);
        assert.equal((await memory.select().from(schema.accessGrants)).length, 1);
        assert.equal((await memory.select().from(schema.meshAccessOrders)).length, 1);
      } finally {
        await pg.exec("ALTER TABLE mesh_access_orders DROP CONSTRAINT reject_fixture_order");
      }
    });
    await t.test("Context and status remain private to the owning browser cookie", async () => {
      assert.equal(await service.getMeshAccessStatus(second.request, { grantId }), null);
      assert.equal(await service.getTrustedMeshContext(new Request("https://mesh.fixture/")), null);
      const forged = new Request("https://mesh.fixture/", { headers: { cookie: `mesh_session=${first.trusted.id}.${"A".repeat(43)}` } });
      assert.equal(await service.getTrustedMeshContext(forged), null);
      assert.equal(await service.getMeshAccessStatus(forged, { grantId }), null);
    });
    await t.test("A matching router ACK is required; wrong claims or host cannot activate", async () => {
      const claims = await service.claimMeshOrders();
      assert.equal(claims.length, 1);
      const claim = claims[0], order = claim.order;
      const ack = { claimToken: claim.claimToken, active: true, macAddress: order.macAddress, ipAddress: order.ipAddress, server: order.server, user: order.user, expiresAt: order.expiresAt };
      for (const wrong of [{ ...ack, claimToken: "wrong" }, { ...ack, macAddress: second.trusted.macAddress, ipAddress: second.trusted.ipAddress }, { ...ack, server: "other" }, { ...ack, active: false }, { ...ack, expiresAt: new Date(Date.parse(order.expiresAt) + 1000).toISOString() }]) {
        assert.equal(await service.completeMeshOrder(claim.id, wrong), false);
        assert.equal((await service.getMeshAccessStatus(first.request, { grantId }))?.status, "pending");
      }
      await memory.update(schema.meshAccessOrders).set({ claimedAt: new Date(Date.now() - 61_000) }).where(eq(schema.meshAccessOrders.id, claim.id));
      const [reclaimed] = await service.claimMeshOrders();
      assert.equal(reclaimed.id, claim.id);
      assert.equal(reclaimed.order.expiresAt, order.expiresAt, "Host-check failure and lease retry cannot renew the pass");
      assert.notEqual(reclaimed.claimToken, claim.claimToken);
      assert.equal(await service.completeMeshOrder(claim.id, ack), false, "A stale worker cannot activate after its lease was reclaimed");
      ack.claimToken = reclaimed.claimToken;
      assert.equal(await service.completeMeshOrder(claim.id, ack), true);
      assert.equal((await service.getMeshAccessStatus(first.request, { grantId }))?.status, "active");
      assert.equal(await service.completeMeshOrder(claim.id, ack), true, "Duplicate verified ACK is idempotent");
      assert.equal((await memory.select().from(schema.accessGrants))[0].status, "active");
      await memory.update(schema.meshAccessOrders).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.meshAccessOrders.id, claim.id));
      assert.equal((await service.getMeshAccessStatus(first.request, { grantId }))?.status, "expired");
      assert.equal(await service.completeMeshOrder(claim.id, ack), false, "Expired order cannot reactivate");
    });
    await t.test("Verified payment creates one snapshot-bound order; duplicates cannot renew or resend", async () => {
      Object.assign(process.env, { BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: "engine-fixture-key-".repeat(3), MESH_LIGHTNING_ADDRESS: "fixture@blink.sv" });
      const receiptMap = new Map<string, EngineSettlement>();
      let lookups = 0;
      globalThis.fetch = async (url, init) => {
        assert.equal(init?.method, "GET", "Access activation must never send funds");
        assert(String(url).startsWith("https://engine.insats.org/rails/mesh/settlements/"));
        lookups++;
        return Response.json(receiptMap.get(String(url).split("/").pop()!));
      };
      async function payment(owner = first, id = randomUUID(), verified = true) {
        const hash = "ab".repeat(32);
        const receipt: EngineSettlement = { paymentId: id, reference: `mesh-${id}`, amountKes: 10, amountSats: 85, destination: "fixture@blink.sv", status: verified ? "settled" : "registered", collectionConfirmed: true,
          verifiedBitcoinDelivery: verified, paymentHash: verified ? hash : null, sourceTransactionId: verified ? "fixture-send" : null, settledAt: verified ? new Date().toISOString() : null, resolutionRequired: false };
        receiptMap.set(id, receipt);
        await memory.insert(schema.payments).values({ id, portalSessionId: owner.portal.id, provider: "paystack", status: "processing", amountSats: 900,
          metadata: { priceKes: 10, meshContextId: owner.trusted.id, access: { durationMinutes: 5, dataLimitMb: 25, speedLimitKbps: 1500 }, paystack: { verifiedBitcoinDelivery: true, paymentHash: hash, resolutionRequired: true } } });
        return id;
      }
      const id = await payment();
      const result = await service.queueMeshPaidAccess(id);
      assert(result);
      const [row] = await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id));
      const payload = decryptAccess<{ durationMinutes: number; speedLimitKbps: number; dataLimitMb: number; paymentId: string }>(row.encryptedOrder, config);
      assert.equal(payload.durationMinutes, 5);
      assert.equal(payload.speedLimitKbps, 1500);
      assert.equal(payload.dataLimitMb, 25);
      assert.equal(payload.paymentId, id);
      assert.equal(row.status, "queued");
      assert.equal((await service.getMeshAccessStatus(first.request, { paymentId: id }))?.status, "pending");
      assert.deepEqual(await service.queueMeshPaidAccess(id), result);
      const [repeated] = await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id));
      assert.equal(repeated.expiresAt.toISOString(), row.expiresAt.toISOString());
      assert.equal(repeated.encryptedOrder, row.encryptedOrder);
      assert.equal(lookups, 1, "Repeat activation uses the immutable order, not another receipt/send");
      assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0].status, "settled");
      const pendingId = await payment(first, randomUUID(), false);
      await assert.rejects(service.queueMeshPaidAccess(pendingId), /Bitcoin settlement is unconfirmed/);
      assert.equal((await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, pendingId))).length, 0);
      const consumedId = await payment(first, "e92ab0c0-fd6b-43d4-bfcb-57744876bacc");
      assert.equal(await service.queueMeshPaidAccess(consumedId), null);
      assert.equal((await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, consumedId))).length, 0);
      const failingId = await payment();
      const grantsBefore = (await memory.select().from(schema.accessGrants)).length;
      await pg.exec(`ALTER TABLE mesh_access_orders ADD CONSTRAINT reject_paid_fixture_order CHECK (payment_id <> '${failingId}'::uuid)`);
      try {
        await assert.rejects(service.queueMeshPaidAccess(failingId));
        assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, failingId)))[0].status, "processing");
        assert.equal((await memory.select().from(schema.accessGrants)).length, grantsBefore);
        assert.equal((await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, failingId))).length, 0);
      } finally {
        await pg.exec("ALTER TABLE mesh_access_orders DROP CONSTRAINT reject_paid_fixture_order");
      }
      const expiredId = await payment(second);
      await memory.update(schema.meshAccessContexts).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.meshAccessContexts.id, second.trusted.id));
      const lookupsBefore = lookups;
      await assert.rejects(service.queueMeshPaidAccess(expiredId), /attested router context/);
      assert.equal(lookups, lookupsBefore, "Expired context cannot contact the settlement Engine");
    });
    await t.test("Verified Bitika delivery atomically queues automatic access; incomplete receipts and failed persistence grant nothing", async () => {
      const { reconcileBitikaPayment } = await import("../lib/payments/reconcile-bitika");
      Object.assign(process.env, { BITIKA_MODE: "live", BITIKA_API_KEY: "bk_live_fixture", BITIKA_LIGHTNING_ADDRESS: "merchant@blink.sv" });
      const owner = await context("10.30.0.205");
      const transaction = { transaction_code: "qadi_fixture_delivery", status: "fulfilled" as const, amount: 10, sats: 86,
        lightningAddress: "merchant@blink.sv", paymentHash: "cd".repeat(32) };
      const id = randomUUID();
      await memory.insert(schema.payments).values({ id, portalSessionId: owner.portal.id, provider: "bitika", providerInvoiceId: transaction.transaction_code,
        status: "processing", amountSats: 900, metadata: { priceKes: 10, meshContextId: owner.trusted.id,
          access: { durationMinutes: 5, dataLimitMb: 25, speedLimitKbps: 1500 },
          bitika: { mode: "live", amountKes: 10, lightningAddress: transaction.lightningAddress, status: "processing" } } });
      for (const bad of [{ ...transaction, status: "processing" as const }, { ...transaction, status: "payment_failed" as const },
        { ...transaction, sats: 0 }, { ...transaction, paymentHash: null }, { ...transaction, amount: 20 },
        { ...transaction, lightningAddress: "other@blink.sv" }, { ...transaction, transaction_code: "SBX-fixture" }]) {
        await assert.rejects(service.queueMeshBitikaPaidAccess(id, bad));
        assert.equal((await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id))).length, 0);
      }
      const grantsBefore = (await memory.select().from(schema.accessGrants)).length;
      await pg.exec(`ALTER TABLE mesh_access_orders ADD CONSTRAINT reject_bitika_order CHECK (payment_id <> '${id}'::uuid)`);
      try {
        await assert.rejects(service.queueMeshBitikaPaidAccess(id, transaction));
        assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0].status, "processing");
        assert.equal((await memory.select().from(schema.accessGrants)).length, grantsBefore);
      } finally { await pg.exec("ALTER TABLE mesh_access_orders DROP CONSTRAINT reject_bitika_order"); }
      let lookups = 0;
      globalThis.fetch = async (url, init) => {
        assert.equal(init?.method ?? "GET", "GET", "Reconciliation cannot send money or prompt M-Pesa");
        assert.equal(String(url), "https://bitikaserver.up.railway.app/api/v1/transactions/code/" + transaction.transaction_code);
        lookups++;
        return Response.json({ success: true, data: transaction });
      };
      const [payment] = await memory.select().from(schema.payments).where(eq(schema.payments.id, id));
      await Promise.all([reconcileBitikaPayment(payment, true), reconcileBitikaPayment(payment, true)]);
      assert.equal(lookups, 2);
      const [order] = await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id));
      assert.equal((await memory.select().from(schema.accessGrants)).length, grantsBefore + 1);
      assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0].status, "settled");
      assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0].amountSats, 86);
      assert.equal(order.status, "queued");
      const payload = decryptAccess<{ macAddress: string; ipAddress: string; durationMinutes: number }>(order.encryptedOrder, config);
      assert.equal(payload.macAddress, owner.trusted.macAddress);
      assert.equal(payload.ipAddress, "10.30.0.205");
      assert.equal(payload.durationMinutes, 5);
      const again = await service.queueMeshBitikaPaidAccess(id, transaction);
      assert.equal(again.id, order.grantId);
      assert.equal((await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id)))[0].encryptedOrder, order.encryptedOrder);
      assert.equal((await service.getMeshAccessStatus(owner.request, { paymentId: id }))?.status, "pending", "Settlement alone cannot claim router activation");
    });
    await t.test("HTTP status ownership and pre-checkout session checks fail before any provider request", async () => {
      const { GET: status } = await import("../app/api/mesh/access/status/route");
      const own = await status(new Request(`https://mesh.fixture/api/mesh/access/status?grant=${grantId}`, { headers: first.request.headers }));
      assert.equal(own.status, 200);
      assert.equal((await own.json()).status, "expired");
      assert.match(own.headers.get("Cache-Control") ?? "", /private, no-store/);
      const foreign = await status(new Request(`https://mesh.fixture/api/mesh/access/status?grant=${grantId}`, { headers: second.request.headers }));
      assert.equal(foreign.status, 404);
      for (const query of ["", "?grant=invalid", `?grant=${grantId}&payment=${randomUUID()}`]) {
        assert.equal((await status(new Request(`https://mesh.fixture/api/mesh/access/status${query}`, { headers: first.request.headers }))).status, 404);
      }
      const { GET: paymentStatus } = await import("../app/api/payments/[id]/route");
      const [ownedPayment] = await memory.select().from(schema.payments).where(eq(schema.payments.status, "settled"));
      const payment = await paymentStatus(first.request, { params: Promise.resolve({ id: ownedPayment.id }) });
      assert.equal(payment.status, 200);
      assert.equal((await payment.json()).nativeAccess.status, "pending", "Payment settled does not establish an active router session");
      assert.equal((await paymentStatus(second.request, { params: Promise.resolve({ id: ownedPayment.id }) })).status, 404);
      const { POST: checkout } = await import("../app/api/payments/route");
      const body = JSON.stringify({ packageId: randomUUID(), provider: "paystack", phone: "0712345678" });
      const request = () => new Request("https://mesh.fixture/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      assert.equal((await checkout(request())).status, 401, "Missing router-attested session blocks checkout");
      process.env.MESH_NATIVE_ACCESS_COMMISSIONED = "false";
      assert.equal((await checkout(request())).status, 503, "Incomplete commissioning blocks checkout");
      process.env.MESH_NATIVE_ACCESS_COMMISSIONED = "true";
    });
    await t.test("New checkout UUIDs and browser MAC fields cannot evade the prompt throttle", async () => {
      await pg.exec(`CREATE TABLE packages(id uuid PRIMARY KEY,name text NOT NULL,description text,price_kes integer NOT NULL,price_sats integer NOT NULL,duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,active boolean NOT NULL DEFAULT true,sort_order integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
        CREATE TABLE voucher_redemption_limits(scope_key text PRIMARY KEY,window_started_at timestamptz NOT NULL,attempts integer NOT NULL);`);
      const packageId = randomUUID();
      await memory.insert(schema.packages).values({ id: packageId, name: "Fixture", priceKes: 10, priceSats: 85, durationMinutes: 80, speedLimitKbps: 3000 });
      Object.assign(process.env, { PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture", PAYSTACK_ENABLED: "true",
        PAYSTACK_RECEIPT_EMAIL: "fixture@example.org", CHECKOUT_DEVICE_ATTEMPTS_PER_WINDOW: "3", CHECKOUT_PHONE_ATTEMPTS_PER_WINDOW: "5" });
      let providerCalls = 0;
      globalThis.fetch = async () => { providerCalls++; throw new Error("No providers may be called"); };
      const { POST: checkout } = await import("../app/api/payments/route");
      for (let index = 0; index < 4; index++) {
        const response = await checkout(new Request("https://mesh.fixture/api/payments", { method: "POST",
          headers: { "Content-Type": "application/json", cookie: `mesh_session=${first.session}` },
          body: JSON.stringify({ packageId, provider: "paystack", phone: "0700000000", requestId: randomUUID(),
            macAddress: `02:11:22:33:55:0${index}`, ipAddress: "10.30.0.200" }) }));
        // The fixture has no live gateway heartbeat: the first three attempts
        // fail closed at readiness; the fourth hits the durable device limit.
        assert.equal(response.status, index < 3 ? 503 : 429);
        if (index === 3) assert(Number(response.headers.get("retry-after")) > 0);
      }
      assert.equal(providerCalls, 0);
    });
    await t.test("Concurrent checkout references produce one prompt; ambiguity and browser retries retain the purchase", async () => {
      await pg.exec("CREATE TABLE mesh_agent_heartbeat(router_id text PRIMARY KEY,last_seen_at timestamptz NOT NULL)");
      await pg.exec(await readFile("scripts/mesh/checkout-reservations-schema.sql", "utf8"));
      await pg.query("INSERT INTO mesh_agent_heartbeat VALUES($1,now())", [config.routerId]);
      const created = await service.createMeshContext({ macAddress: "06:22:33:44:55:66", ipAddress: "10.30.0.202", server: config.server });
      const url = new URL(created.joinUrl), session = url.searchParams.get("session")!;
      assert.equal(await service.consumeMeshJoin(url.searchParams.get("ticket")!, session), true);
      const [pkg] = await memory.select().from(schema.packages).limit(1);
      const { POST: checkout } = await import("../app/api/payments/route");
      let prompts = 0;
      globalThis.fetch = async (address, init) => {
        if (String(address).startsWith("https://engine.insats.org/rails/mesh/readiness?")) {
          assert.equal(init?.method, "GET");
          return Response.json({ enabled: true, amountKes: 10, amountSats: 85, checkoutReady: true, budgetAvailable: true,
            writeScope: true, funded: true, sourceWalletVerified: true, destinationVerified: true, distinctWallets: true });
        }
        assert.equal(String(address), "https://api.paystack.co/charge");
        assert.equal(init?.method, "POST");
        prompts++;
        throw new Error("Fixture: provider accepted but its response was lost");
      };
      const ids = [randomUUID(), randomUUID()];
      const request = (requestId: string) => new Request("https://mesh.fixture/api/payments", { method: "POST",
        headers: { "Content-Type": "application/json", cookie: `mesh_session=${session}` },
        body: JSON.stringify({ packageId: pkg.id, provider: "paystack", phone: "0700000001", requestId }) });
      const responses = await Promise.all(ids.map(id => checkout(request(id))));
      assert.deepEqual(responses.map(response => response.status).sort(), [202, 409]);
      assert.equal(prompts, 1, "Two tabs must not issue two prompts for the same device");
      const winnerId = ids[responses.findIndex(response => response.status === 202)];
      const loserId = ids.find(id => id !== winnerId)!;
      const [winner] = await memory.select().from(schema.payments).where(eq(schema.payments.id, winnerId));
      const [loser] = await memory.select().from(schema.payments).where(eq(schema.payments.id, loserId));
      assert(winner.metadata.paystackChargeStartedAt);
      assert.equal(winner.status, "processing", "An ambiguous provider response is not a decline");
      assert.equal(loser.status, "invalid", "Only the unissued conflicting request is closed");
      assert.equal(loser.metadata.paystackChargeStartedAt, undefined);
      const retry = await checkout(request(winnerId));
      assert.equal(retry.status, 200);
      assert.equal((await retry.json()).paymentId, winnerId);
      assert.equal(prompts, 1, "Same-reference retry cannot collect again");
      const third = await checkout(request(randomUUID()));
      assert.equal(third.status, 409);
      assert.equal(prompts, 1, "A new reference cannot bypass an uncertain purchase");

      // An interrupted request before the provider reservation is recoverable
      // under the same UUID. It must not return a fake pending checkout forever.
      const recovery = await service.createMeshContext({ macAddress: "06:22:33:44:55:77", ipAddress: "10.30.0.203", server: config.server });
      const recoveryUrl = new URL(recovery.joinUrl), recoverySession = recoveryUrl.searchParams.get("session")!;
      await service.consumeMeshJoin(recoveryUrl.searchParams.get("ticket")!, recoverySession);
      const recoveryId = randomUUID();
      const makeRecoveryRequest = () => new Request("https://mesh.fixture/api/payments", { method: "POST",
        headers: { "Content-Type": "application/json", cookie: `mesh_session=${recoverySession}` },
        body: JSON.stringify({ packageId: pkg.id, provider: "paystack", phone: "0700000002", requestId: recoveryId }) });
      assert.equal((await checkout(makeRecoveryRequest())).status, 202);
      const [interrupted] = await memory.select().from(schema.payments).where(eq(schema.payments.id, recoveryId));
      const { paystackChargeStartedAt: discarded, ...beforeProvider } = interrupted.metadata;
      assert(discarded);
      // Simulates the earlier crash point; no real provider effects exist.
      await memory.update(schema.payments).set({ metadata: beforeProvider }).where(eq(schema.payments.id, recoveryId));
      const before = prompts;
      assert.equal((await checkout(makeRecoveryRequest())).status, 202);
      assert.equal(prompts, before + 1, "An unstarted reference resumes exactly once at the provider boundary");
    });
    await t.test("Bitika goes first without treasury dependency and blocks cross-provider collection while uncertain", async () => {
      Object.assign(process.env, { BITIKA_MODE: "live", BITIKA_API_KEY: "bk_live_fixture", BITIKA_LIGHTNING_ADDRESS: "merchant@blink.sv",
        BITIKA_WEBHOOK_SECRET: "fixture-webhook", BITIKA_ENABLED: "true" });
      const { getPaymentMethods } = await import("../lib/payments/providers");
      assert.deepEqual(getPaymentMethods().map(method => method.id), ["bitika"], "Customers see one M-Pesa method; fallback remains internal");
      assert.equal(getPaymentMethods()[0].label, "M-Pesa");
      const created = await service.createMeshContext({ macAddress: "06:22:33:44:88:99", ipAddress: "10.30.0.204", server: config.server });
      const url = new URL(created.joinUrl), session = url.searchParams.get("session")!;
      await service.consumeMeshJoin(url.searchParams.get("ticket")!, session);
      const [pkg] = await memory.select().from(schema.packages).limit(1);
      const { POST: checkout } = await import("../app/api/payments/route");
      const calls: string[] = [];
      globalThis.fetch = async (address, init) => {
        if (String(address).startsWith("https://engine.insats.org/rails/mesh/readiness?")) return Response.json({ enabled: true, amountKes: 10, amountSats: 85, checkoutReady: true, budgetAvailable: true, writeScope: true, funded: true, sourceWalletVerified: true, destinationVerified: true, distinctWallets: true });
        assert.equal(String(address), "https://bitikaserver.up.railway.app/api/v1/xwift/collect", "No automatic Paystack fallback");
        assert.equal(init?.method, "POST");
        calls.push(new Headers(init?.headers).get("Idempotency-Key")!);
        if (calls.length === 1) throw new Error("Fixture: accepted Bitika request response lost");
        return Response.json({ transaction_code: "qadi_fixture_retry", status: "processing" });
      };
      const id = randomUUID();
      const request = (provider: "bitika" | "paystack", requestId: string) => new Request("https://mesh.fixture/api/payments", { method: "POST",
        headers: { "Content-Type": "application/json", cookie: `mesh_session=${session}` },
        body: JSON.stringify({ packageId: pkg.id, provider, requestId, phone: "0700000099" }) });
      const treasuryFlag = process.env.BLINK_SETTLEMENT_ENABLED;
      process.env.BLINK_SETTLEMENT_ENABLED = "false";
      try {
        assert.equal((await checkout(request("bitika", id))).status, 202);
        assert.equal(calls.length, 1, "Bitika collects without calling our treasury Engine");
      } finally { process.env.BLINK_SETTLEMENT_ENABLED = treasuryFlag; }
      assert.equal((await checkout(request("paystack", randomUUID()))).status, 409, "Uncertain Bitika collection locks the same device across providers");
      assert.equal(calls.length, 1);
      assert.equal((await checkout(request("bitika", id))).status, 201);
      assert.deepEqual(calls, [id, id], "Recovery preserves Bitika's original idempotency key");
      assert.equal((await checkout(request("bitika", id))).status, 200);
      assert.equal(calls.length, 2, "Recorded transaction is returned without another provider call");
      process.env.BITIKA_ENABLED = "false";
      assert.deepEqual(getPaymentMethods().map(method => method.id), ["paystack"], "Unavailable Bitika leaves Paystack usable for new purchases");
      process.env.BITIKA_ENABLED = "true";
    });
    await t.test("Signed controller polling reconciles Bitika without an open customer browser", async () => {
      // Close only fixture records left pending by earlier failure tests.
      await pg.exec("UPDATE payments SET status='invalid' WHERE status IN ('new','processing')");
      const created = await service.createMeshContext({ macAddress: "06:22:33:44:88:AA", ipAddress: "10.30.0.206", server: config.server });
      const url = new URL(created.joinUrl), session = url.searchParams.get("session")!;
      await service.consumeMeshJoin(url.searchParams.get("ticket")!, session);
      const owner = await service.getTrustedMeshContext(new Request("https://mesh.fixture/", { headers: { cookie: `mesh_session=${session}` } }));
      assert(owner);
      const [portal] = await memory.insert(schema.portalSessions).values({ macAddress: owner.macAddress, ipAddress: owner.ipAddress, routerId: config.routerId }).returning();
      const id = randomUUID(), code = "qadi_poll_fixture";
      await memory.insert(schema.payments).values({ id, portalSessionId: portal.id, provider: "bitika", providerInvoiceId: code, amountSats: 999,
        metadata: { meshContextId: owner.id, priceKes: 10, access: { durationMinutes: 5, speedLimitKbps: 3000 },
          bitika: { mode: "live", amountKes: 10, lightningAddress: "merchant@blink.sv", status: "processing" } } });
      let lookups = 0;
      globalThis.fetch = async (address, init) => {
        assert.equal(init?.method ?? "GET", "GET");
        assert.equal(String(address), "https://bitikaserver.up.railway.app/api/v1/transactions/code/" + code);
        lookups++;
        return Response.json({ success: true, data: { transaction_code: code, status: "fulfilled", amount: 10, sats: 86,
          lightningAddress: "merchant@blink.sv", paymentHash: "ef".repeat(32) } });
      };
      const { POST: poll } = await import("../app/api/mesh/gateway/jobs/claim/route");
      const path = "/api/mesh/gateway/jobs/claim", body = "{}";
      assert.equal((await poll(new Request("https://mesh.fixture" + path, { method: "POST", body }))).status, 403);
      assert.equal(lookups, 0);
      const result = await poll(new Request("https://mesh.fixture" + path, { method: "POST", body, headers: meshAgentHeaders(config, path, body) }));
      assert.equal(result.status, 200);
      assert.equal(lookups, 1);
      const data = await result.json();
      assert(data.jobs.some((job: { order: { paymentId: string } }) => job.order.paymentId === id));
      assert.equal((await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0].status, "settled");
    });
    await t.test("Voucher HTTP lookup preserves bounded old stock, blocks new legacy/disabled fallthrough and fails closed on key errors", async () => {
      const names = ["VOUCHER_ENCRYPTION_KEY", "VOUCHER_LOOKUP_KEY", "VOUCHER_LEGACY_ISSUED_BEFORE", "VOUCHER_LEGACY_LOOKUP_UNTIL", "VOUCHER_DEVICE_ATTEMPTS_PER_WINDOW"];
      const values = names.map(name => process.env[name]);
      process.env.VOUCHER_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
      delete process.env.VOUCHER_LOOKUP_KEY;
      process.env.VOUCHER_DEVICE_ATTEMPTS_PER_WINDOW = "100";
      const owner = await context();
      const { POST } = await import("../app/api/vouchers/redeem/route");
      const cutoff = new Date(Date.now() - 20_000);
      process.env.VOUCHER_LEGACY_ISSUED_BEFORE = cutoff.toISOString();
      process.env.VOUCHER_LEGACY_LOOKUP_UNTIL = new Date(Date.now() + 900_000).toISOString();
      const invoke = (code: string) => POST(new Request("https://mesh.fixture/api/vouchers/redeem", {
        method: "POST", headers: { cookie: owner.request.headers.get("cookie")!, "content-type": "application/json" }, body: JSON.stringify({ code }),
      }));
      const stock = async (code: string, legacy: boolean, old: boolean, disabled = false) => {
        const item = await voucher({}, disabled);
        await memory.update(schema.vouchers).set({ codeHash: legacy ? hashLegacyVoucherCode(code) : hashVoucherCode(code),
          createdAt: new Date(Date.now() - (old ? 60_000 : 0)) }).where(eq(schema.vouchers.id, item.item.id));
        return item;
      };
      try {
        await stock("000123", true, true);
        assert.equal((await invoke("000123")).status, 201, "Existing pre-cutoff legacy stock remains usable within compatibility dates");
        await stock("000124", true, false);
        assert.equal((await invoke("000124")).status, 404, "A legacy hash created after the cutoff is never eligible");
        await stock("000125", false, false, true);
        const duplicateLegacy = await stock("000125", true, true);
        assert.equal((await invoke("000125")).status, 404);
        assert.equal((await memory.select().from(schema.vouchers).where(eq(schema.vouchers.id, duplicateLegacy.item.id)))[0].redemptionCount, 0,
          "A disabled current record never falls through to another legacy ticket");
        await stock("000126", true, true);
        process.env.VOUCHER_LEGACY_LOOKUP_UNTIL = new Date(Date.now() - 10_000).toISOString();
        assert.equal((await invoke("000126")).status, 404, "Compatibility expiry retires old hashes");
        await stock("000127", false, false);
        assert.equal((await invoke("000127")).status, 201, "Keyed stock stays usable after legacy expiry");
        process.env.VOUCHER_LOOKUP_KEY = "";
        assert.equal((await invoke("000127")).status, 503, "Bad key config does not silently fall back to SHA lookup");
      } finally {
        for (const [index, name] of names.entries()) {
          if (values[index] === undefined) delete process.env[name]; else process.env[name] = values[index];
        }
      }
    });
    await t.test("Ciphertext, router HMAC, route, body and timestamp tampering fail closed", () => {
      const payload = { private: "fixture-only" };
      const ciphertext = encryptAccess(payload, config);
      assert.deepEqual(decryptAccess(ciphertext, config), payload);
      const parts = ciphertext.split(".");
      parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
      assert.throws(() => decryptAccess(parts.join("."), config));
      assert.throws(() => decryptAccess(ciphertext, { ...config, encryptionKey: Buffer.alloc(32, 8).toString("base64") }));
      const path = "/api/mesh/agent/claim", body = '{"test":true}', headers = meshAgentHeaders(config, path, body);
      const request = new Request(`https://mesh.fixture${path}`, { method: "POST", headers, body });
      assert.equal(verifyMeshAgent(request, body, config), true);
      assert.equal(verifyMeshAgent(request, body + " ", config), false);
      assert.equal(verifyMeshAgent(new Request("https://mesh.fixture/api/other", { method: "POST", headers, body }), body, config), false);
      assert.equal(verifyMeshAgent(request, body, config, Date.now() + 61_000), false);
      assert.equal(verifyMeshAgent(new Request(`https://mesh.fixture${path}`, { method: "POST", headers: { ...headers, "x-mesh-router": "other" }, body }), body, config), false);
    });
  } finally {
    for (const [key, method] of savedMethods) Reflect.set(db, key, method);
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    await pg.close();
  }
});
