import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { bitikaTransactionCodeSchema, BitikaClient, createBitikaProvider, getBitikaReadiness, normalizeKenyanPhone, readBitikaConfig, verifiedBitikaSnapshot, verifyBitikaSignature, type BitikaTransaction } from "../lib/payments/bitika";
import { bitikaSettlementSql } from "../lib/payments/bitika-settlement";
import { getPaystackReadiness } from "../lib/payments/paystack";
import * as schema from "../lib/db/schema";

const destination = "merchant@blink.sv";
const hash = "ab".repeat(32);
const context = { bitika: { mode: "live", amountKes: 100, lightningAddress: destination } };
const fulfilled: BitikaTransaction = { transaction_code: "BK-FIXTURE", status: "fulfilled", amount: 100, sats: 900, lightningAddress: destination, paymentHash: hash };

test("Bitika accepts qadi references in collection and lookup without weakening environment checks", async () => {
  const code = "qadi_e74f5e3f92b28fbb9079d23f";
  assert.equal(bitikaTransactionCodeSchema.parse(code), code);
  for (const unsafe of ["../qadi_test", "qadi_test?status=fulfilled", "qadi_test/next", "qadi test", "a".repeat(101)]) {
    assert.equal(bitikaTransactionCodeSchema.safeParse(unsafe).success, false);
  }
  const calls: string[] = [];
  const client = new BitikaClient({ mode: "live", apiKey: "bk_live_fixture", lightningAddress: destination }, async (url) => {
    calls.push(String(url));
    return String(url).endsWith("/collect")
      ? Response.json({ transaction_code: code, status: "processing" })
      : Response.json({ success: true, data: { ...fulfilled, transaction_code: code } });
  });
  assert.equal((await client.collect({ paymentId: randomUUID(), amountKes: 100, phone: "0712345678" })).transaction_code, code);
  assert.equal(verifiedBitikaSnapshot(await client.getTransaction(code), context).status, "settled");
  assert.ok(calls[1].endsWith(`/transactions/code/${code}`));
  await assert.rejects(client.getTransaction("SBX-FIXTURE"), /environment/);
  const sandbox = new BitikaClient({ mode: "test", apiKey: "bk_test_fixture", lightningAddress: destination }, async () => { throw new Error("Must not request live reference"); });
  await assert.rejects(sandbox.getTransaction(code), /environment/);
});

test("Live PENDING acknowledgements retain the code but cannot authorize paid access", async () => {
  const code = "qadi_8e55d5ef393542a16c1ea4b4";
  let calls = 0;
  const client = new BitikaClient({ mode: "live", apiKey: "bk_live_fixture", lightningAddress: destination }, async () => {
    calls++;
    return Response.json({ status: "PENDING", message: "STK push sent", charged_kes: 10, transaction_code: code }, { status: 201 });
  });
  const invoice = await createBitikaProvider(client).createCheckout({ paymentId: randomUUID(), amountKes: 10, amountSats: 86, packageName: "80 minutes", phone: "0712345678" });
  assert.equal(invoice.id, code);
  assert.equal((invoice.metadata.bitika as {status:string}).status, "processing");
  assert.equal(calls, 1);
  assert.notEqual(verifiedBitikaSnapshot({ ...fulfilled, transaction_code: code, amount: 10, status: "processing", paymentHash: null }, { bitika: { ...context.bitika, amountKes: 10 } }).status, "settled");
  const unknown = new BitikaClient(client.config, async () => Response.json({ transaction_code: code, status: "UNKNOWN" }));
  await assert.rejects(unknown.collect({ paymentId: randomUUID(), amountKes: 10, phone: "0712345678" }), /Don’t pay again/);
});

