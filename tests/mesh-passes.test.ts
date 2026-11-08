import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { decryptAccess, encryptAccess, freshToken } from "../lib/mesh-access/security";
import type { MeshAutomaticOrder } from "../lib/mesh-access/model";

// Device passes on the real production migrations: a pass keeps one deadline
// while it follows a phone, fills household slots and moves between devices.
test("Device passes: recovery, household slots, moves and router revocation order", async t => {
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
  const config = readMeshAccessConfig();
  let ip = 10;
  async function device(mac: string) {
    const created = await service.createMeshContext({ macAddress: mac, ipAddress: `10.30.0.${ip++}`, server: config.server });
    const url = new URL(created.joinUrl);
    assert.equal(await service.consumeMeshJoin(url.searchParams.get("ticket")!, url.searchParams.get("session")!), true);
    const [context] = await memory.select().from(schema.meshAccessContexts).where(eq(schema.meshAccessContexts.id, url.searchParams.get("session")!.split(".")[0]));
    return context;
  }
  async function paidOrder(context: typeof schema.meshAccessContexts.$inferSelect, pass: { kind: string; deviceLimit: number }, payerKeyHash?: string) {
    const paymentId = randomUUID(), id = randomUUID(), grantId = randomUUID(), expiresAt = new Date(Date.now() + 7 * 86_400_000);
    await memory.insert(schema.payments).values({ id: paymentId, amountSats: 900, status: "settled", metadata: { meshContextId: context.id, pass, ...(payerKeyHash ? { payerDeviceKeyHash: payerKeyHash } : {}) } });
    await memory.insert(schema.accessGrants).values({ id: grantId, paymentId, macAddress: context.macAddress, expiresAt, speedLimitKbps: 3000 });
    const order: MeshAutomaticOrder = { id, routerId: "KM-LAB-001", server: "KM-MESH-001", macAddress: context.macAddress, ipAddress: context.ipAddress,
      user: `ma-${id.replaceAll("-", "")}`, password: freshToken(), expiresAt: expiresAt.toISOString(), durationMinutes: 7 * 1440, dataLimitMb: null, speedLimitKbps: 3000, paymentId };
    await memory.insert(schema.meshAccessOrders).values({ id, contextId: context.id, routerId: "KM-LAB-001", paymentId, grantId, encryptedOrder: encryptAccess(order, config), expiresAt, status: "active" });
    return { id, paymentId, expiresAt };
  }
  const orderStatus = async (id: string) => (await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.id, id)))[0].status;
  const passOf = async (paymentId: string) => (await memory.select().from(schema.meshPasses).where(eq(schema.meshPasses.paymentId, paymentId)))[0];
  async function codeOf(paymentId: string) {
    const pass = await passOf(paymentId);
    return decryptAccess<{ code: string }>(pass.codeCiphertext, config).code;
  }
  // Router side: confirm every pending revocation like the controller does.
  async function routerRevokesAll() {
    const revocations = await passes.claimMeshRevocations();
    for (const item of revocations) assert.equal(await passes.completeMeshRevocation(item.id, item.claimToken), true);
    return revocations.map(item => item.id);
  }

  try {
    await t.test("Every live order becomes slot 1 of a pass, once", async () => {
      const phone = await device("02:00:00:00:01:01");
      const paid = await paidOrder(phone, { kind: "personal", deviceLimit: 1 });
      assert.equal(await passes.ensurePasses(), 1);
      assert.equal(await passes.ensurePasses(), 0, "Idempotent on every poll");
      const pass = await passOf(paid.paymentId);
      assert.equal(pass.deviceLimit, 1);
      assert.equal(pass.expiresAt.toISOString(), paid.expiresAt.toISOString());
      assert.match(await codeOf(paid.paymentId), /^\d{10}$/);
      const [order] = await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.id, paid.id));
      assert(order.passDeviceId, "The original order is linked to its slot");
    });

    await t.test("A new IP on the same phone restores the pass without a purchase or a new deadline", async () => {
      const phone = await device("02:00:00:00:02:01");
      const paid = await paidOrder(phone, { kind: "personal", deviceLimit: 1 });
      await passes.ensurePasses();
      const rejoined = await device("02:00:00:00:02:01");
      const restored = await passes.restoreDevicePass(rejoined, null);
      assert(restored?.restored, "Matched by the router-attested MAC");
      assert.equal(await orderStatus(paid.id), "revoking");
      const replacement = (await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.contextId, rejoined.id)))[0];
      assert.equal(replacement.expiresAt.toISOString(), paid.expiresAt.toISOString(), "Time never restarts");
      const order = decryptAccess<MeshAutomaticOrder>(replacement.encryptedOrder, config);
      assert.equal(order.ipAddress, rejoined.ipAddress);
      assert.equal(order.paymentId, paid.paymentId);
      // The replacement waits until the router confirms the old account is off.
      assert(!(await service.claimMeshOrders()).some(job => job.id === replacement.id));
      assert.deepEqual(await routerRevokesAll(), [paid.id]);
      assert.equal(await orderStatus(paid.id), "revoked");
      assert((await service.claimMeshOrders()).some(job => job.id === replacement.id));
      assert.equal((await passes.restoreDevicePass(rejoined, null))?.restored, false, "Already bound: nothing to move");
    });

    await t.test("A changed MAC is recovered by the device key, not by guessing", async () => {
      const key = passes.newDeviceKey(), keyHash = passes.deviceKeyHash(key);
      const phone = await device("02:00:00:00:03:01");
      await memory.update(schema.meshAccessContexts).set({ deviceKeyHash: keyHash }).where(eq(schema.meshAccessContexts.id, phone.id));
      const [updated] = await memory.select().from(schema.meshAccessContexts).where(eq(schema.meshAccessContexts.id, phone.id));
      const paid = await paidOrder(updated, { kind: "personal", deviceLimit: 1 });
      await passes.ensurePasses();
      const randomized = await device("02:00:00:00:03:99");
      assert.equal(await passes.restoreDevicePass(randomized, passes.deviceKeyHash(passes.newDeviceKey())), null, "Another browser key gets nothing");
      assert((await passes.restoreDevicePass(randomized, keyHash))?.restored);
      assert.equal(await orderStatus(paid.id), "revoking");
      await routerRevokesAll();
    });

    await t.test("A household pass fills its slots, then asks which device to replace", async () => {
      const ownerKey = passes.deviceKeyHash(passes.newDeviceKey());
      const owner = await device("02:00:00:00:04:01");
      const paid = await paidOrder(owner, { kind: "household", deviceLimit: 3 }, ownerKey);
      await passes.ensurePasses();
      const code = await codeOf(paid.paymentId);
      const tablet = await device("02:00:00:00:04:02"), laptop = await device("02:00:00:00:04:03"), extra = await device("02:00:00:00:04:04");
      await passes.redeemPassCode(tablet, { code, keyHash: null, label: "Tablet" });
      await passes.redeemPassCode(laptop, { code: passes.formatPassCode(code), keyHash: null });
      const full = await passes.redeemPassCode(extra, { code, keyHash: null }).then(() => null, error => error);
      assert(full instanceof passes.PassError && full.status === 409 && full.devices?.length === 3, "A full pass lists its devices");
      const tabletSlot = full.devices.find((item: { label: string }) => item.label === "Tablet")!;
      await passes.redeemPassCode(extra, { code, keyHash: null, replaceDeviceId: tabletSlot.id });
      const live = await pg.query<{ count: number }>(`SELECT count(*)::int AS count FROM mesh_access_orders o JOIN mesh_pass_devices d ON d.id=o.pass_device_id
        WHERE d.pass_id=$1 AND o.status IN ('queued','claimed','active')`, [(await passOf(paid.paymentId)).id]);
      assert.equal(live.rows[0].count, 3, "Never more live devices than the pass allows");
      const mine = await passes.passesForDevice(ownerKey);
      assert.equal(mine.length, 1);
      assert.equal(mine[0].devices.length, 3);
      assert.equal(mine[0].code.replace(/\s/g, ""), code, "The payer can always see the code");
      await routerRevokesAll();
    });

    await t.test("Owners remove devices; strangers cannot", async () => {
      const ownerKey = passes.deviceKeyHash(passes.newDeviceKey());
      const owner = await device("02:00:00:00:05:01");
      const paid = await paidOrder(owner, { kind: "household", deviceLimit: 2 }, ownerKey);
      await passes.ensurePasses();
      const child = await device("02:00:00:00:05:02");
      await passes.redeemPassCode(child, { code: await codeOf(paid.paymentId), keyHash: null, label: "Child" });
      const pass = await passOf(paid.paymentId);
      const childSlot = (await passes.passesForDevice(ownerKey))[0].devices.find(item => item.label === "Child")!;
      await assert.rejects(passes.removeDevice({ passId: pass.id, ownerKeyHash: passes.deviceKeyHash(passes.newDeviceKey()), deviceId: childSlot.id }), /device that uses this pass/);
      await passes.removeDevice({ passId: pass.id, ownerKeyHash: ownerKey, deviceId: childSlot.id });
      const childOrder = (await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.contextId, child.id)))[0];
      assert.equal(childOrder.status, "revoking");
      await routerRevokesAll();
      assert.equal(await orderStatus(childOrder.id), "revoked");
    });

    await t.test("A TV shows a device code and the payer's phone adds it", async () => {
      const ownerKey = passes.deviceKeyHash(passes.newDeviceKey());
      const owner = await device("02:00:00:00:06:01");
      const paid = await paidOrder(owner, { kind: "household", deviceLimit: 2 }, ownerKey);
      await passes.ensurePasses();
      const tv = await device("02:00:00:00:06:0A");
      const shown = await passes.createDeviceCode(tv);
      assert.match(shown.code, /^\d{6}$/);
      assert.equal((await passes.resolveDeviceCode(shown.code)).id, tv.id);
      await passes.addDeviceByCode({ passId: (await passOf(paid.paymentId)).id, ownerKeyHash: ownerKey, deviceCode: shown.code, label: "TV" });
      const tvOrder = (await memory.select().from(schema.meshAccessOrders).where(eq(schema.meshAccessOrders.contextId, tv.id)))[0];
      assert.equal(decryptAccess<MeshAutomaticOrder>(tvOrder.encryptedOrder, config).macAddress, tv.macAddress, "Access goes to the TV the router saw");
      await assert.rejects(passes.resolveDeviceCode(shown.code), /expired or is wrong/, "A device code works once");
    });

    await t.test("A one-device pass moves to a new phone, within a daily limit", async () => {
      const first = await device("02:00:00:00:07:01");
      const paid = await paidOrder(first, { kind: "personal", deviceLimit: 1 });
      await passes.ensurePasses();
      const code = await codeOf(paid.paymentId);
      const phones = [];
      for (let index = 0; index < 7; index++) phones.push(await device(`02:00:00:00:07:${String(index + 10)}`));
      for (let index = 0; index < 6; index++) { await passes.redeemPassCode(phones[index], { code, keyHash: null }); await routerRevokesAll(); }
      await assert.rejects(passes.redeemPassCode(phones[6], { code, keyHash: null }), (error: unknown) => error instanceof passes.PassError && error.status === 429);
      assert.equal(await orderStatus(paid.id), "revoked");
    });

    await t.test("A device with its own live pass, a wrong code or an ended pass is refused", async () => {
      const a = await device("02:00:00:00:08:01"), b = await device("02:00:00:00:08:02");
      const first = await paidOrder(a, { kind: "household", deviceLimit: 3 }), second = await paidOrder(b, { kind: "personal", deviceLimit: 1 });
      await passes.ensurePasses();
      await assert.rejects(passes.redeemPassCode(b, { code: await codeOf(first.paymentId), keyHash: null }), /already has internet/);
      await assert.rejects(passes.redeemPassCode(b, { code: "0000000000", keyHash: null }), /not found/);
      await memory.update(schema.meshPasses).set({ expiresAt: new Date(Date.now() + 30_000) }).where(eq(schema.meshPasses.paymentId, second.paymentId));
      const c = await device("02:00:00:00:08:03");
      await assert.rejects(passes.redeemPassCode(c, { code: await codeOf(second.paymentId), keyHash: null }), /ended/);
    });
  } finally {
    for (const [key, value] of saved) Reflect.set(db, key, value);
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    await pg.close();
  }
});
