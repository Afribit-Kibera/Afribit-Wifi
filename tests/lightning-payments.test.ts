import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { BlinkReceiveClient, readBlinkConfig } from "../lib/payments/blink";
import { bitcoinPriceKes } from "../lib/payments/bitcoin-price";

test("Bitcoin discount is taken off the KES price, rounded in the buyer's favour", () => {
  assert.deepEqual(bitcoinPriceKes(100, 5), { amountKes: 95, savedKes: 5 });
  assert.deepEqual(bitcoinPriceKes(20, 5), { amountKes: 19, savedKes: 1 });
  assert.deepEqual(bitcoinPriceKes(30, 2.5), { amountKes: 29, savedKes: 1 });
  assert.deepEqual(bitcoinPriceKes(50, 0), { amountKes: 50, savedKes: 0 });
  assert.equal(bitcoinPriceKes(1, 50).amountKes, 1, "Never free");
});

test("Live KES price must be fresh and in KES", async () => {
  const config = readBlinkConfig({ BLINK_API_KEY: "blink_fixture", BLINK_BTC_WALLET_ID: randomUUID() });
  const price = (details: Record<string, unknown>) => new BlinkReceiveClient(config, async () => Response.json({ data: { realtimePrice: {
    timestamp: Math.floor(Date.now() / 1000), denominatorCurrencyDetails: { id: "KES", fractionDigits: 2 }, btcSatPrice: { base: 9_886_363_000_000, offset: 12 }, ...details } } }));
  assert.equal(Number((await price({}).kesCentsPerSat()).toFixed(6)), 9.886363);
  await assert.rejects(price({ timestamp: Math.floor(Date.now() / 1000) - 3600 }).kesCentsPerSat(), /price is unavailable/);
  await assert.rejects(price({ denominatorCurrencyDetails: { id: "USD", fractionDigits: 2 } }).kesCentsPerSat(), /price is unavailable/);
});