test("Bitika mode, availability, phones and CHAP-independent provider contract", async () => {
  assert.equal(normalizeKenyanPhone("+254 712 345 678"), "254712345678");
  assert.equal(normalizeKenyanPhone("0712-345-678"), "254712345678");
  assert.equal(normalizeKenyanPhone("0112 345 678"), "254112345678");
  assert.throws(() => normalizeKenyanPhone("1234"));
  assert.throws(() => readBitikaConfig({ BITIKA_MODE: "test", BITIKA_API_KEY: "bk_live_fixture", BITIKA_LIGHTNING_ADDRESS: destination }));
  const testEnv = { BITIKA_MODE: "test", BITIKA_API_KEY: "bk_test_fixture", BITIKA_LIGHTNING_ADDRESS: destination, BITIKA_ENABLED: "true", BITIKA_WEBHOOK_SECRET: "fixture-secret" };
  assert.equal(getBitikaReadiness(testEnv).checkoutReady, false, "Test credentials never enable real purchases");
  assert.equal(getBitikaReadiness({}).configured, false);
  const client = new BitikaClient(readBitikaConfig(testEnv), async () => { throw new Error("Must not initiate sandbox from real checkout"); });
  await assert.rejects(createBitikaProvider(client).createCheckout({ paymentId: randomUUID(), amountKes: 100, amountSats: 900, packageName: "Fixture", phone: "0712345678" }), /cannot buy real/);
});

test("Only delivered Bitcoin with the correct amount/destination is settlement", () => {
  assert.equal(verifiedBitikaSnapshot(fulfilled, context).status, "settled");
  for (const status of ["processing", "processing_payment", "payment_failed", "failed"] as const) {
    const snapshot = verifiedBitikaSnapshot({ ...fulfilled, status, paymentHash: null }, context);
    assert.notEqual(snapshot.status, "settled");
    assert.throws(() => bitikaSettlementSql(randomUUID(), fulfilled.transaction_code, snapshot));
  }
  assert.equal(verifiedBitikaSnapshot({ ...fulfilled, status: "payment_failed", paymentHash: null }, context).resolutionRequired, true);
  for (const invalid of [{ ...fulfilled, amount: 99 }, { ...fulfilled, lightningAddress: "wrong@blink.sv" }, { ...fulfilled, paymentHash: null }, { ...fulfilled, sats: 0 }, { ...fulfilled, transaction_code: "SBX-TEST" }]) assert.throws(() => verifiedBitikaSnapshot(invalid, context));
  const simulation = verifiedBitikaSnapshot({ ...fulfilled, transaction_code: "SBX-TEST" }, { bitika: { ...context.bitika, mode: "test" } });
  assert.throws(() => bitikaSettlementSql(randomUUID(), "SBX-TEST", simulation), /live/);
});

test("Signatures require the exact raw body and a bounded, valid timestamp", () => {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);
  const body = '{"event":"payment.completed"}';
  const signature = createHmac("sha256", "fixture-secret").update(`${timestamp}.${body}`).digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(verifyBitikaSignature(body, header, "fixture-secret", now), true);
  assert.equal(verifyBitikaSignature(body + " ", header, "fixture-secret", now), false);
  assert.equal(verifyBitikaSignature(body, header, "fixture-secret", now + 301_000), false);
  for (const bad of [`t=NaN,v1=${signature}`, `t=${timestamp},v1=abc`, `t=${timestamp},t=${timestamp},v1=${signature}`, `t=${timestamp},v1=xx${signature.slice(2)}`, null]) assert.equal(verifyBitikaSignature(body, bad, "fixture-secret", now), false);
});

test("The adapter uses a stable reference, refuses redirects and sanitizes provider errors", async () => {
  const id = randomUUID();
  let body: Record<string, string> | undefined;
  const client = new BitikaClient({ mode: "test", apiKey: "bk_test_fixture", lightningAddress: destination }, async (url, init) => {
    assert.equal(url, "https://bitikaserver.up.railway.app/api/v1/xwift/collect");
    assert.equal(new Headers(init?.headers).get("Idempotency-Key"), id);
    assert.equal(init?.redirect, "error");
    body = JSON.parse(String(init?.body));
    return Response.json({ transaction_code: "SBX-FIXTURE", status: "processing" }, { status: 201 });
  });
  await client.collect({ paymentId: id, amountKes: 100, phone: "0712345678" });
  assert.deepEqual(body, { amount: "100", phone: "254712345678", lightningAddress: destination });
  const failing = new BitikaClient(client.config, async () => new Response("bk_test_secret and private phone", { status: 500 }));
  await assert.rejects(failing.collect({ paymentId: id, amountKes: 100, phone: "0712345678" }), error => error instanceof Error && !/secret|private phone/.test(error.message));
});

