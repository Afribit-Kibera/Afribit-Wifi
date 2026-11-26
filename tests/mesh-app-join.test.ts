import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { freshToken } from "../lib/mesh-access/security";

// The Afribit app joins Mesh and sends its session and device key as headers.

test("Afribit app: JSON join and header credentials", async t => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
    MESH_ACCESS_ROUTER_ID: "KM-LAB-001", MESH_ROUTER_SERVICE_KEY: "router-fixture-key-".repeat(3), MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64") });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("No network calls in pass tests"); };
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE access_status AS ENUM ('pending','active','expired','revoked','failed');
    CREATE TABLE packages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,description text,price_kes integer NOT NULL DEFAULT 0,price_sats integer NOT NULL,duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,active boolean NOT NULL DEFAULT true,sort_order integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE portal_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mac_address text NOT NULL,ip_address text,router_id text,login_url text,original_url text,user_agent text,created_at timestamptz NOT NULL DEFAULT now(),last_seen_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE payments(id uuid PRIMARY KEY,portal_session_id uuid,package_id uuid REFERENCES packages,provider text NOT NULL DEFAULT 'bitika',provider_invoice_id text,status text NOT NULL DEFAULT 'settled',amount_sats integer NOT NULL,checkout_url text,metadata jsonb NOT NULL DEFAULT '{}',settled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE voucher_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,package_id uuid REFERENCES packages,quantity integer NOT NULL,sale_amount_sats integer NOT NULL,access_duration_minutes integer NOT NULL,data_limit_mb integer,speed_limit_kbps integer,valid_from timestamptz,valid_until timestamptz,max_redemptions integer NOT NULL DEFAULT 1,prefix text NOT NULL DEFAULT '3W',created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE vouchers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),batch_id uuid NOT NULL REFERENCES voucher_batches,code_hash text NOT NULL UNIQUE,code_ciphertext text NOT NULL,code_last_four text NOT NULL,redemption_count integer NOT NULL DEFAULT 0,disabled boolean NOT NULL DEFAULT false,last_redeemed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE access_grants(id uuid PRIMARY KEY,portal_session_id uuid,payment_id uuid REFERENCES payments,voucher_id uuid,mac_address text NOT NULL,status access_status NOT NULL DEFAULT 'pending',starts_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,data_limit_mb integer,speed_limit_kbps integer,purpose text NOT NULL DEFAULT 'paid',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
  `);
  for (const file of ["automatic-access-schema.sql", "checkout-reservations-schema.sql", "device-passes-schema.sql"]) await pg.exec(await readFile(`scripts/mesh/${file}`, "utf8"));
  const memory = drizzle(pg, { schema });
  const { db } = await import("../lib/db");
  const saved = new Map<string, unknown>();
  for (const key of ["select", "insert", "update", "delete", "execute", "transaction"]) {
    saved.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const service = await import("../lib/mesh-access/service");
  const passes = await import("../lib/mesh-access/passes");
  const credentials = await import("../lib/mesh-access/app-credentials");
  const { POST: appJoin } = await import("../app/api/mesh/app/join/route");
  const { GET: listPasses } = await import("../app/api/mesh/pass/route");
  const { GET: appPackages } = await import("../app/api/mesh/app/packages/route");
  const { GET: paymentStatus } = await import("../app/api/payments/[id]/route");
  const config = readMeshAccessConfig();
  let ip = 10;
  async function captiveLink(mac: string) {
    const created = await service.createMeshContext({ macAddress: mac, ipAddress: `10.30.0.${ip++}`, server: config.server });
    const url = new URL(created.joinUrl);
    return { ticket: url.searchParams.get("ticket")!, session: url.searchParams.get("session")! };
  }
  const join = (body: unknown) => appJoin(new Request("https://wifi.afribit.africa/api/mesh/app/join", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  const withHeaders = (headers: Record<string, string>) => new Request("https://wifi.afribit.africa/api/mesh/pass", { headers });
  try {
    await t.test("A cookie always wins over the app header; the header is used only without one", () => {
      const both = new Request("https://x.invalid/", { headers: { cookie: "a=1; mesh_session=from-cookie", "x-afribit-mesh-session": "from-header" } });
      assert.equal(credentials.readCredential(both, "mesh_session", credentials.meshSessionHeader), "from-cookie");
      const header = new Request("https://x.invalid/", { headers: { "x-afribit-mesh-session": "  from-header " } });
      assert.equal(credentials.readCredential(header, "mesh_session", credentials.meshSessionHeader), "from-header");
      assert.equal(credentials.readCredential(new Request("https://x.invalid/"), "mesh_session", credentials.meshSessionHeader), undefined);
      const key = passes.newDeviceKey();
      assert.equal(passes.readDeviceKey(withHeaders({ "x-afribit-mesh-device": key })), key);
      assert.equal(passes.readDeviceKey(withHeaders({ "x-afribit-mesh-device": "short" })), null);
    });

    await t.test("The app joins once with the captive ticket and gets a device key", async () => {
      const link = await captiveLink("AA:BB:CC:00:00:01");
      const response = await join(link);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      const body = await response.json() as { deviceKey: string; grantId: string | null; restored: boolean };
      assert(passes.isDeviceKey(body.deviceKey));
      assert.equal(body.grantId, null);
      const [context] = await memory.select().from(schema.meshAccessContexts).where(eq(schema.meshAccessContexts.id, link.session.split(".")[0]));
      assert.equal(context.deviceKeyHash, passes.deviceKeyHash(body.deviceKey));
      assert.equal((await join(link)).status, 403, "The ticket is used once");

      const trusted = await service.getTrustedMeshContext(withHeaders({ "x-afribit-mesh-session": link.session }));
      assert.equal(trusted?.id, context.id, "The session header identifies the attested device");
      const forged = `${link.session.split(".")[0]}.${freshToken()}`;
      assert.equal(await service.getTrustedMeshContext(withHeaders({ "x-afribit-mesh-session": forged })), null);

      const listed = await listPasses(withHeaders({ "x-afribit-mesh-session": link.session, "x-afribit-mesh-device": body.deviceKey }));
      assert.equal(listed.status, 200);
      assert.deepEqual(await listed.json(), { passes: [] });
    });

    await t.test("A phone that joined before keeps its device key", async () => {
      const link = await captiveLink("AA:BB:CC:00:00:02");
      const deviceKey = passes.newDeviceKey();
      const body = await (await join({ ...link, deviceKey })).json() as { deviceKey: string };
      assert.equal(body.deviceKey, deviceKey);
      const other = await captiveLink("AA:BB:CC:00:00:03");
      const fresh = await (await join({ ...other, deviceKey: "not-a-key" })).json() as { deviceKey: string };
      assert(passes.isDeviceKey(fresh.deviceKey) && fresh.deviceKey !== "not-a-key", "An invalid key is replaced, never stored");
    });

    await t.test("Malformed joins are refused before touching the database", async () => {
      const link = await captiveLink("AA:BB:CC:00:00:04");
      for (const body of [{}, { ...link, ticket: "x" }, { ...link, session: "nope" }, { ...link, extra: 1 }, "text"]) {
        assert.equal((await join(body)).status, 400, JSON.stringify(body));
      }
      assert.equal((await join(link)).status, 200, "The refused attempts did not use up the ticket");
    });

    await t.test("The app sees the passes on sale, only with a joined session", async () => {
      await memory.insert(schema.packages).values([
        { name: "Day pass", priceKes: 50, priceSats: 1, durationMinutes: 1440, sortOrder: 1 },
        { name: "Old pass", priceKes: 20, priceSats: 1, durationMinutes: 60, active: false },
        { name: "Hour", priceKes: 10, priceSats: 1, durationMinutes: 60, sortOrder: 0, kind: "household", deviceLimit: 3, dataLimitMb: 500 },
      ]);
      const packagesRequest = (headers: Record<string, string>) => appPackages(new Request("https://wifi.afribit.africa/api/mesh/app/packages", { headers }));
      assert.equal((await packagesRequest({})).status, 401);
      assert.equal((await packagesRequest({ "x-afribit-mesh-session": `${crypto.randomUUID()}.${freshToken()}` })).status, 401);
      const link = await captiveLink("AA:BB:CC:00:00:05");
      await join(link);
      const response = await packagesRequest({ "x-afribit-mesh-session": link.session });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      const body = await response.json() as { packages: { name: string; kind: string; deviceLimit: number; dataLimitMb: number | null; description: string | null; bitcoinKes: number | null }[]; bitcoinEnabled: boolean; mpesaEnabled: boolean };
      assert.deepEqual(body.packages.map(item => item.name), ["Hour", "Day pass"], "Active passes only, in the admin's order");
      assert.deepEqual([body.packages[0].kind, body.packages[0].deviceLimit, body.packages[0].dataLimitMb, body.packages[1].dataLimitMb, body.packages[1].description], ["household", 3, 500, null, null]);
      // No Blink or M-Pesa configuration in this fixture, so nothing can be paid for.
      assert.equal(body.bitcoinEnabled, false);
      assert.equal(body.mpesaEnabled, false);
      assert(body.packages.every(item => item.bitcoinKes === null));
    });

    await t.test("The device that owns an open Lightning purchase gets its invoice", async () => {
      const link = await captiveLink("AA:BB:CC:00:00:06");
      await join(link);
      const contextId = link.session.split(".")[0];
      const [wifiPackage] = await memory.select().from(schema.packages).limit(1);
      const lightning = (expiresAt: string) => ({ status: "pending", amountSats: 2100, expiresAt,
        invoice: { paymentRequest: "lnbc21u1pfixture", paymentHash: "hash-fixture", satoshis: 2100, walletId: "wallet-fixture" } });
      const open = crypto.randomUUID(), stale = crypto.randomUUID(), settled = crypto.randomUUID();
      await memory.insert(schema.payments).values([
        { id: open, packageId: wifiPackage.id, provider: "lightning", providerInvoiceId: "hash-fixture", status: "new", amountSats: 2100, metadata: { meshContextId: contextId, lightning: lightning(new Date(Date.now() + 600_000).toISOString()) } },
        { id: stale, packageId: wifiPackage.id, provider: "lightning", providerInvoiceId: "hash-fixture", status: "new", amountSats: 2100, metadata: { meshContextId: contextId, lightning: lightning(new Date(Date.now() - 1_000).toISOString()) } },
        { id: settled, packageId: wifiPackage.id, provider: "lightning", providerInvoiceId: "hash-fixture", status: "settled", amountSats: 2100, metadata: { meshContextId: contextId, lightning: lightning(new Date(Date.now() + 600_000).toISOString()) } },
      ]);
      const status = (id: string, session: string) => paymentStatus(new Request(`https://wifi.afribit.africa/api/payments/${id}`, { headers: { "x-afribit-mesh-session": session } }), { params: Promise.resolve({ id }) });
      const body = await (await status(open, link.session)).json() as { lightning?: { paymentRequest: string; satoshis: number; expiresAt: string } };
      assert.equal(body.lightning?.paymentRequest, "lnbc21u1pfixture");
      assert.equal(body.lightning?.satoshis, 2100);
      assert.equal(((await (await status(stale, link.session)).json()) as { lightning?: unknown }).lightning, undefined, "An expired invoice is never offered");
      assert.equal(((await (await status(settled, link.session)).json()) as { lightning?: unknown }).lightning, undefined, "A paid purchase has nothing left to pay");
      const other = await captiveLink("AA:BB:CC:00:00:07");
      await join(other);
      assert.equal((await status(open, other.session)).status, 404, "Another device can't see the invoice");
    });
  } finally {
    for (const [key, value] of saved) Reflect.set(db, key, value);
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    await pg.close();
  }
});