test("Bitcoin-only purchase: invoice, payment, router handoff and expiry", async t => {
  const originalEnv = { ...process.env };
  const walletId = randomUUID();
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
    MESH_ACCESS_ROUTER_ID: "KM-LAB-001", MESH_ROUTER_SERVICE_KEY: "router-fixture-key-".repeat(3), MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
    BLINK_API_KEY: "blink_fixture", BLINK_BTC_WALLET_ID: walletId });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("No network calls in Lightning tests"); };
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE access_status AS ENUM ('pending','active','expired','revoked','failed');
    CREATE TYPE payment_status AS ENUM ('new','processing','settled','expired','invalid','refunded');
    CREATE TABLE packages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,description text,price_kes integer NOT NULL DEFAULT 0,price_sats integer NOT NULL,duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,active boolean NOT NULL DEFAULT true,sort_order integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE portal_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mac_address text NOT NULL,ip_address text,router_id text,login_url text,original_url text,user_agent text,created_at timestamptz NOT NULL DEFAULT now(),last_seen_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE payments(id uuid PRIMARY KEY,portal_session_id uuid,package_id uuid REFERENCES packages,provider text NOT NULL DEFAULT 'btcpay',provider_invoice_id text UNIQUE,status payment_status NOT NULL DEFAULT 'new',amount_sats integer NOT NULL,checkout_url text,metadata jsonb NOT NULL DEFAULT '{}',settled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE voucher_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,package_id uuid REFERENCES packages,quantity integer NOT NULL,sale_amount_sats integer NOT NULL,access_duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,valid_from timestamptz,valid_until timestamptz,max_redemptions integer NOT NULL DEFAULT 1,prefix text NOT NULL DEFAULT '3W',created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE vouchers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),batch_id uuid NOT NULL REFERENCES voucher_batches,code_hash text NOT NULL UNIQUE,code_ciphertext text NOT NULL,code_last_four text NOT NULL,redemption_count integer NOT NULL DEFAULT 0,disabled boolean NOT NULL DEFAULT false,last_redeemed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE access_grants(id uuid PRIMARY KEY,portal_session_id uuid,payment_id uuid REFERENCES payments,voucher_id uuid,mac_address text NOT NULL,status access_status NOT NULL DEFAULT 'pending',starts_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,data_limit_mb integer,speed_limit_kbps integer,purpose text NOT NULL DEFAULT 'paid',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
  `);
  for (const file of ["automatic-access-schema.sql", "checkout-reservations-schema.sql", "device-passes-schema.sql", "lightning-checkout-schema.sql"]) await pg.exec(await readFile(`scripts/mesh/${file}`, "utf8"));
  const memory = drizzle(pg, { schema });
  const { db } = await import("../lib/db");
  const saved = new Map<string, unknown>();
  for (const key of ["select", "insert", "update", "delete", "execute", "transaction"]) {
    saved.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const service = await import("../lib/mesh-access/service");
  const lightning = await import("../lib/payments/lightning");
  const { reserveMeshCheckout } = await import("../lib/mesh-access/checkout-reservation");
  const settings = await import("../lib/settings");
  const { readMeshAccessConfig } = await import("../lib/mesh-access/config");
  const config = readMeshAccessConfig();

  // A fake Blink wallet: creates invoices for the exact amount and reports a settable status.
  let blinkStatus = "PENDING";
  const invoices = new Map<string, { paymentRequest: string; paymentHash: string; satoshis: number }>();
  const blink = new BlinkReceiveClient(readBlinkConfig(), async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("MeshPrice")) return Response.json({ data: { realtimePrice: { timestamp: Math.floor(Date.now() / 1000),
      denominatorCurrencyDetails: { id: "KES", fractionDigits: 2 }, btcSatPrice: { base: 10_000_000_000_000, offset: 12 } } } }); // 10 KES cents per sat
    if (body.query.includes("MeshWalletCheck")) return Response.json({ data: { me: { defaultAccount: { wallets: [{ id: walletId, walletCurrency: "BTC" }] } } } });
    if (body.query.includes("MeshInvoiceCreate")) {
      assert.equal(body.variables.input.expiresIn, lightning.lightningInvoiceMinutes);
      const hash = randomUUID().replaceAll("-", "").repeat(2);
      const invoice = { paymentRequest: `lnbc${body.variables.input.amount}n1${hash.slice(0, 20)}`, paymentHash: hash, satoshis: body.variables.input.amount };
      invoices.set(invoice.paymentRequest, invoice);
      return Response.json({ data: { lnInvoiceCreate: { errors: [], invoice } } });
    }
    const invoice = invoices.get(body.variables.input.paymentRequest)!;
    return Response.json({ data: { lnInvoicePaymentStatusByPaymentRequest: { status: blinkStatus, paymentHash: invoice.paymentHash, paymentRequest: invoice.paymentRequest } } });
  });
  const provider = lightning.createLightningProvider(blink);

  let ip = 20;
  async function device(mac: string) {
    const created = await service.createMeshContext({ macAddress: mac, ipAddress: `10.30.0.${ip++}`, server: config.server });
    const url = new URL(created.joinUrl);
    assert.equal(await service.consumeMeshJoin(url.searchParams.get("ticket")!, url.searchParams.get("session")!), true);
    const [context] = await memory.select().from(schema.meshAccessContexts).where(eq(schema.meshAccessContexts.id, url.searchParams.get("session")!.split(".")[0]));
    return context;
  }
  // What the checkout route stores and does for a Bitcoin purchase of a KES 100 pass at 5% off.
  async function checkout(context: Awaited<ReturnType<typeof device>>) {
    const id = randomUUID(), price = { ...bitcoinPriceKes(100, 5), discountPercent: 5, priceKes: 100 };
    await memory.insert(schema.payments).values({ id, provider: "lightning", amountSats: 1000, metadata: { meshContextId: context.id, priceKes: 100,
      bitcoinPrice: price, access: { durationMinutes: 1440, dataLimitMb: null, speedLimitKbps: 3000 }, pass: { kind: "personal", deviceLimit: 1 } } });
    assert.equal(await reserveMeshCheckout({ paymentId: id, contextId: context.id, routerId: context.routerId, macAddress: context.macAddress }), true);
    const invoice = await provider.createCheckout({ paymentId: id, amountSats: 1000, amountKes: price.amountKes, packageName: "Day" });
    await memory.update(schema.payments).set({ providerInvoiceId: invoice.id, checkoutUrl: invoice.checkoutUrl, amountSats: invoice.amountSats!, metadata: { ...(await row(id)).metadata, ...invoice.metadata } }).where(eq(schema.payments.id, id));
    return { id, invoice };
  }
  const row = async (id: string) => (await memory.select().from(schema.payments).where(eq(schema.payments.id, id)))[0];
  const orders = async (id: string) => memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.paymentId, id));

  try {
    await t.test("Admin default is 5% off with Bitcoin on", async () => {
      assert.deepEqual(await settings.readPaymentSettings(), { bitcoinEnabled: true, bitcoinDiscountPercent: 5 });
      await settings.savePaymentSettings({ bitcoinEnabled: true, bitcoinDiscountPercent: 7.5 }, "admin:test");
      assert.equal((await settings.readPaymentSettings()).bitcoinDiscountPercent, 7.5);
      await settings.savePaymentSettings({ bitcoinEnabled: true, bitcoinDiscountPercent: 5 }, "admin:test");
      await assert.rejects(settings.savePaymentSettings({ bitcoinEnabled: true, bitcoinDiscountPercent: 80 }, "admin:test"));
    });

    await t.test("The invoice is the discounted KES price in sats at the live rate", async () => {
      const phone = await device("02:00:00:00:A1:01");
      const { id, invoice } = await checkout(phone);
      assert.equal(invoice.amountSats, 950, "KES 95 at 10 cents per sat");
      assert.equal(invoice.checkoutUrl, `/pay/${id}`);
      blinkStatus = "PENDING";
      await lightning.reconcileLightningPayment(await row(id), true, blink);
      assert.equal((await row(id)).status, "new");
      assert.equal((await orders(id)).length, 0, "Unpaid invoices never reach the router");
    });

    await t.test("A paid invoice settles once and queues internet for that device", async () => {
      const phone = await device("02:00:00:00:A2:01");
      const { id } = await checkout(phone);
      blinkStatus = "PAID";
      await lightning.reconcileLightningPayment(await row(id), true, blink);
      const paid = await row(id);
      assert.equal(paid.status, "settled");
      assert.equal(paid.amountSats, 950);
      assert.equal((paid.metadata.lightning as { status: string }).status, "paid");
      assert.equal((await orders(id)).length, 1);
      assert((await service.claimMeshOrders()).some(job => job.order.paymentId === id && job.order.macAddress === phone.macAddress));
      await lightning.reconcileLightningPayment(await row(id), true, blink);
      await service.queueMeshLightningPaidAccess(id, { paymentHash: paid.providerInvoiceId!, amountSats: 950 });
      assert.equal((await orders(id)).length, 1, "Retries never add a second pass");
    });

    await t.test("A tampered amount or hash cannot unlock internet", async () => {
      const phone = await device("02:00:00:00:A3:01");
      const { id } = await checkout(phone);
      const current = await row(id);
      await assert.rejects(service.queueMeshLightningPaidAccess(id, { paymentHash: current.providerInvoiceId!, amountSats: 1 }), /cannot issue access/);
      await assert.rejects(service.queueMeshLightningPaidAccess(id, { paymentHash: "ff".repeat(32), amountSats: 950 }), /cannot issue access/);
      const lightningData = current.metadata.lightning as Record<string, unknown>;
      await memory.update(schema.payments).set({ metadata: { ...current.metadata, lightning: { ...lightningData, amountSats: 10 } } }).where(eq(schema.payments.id, id));
      blinkStatus = "PAID";
      await assert.rejects(lightning.reconcileLightningPayment(await row(id), true, blink), /needs review/);
      assert.equal((await orders(id)).length, 0);
    });

    await t.test("An expired invoice closes and frees the device for another purchase", async () => {
      const phone = await device("02:00:00:00:A4:01");
      const { id } = await checkout(phone);
      const other = randomUUID();
      await memory.insert(schema.payments).values({ id: other, provider: "bitika", amountSats: 1, metadata: { meshContextId: phone.id } });
      assert.equal(await reserveMeshCheckout({ paymentId: other, contextId: phone.id, routerId: phone.routerId, macAddress: phone.macAddress }), false, "One open purchase per device");
      blinkStatus = "EXPIRED";
      await lightning.reconcileLightningPayment(await row(id), true, blink);
      assert.equal((await row(id)).status, "expired");
      assert.equal(await reserveMeshCheckout({ paymentId: other, contextId: phone.id, routerId: phone.routerId, macAddress: phone.macAddress }), true);
    });
  } finally {
    for (const [key, value] of saved) Reflect.set(db, key, value);
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    await pg.close();
  }
});