test("A generic live HTTP 400 retains a neutral message and makes no automatic retry", async () => {
  let attempts = 0;
  const client = new BitikaClient({ mode: "live", apiKey: "bk_live_fixture", lightningAddress: destination }, async () => {
    attempts++;
    return Response.json({ code: 400, message: "An unexpected error occurred. Private provider detail." }, { status: 400 });
  });
  await assert.rejects(client.collect({ paymentId: randomUUID(), amountKes: 10, phone: "0712345678" }), error =>
    error instanceof Error && /Keep this payment open/.test(error.message) && !/phone number|pass amount|Private provider detail/.test(error.message));
  assert.equal(attempts, 1);
});

test("HTTP integration with an isolated PostgreSQL database and mocked provider", async t => {
  const savedEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", BITIKA_ENABLED: "true", BITIKA_MODE: "live", BITIKA_API_KEY: "bk_live_fixture", BITIKA_LIGHTNING_ADDRESS: destination, BITIKA_WEBHOOK_SECRET: "fixture-webhook", BTCPAY_SERVER_URL: "https://btcpay.fixture.invalid", BTCPAY_STORE_ID: "fixture", BTCPAY_API_KEY: "fixture", BTCPAY_WEBHOOK_SECRET: "btcpay-fixture", PAYMENT_BOOTSTRAP_ENABLED: "false" });
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE payment_status AS ENUM ('new','processing','settled','expired','invalid','refunded');
    CREATE TYPE access_status AS ENUM ('pending','active','expired','revoked','failed');
    CREATE TYPE router_job_status AS ENUM ('queued','claimed','completed','failed');
    CREATE TYPE router_job_type AS ENUM ('grant_access','revoke_access','sync_walled_garden');
    CREATE TABLE packages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, price_kes integer NOT NULL DEFAULT 0, price_sats integer NOT NULL, duration_minutes integer NOT NULL, data_limit_mb integer, speed_limit_kbps integer, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE portal_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mac_address text NOT NULL, ip_address text, router_id text, login_url text, original_url text, user_agent text, created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portal_session_id uuid REFERENCES portal_sessions, package_id uuid REFERENCES packages, provider text NOT NULL DEFAULT 'btcpay', provider_invoice_id text UNIQUE, status payment_status NOT NULL DEFAULT 'new', amount_sats integer NOT NULL, checkout_url text, metadata jsonb NOT NULL DEFAULT '{}', settled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE access_grants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portal_session_id uuid REFERENCES portal_sessions, payment_id uuid REFERENCES payments, voucher_id uuid, mac_address text NOT NULL, status access_status NOT NULL DEFAULT 'pending', starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, data_limit_mb integer, speed_limit_kbps integer, purpose text NOT NULL DEFAULT 'paid', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE router_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type router_job_type NOT NULL, status router_job_status NOT NULL DEFAULT 'queued', payload jsonb NOT NULL CHECK (payload->>'routerId' <> 'reject-router'), attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 5, available_at timestamptz NOT NULL DEFAULT now(), claimed_at timestamptz, completed_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
  `);
  const memory = drizzle(pg, { schema });
  const { db } = await import("../lib/db");
  const savedMethods = new Map<string, unknown>();
  for (const key of ["select", "insert", "update", "execute"]) {
    savedMethods.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const transactions = new Map<string, BitikaTransaction>();
  const paystackTransactions = new Map<string, Record<string, unknown>>();
  const initiations = new Map<string, { body: string; code: string }>();
  let throwAfterAccept = false;
  let collections = 0;
  let bitcoinInvoices = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/xwift/collect")) {
      collections++;
      const key = new Headers(init?.headers).get("Idempotency-Key")!;
      const body = String(init?.body);
      const existing = initiations.get(key);
      if (existing && existing.body !== body) return Response.json({}, { status: 409 });
      const values = JSON.parse(body) as { amount: string; lightningAddress: string };
      // Exercise new references through the real signed webhook, database
      // matching, duplicate delivery and fulfillment reconciliation handlers.
      const code = existing?.code ?? "qadi_" + key.replaceAll("-", "");
      initiations.set(key, { body, code });
      if (!transactions.has(code)) transactions.set(code, { ...fulfilled, transaction_code: code, amount: Number(values.amount), lightningAddress: values.lightningAddress, status: "processing" });
      if (throwAfterAccept) { throwAfterAccept = false; throw new Error("Ambiguous fixture timeout"); }
      return Response.json({ transaction_code: code, status: "processing" }, { status: 201 });
    }
    if (url.includes("/transactions/code/")) return Response.json({ success: true, data: transactions.get(decodeURIComponent(url.split("/").pop()!)) });
    if (url.startsWith("https://api.paystack.co/transaction/verify/")) return Response.json({ status: true, data: paystackTransactions.get(decodeURIComponent(url.split("/").pop()!)) });
    if (url.startsWith("https://btcpay.fixture.invalid/") && url.endsWith("/invoices")) {
      bitcoinInvoices++;
      return Response.json({ id: "BTC-" + randomUUID(), checkoutLink: "https://btcpay.fixture.invalid/checkout", status: "New" });
    }
    throw new Error("Unexpected network call in isolated payment test");
  };
  const { POST: createPayment } = await import("../app/api/payments/route");
  const { POST: webhook } = await import("../app/api/webhooks/bitika/route");
  const { POST: paystackWebhook } = await import("../app/api/webhooks/paystack/route");
  const { POST: bitcoinWebhook } = await import("../app/api/webhooks/btcpay/route");
  const { GET: paymentStatus } = await import("../app/api/payments/[id]/route");
  const { getPaymentMethods } = await import("../lib/payments/providers");
  const packageId = randomUUID();
  await memory.insert(schema.packages).values({ id: packageId, name: "Fixture pass", priceKes: 100, priceSats: 1000, durationMinutes: 5, speedLimitKbps: 2000 });
  const input = (requestId = randomUUID(), routerId = "mesh-fixture-001") => ({ requestId, packageId, provider: "bitika", macAddress: "02:11:22:33:44:55", ipAddress: "10.30.0.199", routerId, phone: "0712345678" });
  const create = (body: ReturnType<typeof input> | Record<string, unknown>) => createPayment(new Request("https://mesh.fixture/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  const deliver = (code: string, event = "payment.completed") => {
    const body = JSON.stringify({ id: "evt-fixture", event, data: { transaction_code: code } });
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", "fixture-webhook").update(`${timestamp}.${body}`).digest("hex");
    return webhook(new Request("https://mesh.fixture/api/webhooks/bitika", { method: "POST", headers: { "X-Bitika-Signature": `t=${timestamp},v1=${sig}` }, body }));
  };
  const counts = async () => (await pg.query<{ grants: number; jobs: number }>("SELECT (SELECT count(*)::int FROM access_grants) AS grants, (SELECT count(*)::int FROM router_jobs) AS jobs")).rows[0];
  try {
    await t.test("retries after ambiguous acceptance use one transaction and bind the request", async () => {
      const body = input();
      throwAfterAccept = true;
      const uncertain = await create(body);
      assert.equal(uncertain.status, 202);
      assert.deepEqual(await uncertain.json(), { paymentId: body.requestId, checkoutUrl: `/pay/${body.requestId}`, paymentPending: true });
      assert.deepEqual(await counts(), { grants: 0, jobs: 0 }, "An uncertain prompt is not a paid allowance");
      assert.equal((await create(body)).status, 201);
      assert.equal(initiations.size, 1);
      assert.equal((await create({ ...body, phone: "0799999999" })).status, 409);
      assert.equal((await create(body)).status, 200);
      assert.equal(collections, 2);
      assert.deepEqual(await counts(), { grants: 0, jobs: 0 });
    });
    await t.test("duplicate signed delivery creates exactly one atomic router-targeted grant", async () => {
      const code = [...transactions.keys()][0];
      transactions.set(code, { ...transactions.get(code)!, status: "fulfilled" });
      const results = await Promise.all([deliver(code), deliver(code), deliver(code)]);
      assert(results.every(response => response.status === 200));
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
      const [job] = await memory.select().from(schema.routerJobs);
      assert.equal(job.payload.routerId, "mesh-fixture-001");
      assert.equal(job.payload.durationMinutes, 5);
      const [payment] = await memory.select().from(schema.payments);
      assert.equal(payment.status, "settled");
      assert.equal(payment.amountSats, 900, "Account actual Bitcoin delivered, not the displayed BTC package price");
      transactions.set(code, { ...transactions.get(code)!, status: "processing_payment", paymentHash: null });
      assert.equal((await deliver(code, "transaction.updated")).status, 200);
      assert.equal((await memory.select().from(schema.payments))[0].status, "settled");
    });
    await t.test("decline and collected-but-undelivered money never grant access", async () => {
      for (const status of ["failed", "payment_failed"] as const) {
        const body = input();
        await create(body);
        const code = initiations.get(body.requestId)!.code;
        transactions.set(code, { ...transactions.get(code)!, status, paymentHash: null });
        assert.equal((await deliver(code, "payment.failed")).status, 200);
        const result = await paymentStatus(new Request("https://mesh.fixture"), { params: Promise.resolve({ id: body.requestId }) });
        const data = await result.json();
        assert.equal(data.status, status === "failed" ? "invalid" : "processing");
        assert.equal(data.resolutionRequired, status === "payment_failed");
      }
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("wrong purchase amount or destination cannot settle", async () => {
      const body = input(); await create(body);
      const code = initiations.get(body.requestId)!.code;
      const original = transactions.get(code)!;
      for (const update of [{ amount: 101 }, { lightningAddress: "wrong@blink.sv" }]) {
        transactions.set(code, { ...original, ...update, status: "fulfilled" });
        assert.equal((await deliver(code)).status, 503);
      }
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("job insertion failure rolls back both settlement and allowance", async () => {
      const body = input(randomUUID(), "reject-router"); await create(body);
      const code = initiations.get(body.requestId)!.code;
      transactions.set(code, { ...transactions.get(code)!, status: "fulfilled" });
      assert.equal((await deliver(code)).status, 503);
      const result = await pg.query<{ status: string }>("SELECT status FROM payments WHERE id=$1", [body.requestId]);
      assert.equal(result.rows[0].status, "new");
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("BTCPay works with Bitika disabled and cannot reconcile Bitika receipts", async () => {
      process.env.BITIKA_ENABLED = "false";
      assert.deepEqual(getPaymentMethods().map(method => method.id), ["btcpay"]);
      assert.equal((await create({ ...input(), provider: "btcpay" })).status, 201);
      assert.equal(bitcoinInvoices, 1);
      assert.equal((await create(input())).status, 503);
      const body = JSON.stringify({ invoiceId: [...transactions.keys()][0] });
      const signature = createHmac("sha256", "btcpay-fixture").update(body).digest("hex");
      assert.equal((await bitcoinWebhook(new Request("https://mesh.fixture", { method: "POST", headers: { "btcpay-sig": "sha256=" + signature }, body }))).status, 200);
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("sandbox webhook is acknowledged without sales/grants, sandbox key cannot checkout", async () => {
      process.env.BITIKA_ENABLED = "true"; process.env.BITIKA_MODE = "test"; process.env.BITIKA_API_KEY = "bk_test_fixture";
      assert.equal((await create(input())).status, 503);
      const result = await deliver("SBX-FIXTURE");
      assert.equal(result.status, 200);
      assert.equal((await result.json()).sandbox, true);
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("Paystack remains gated; verified duplicate fiat callbacks record collection without granting internet", async () => {
      Object.assign(process.env, { PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture", PAYSTACK_ENABLED: "true", PAYSTACK_RECEIPT_EMAIL: "payer@example.org" });
      assert.equal((await create({ ...input(), provider: "paystack" })).status, 503);
      assert.deepEqual(getPaymentMethods().map(method => method.id), ["btcpay"]);
      const id = randomUUID();
      const reference = `mesh-${id}`;
      await memory.insert(schema.payments).values({ id, provider: "paystack", providerInvoiceId: reference, amountSats: 1000,
        metadata: { paystack: { mode: "live", paymentId: id, amountKes: 100, status: "ongoing", bitcoinSettlement: "pending" } } });
      paystackTransactions.set(reference, { reference, status: "success", amount: 10_000, currency: "KES", domain: "live", channel: "mobile_money", metadata: { tag: "mesh", source: "mesh", meshPaymentId: id } });
      const body = JSON.stringify({ event: "charge.success", data: { reference } });
      const signature = createHmac("sha512", "sk_live_fixture").update(body).digest("hex");
      const deliverPaystack = (raw = body, sig = signature) => paystackWebhook(new Request("https://mesh.fixture/api/webhooks/paystack", { method: "POST", headers: { "x-paystack-signature": sig }, body: raw }));
      assert.equal((await deliverPaystack(body + " ")).status, 401);
      assert.equal((await deliverPaystack()).status, 200);
      assert.equal((await deliverPaystack()).status, 200);
      const result = await paymentStatus(new Request("https://mesh.fixture"), { params: Promise.resolve({ id }) });
      const data = await result.json();
      assert.equal(data.status, "processing");
      assert.equal(data.collectionConfirmed, true);
      assert.equal(data.resolutionRequired, true);
      const record = (await pg.query<{ amount_sats: number; settled_at: string | null }>("SELECT amount_sats, settled_at FROM payments WHERE id=$1", [id])).rows[0];
      assert.equal(record.amount_sats, 1000, "Fiat collection must not be counted as actual BTC received");
      assert.equal(record.settled_at, null);
      assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
    });
    await t.test("Verified Engine Bitcoin receipt is recorded without inventing an activated router pass", async () => {
      Object.assign(process.env, { BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: "mesh-http-fixture-key-at-least-32-bytes", MESH_LIGHTNING_ADDRESS: destination });
      const providerFetch = globalThis.fetch;
      const id = randomUUID();
      const reference = `mesh-${id}`;
      await memory.insert(schema.payments).values({ id, provider: "paystack", providerInvoiceId: reference, amountSats: 1000,
        metadata: { paystack: { mode: "live", paymentId: id, amountKes: 10, status: "ongoing", bitcoinSettlement: "pending" } } });
      paystackTransactions.set(reference, { reference, status: "success", amount: 1000, currency: "KES", domain: "live", channel: "mobile_money", metadata: { tag: "mesh", source: "mesh", meshPaymentId: id } });
      globalThis.fetch = async (url, init) => String(url).startsWith("https://engine.insats.org/rails/mesh/")
        ? Response.json({ paymentId: id, reference, amountKes: 10, amountSats: 85, destination, status: "settled", collectionConfirmed: true,
          verifiedBitcoinDelivery: true, paymentHash: "cd".repeat(32), sourceTransactionId: "engine-tx", settledAt: new Date().toISOString(), resolutionRequired: false })
        : providerFetch(url, init);
      try {
        assert.equal((await create({ ...input(), provider: "paystack" })).status, 503);
        const body = JSON.stringify({ event: "charge.success", data: { reference } });
        const signature = createHmac("sha512", "sk_live_fixture").update(body).digest("hex");
        for (let index = 0; index < 2; index++) {
          assert.equal((await paystackWebhook(new Request("https://mesh.fixture/api/webhooks/paystack", { method: "POST", headers: { "x-paystack-signature": signature }, body }))).status, 200);
        }
        const [payment] = await memory.select().from(schema.payments).where(eq(schema.payments.id, id));
        const details = payment.metadata.paystack as Record<string, unknown>;
        assert.equal(details.bitcoinSettlement, "settled");
        assert.equal(details.verifiedBitcoinDelivery, true);
        assert.equal(details.amountSats, 85);
        assert.equal(details.sourceTransactionId, "engine-tx");
        assert.equal(details.accessCommissioningRequired, true);
        assert.equal(payment.status, "processing");
        assert.deepEqual(await counts(), { grants: 1, jobs: 1 });
      } finally {
        globalThis.fetch = providerFetch;
        delete process.env.BLINK_SETTLEMENT_ENABLED;
        delete process.env.INSATS_MESH_SERVICE_KEY;
        delete process.env.MESH_LIGHTNING_ADDRESS;
      }
    });
    await t.test("Enabled native checkout never queues access while Bitcoin delivery is still pending", async () => {
      const automaticEnv = {
        BLINK_SETTLEMENT_ENABLED: "true", INSATS_MESH_SERVICE_KEY: "mesh-http-fixture-key-at-least-32-bytes",
        MESH_LIGHTNING_ADDRESS: destination, MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
        MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
        MESH_ROUTER_SERVICE_KEY: "mesh-fixture-router-service-key-at-least-32-bytes", MESH_ACCESS_ROUTER_ID: "KM-LAB-001",
      };
      const previousEnv = Object.fromEntries(Object.keys(automaticEnv).map(key => [key, process.env[key]]));
      const providerFetch = globalThis.fetch;
      Object.assign(process.env, automaticEnv);
      assert.equal(getPaystackReadiness().checkoutReady, true);
      const before = await counts();
      const id = randomUUID();
      const reference = `mesh-${id}`;
      await memory.insert(schema.payments).values({ id, provider: "paystack", providerInvoiceId: reference, amountSats: 1000,
        metadata: { paystack: { mode: "live", paymentId: id, amountKes: 10, status: "ongoing", bitcoinSettlement: "pending" } } });
      paystackTransactions.set(reference, { reference, status: "success", amount: 1000, currency: "KES", domain: "live", channel: "mobile_money", metadata: { tag: "mesh", source: "mesh", meshPaymentId: id } });
      let engineChecks = 0;
      globalThis.fetch = async (url, init) => {
        if (!String(url).startsWith("https://engine.insats.org/rails/mesh/")) return providerFetch(url, init);
        engineChecks++;
        return Response.json({ paymentId: id, reference, amountKes: 10, amountSats: 85, destination,
          status: "send_started", collectionConfirmed: true, verifiedBitcoinDelivery: false,
          paymentHash: "cd".repeat(32), sourceTransactionId: null, settledAt: null, resolutionRequired: true });
      };
      try {
        const body = JSON.stringify({ event: "charge.success", data: { reference } });
        const signature = createHmac("sha512", "sk_live_fixture").update(body).digest("hex");
        assert.equal((await paystackWebhook(new Request("https://mesh.fixture/api/webhooks/paystack", { method: "POST", headers: { "x-paystack-signature": signature }, body }))).status, 200);
        assert.equal(engineChecks, 2);
        const [payment] = await memory.select().from(schema.payments).where(eq(schema.payments.id, id));
        assert.equal(payment.status, "processing");
        assert.equal((payment.metadata.paystack as Record<string, unknown>).verifiedBitcoinDelivery, false);
        assert.deepEqual(await counts(), before);
      } finally {
        globalThis.fetch = providerFetch;
        for (const [key, value] of Object.entries(previousEnv)) {
          if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
      }
    });
  } finally {
    for (const [key, value] of savedMethods) Reflect.set(db, key, value);
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
    await pg.close();
  }
});
