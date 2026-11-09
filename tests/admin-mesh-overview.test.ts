import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

test("Admin overview counts Mesh devices, passes, sales and unfinished payments", async () => {
  const env = { ...process.env };
  process.env.DATABASE_URL = "postgresql://fixture:fixture@unused.invalid/fixture";
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE payment_status AS ENUM ('new','processing','settled','expired','invalid','refunded');
    CREATE TABLE payments(id uuid PRIMARY KEY,provider text NOT NULL,provider_invoice_id text,status payment_status NOT NULL DEFAULT 'new',amount_sats integer NOT NULL DEFAULT 0,checkout_url text,metadata jsonb NOT NULL DEFAULT '{}',settled_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE vouchers(id uuid PRIMARY KEY,last_redeemed_at timestamptz);
    CREATE TABLE access_grants(id uuid PRIMARY KEY);
    CREATE TABLE packages(id uuid PRIMARY KEY);
  `);
  for (const file of ["automatic-access-schema.sql", "device-passes-schema.sql"]) await pg.exec(await readFile(`scripts/mesh/${file}`, "utf8"));
  const { db } = await import("../lib/db");
  const saved = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  const overview = await import("../lib/admin/mesh-overview");
  try {
    const context = async (mac: string, ago = "0 minutes") => {
      const id = randomUUID();
      await pg.query(`INSERT INTO mesh_access_contexts(id,router_id,server,mac_address,ip_address,join_token_hash,browser_token_hash,join_expires_at,expires_at,joined_at,created_at)
        VALUES($1,'KM-LAB-001','mesh',$2,'10.30.0.9',$3,'b',now(),now()+interval '1 day',now(),now()-$4::interval)`, [id, mac, randomUUID(), ago]);
      return id;
    };
    const pay = async (provider: string, status: string, metadata: object, ago = "0 minutes") => {
      const id = randomUUID();
      await pg.query(`INSERT INTO payments(id,provider,status,metadata,settled_at,created_at) VALUES($1,$2,$3::payment_status,$4::jsonb,CASE WHEN $3::payment_status='settled' THEN now() END,now()-$5::interval)`,
        [id, provider, status, JSON.stringify(metadata), ago]);
      return id;
    };
    const phone = await context("02:00:00:00:00:01"), tv = await context("02:00:00:00:00:02");
    await context("02:00:00:00:00:01"); // The same phone rejoining is one visitor.
    await context("02:00:00:00:00:03", "40 days");
    const mpesa = await pay("bitika", "settled", { priceKes: 100 });
    const bitcoin = await pay("lightning", "settled", { priceKes: 50, bitcoinPrice: { amountKes: 45 } });
    await pay("bitika", "invalid", { priceKes: 20, bitika: { status: "failed" } });
    await pay("bitika", "processing", { priceKes: 20, bitika: { status: "processing" } }, "15 minutes");
    await pay("bitika", "processing", { priceKes: 20, bitika: { status: "processing" } }); // Still on the phone's screen.
    await pay("bitika", "invalid", { priceKes: 20, checkoutConflict: true }); // Internal, never shown to anyone.
    const grant = randomUUID();
    await pg.query("INSERT INTO access_grants VALUES($1)", [grant]);
    const order = randomUUID();
    await pg.query(`INSERT INTO mesh_access_orders(id,context_id,router_id,payment_id,grant_id,status,encrypted_order,expires_at) VALUES($1,$2,'KM-LAB-001',$3,$4,'active','x',now()+interval '1 hour')`, [order, phone, mpesa, grant]);
    const pass = randomUUID();
    await pg.query(`INSERT INTO mesh_passes(id,router_id,kind,device_limit,origin_order_id,payment_id,code_hash,code_ciphertext,payer_device_key_hash,expires_at,speed_limit_kbps)
      VALUES($1,'KM-LAB-001','household',3,$2,$3,'h','c','buyer',now()+interval '1 hour',8192)`, [pass, order, mpesa]);
    await pg.query("INSERT INTO mesh_pass_devices(id,pass_id,slot,label,mac_address) VALUES($1,$2,1,'Phone','02:00:00:00:00:01'),($3,$2,2,'TV','02:00:00:00:00:02')", [randomUUID(), pass, randomUUID()]);
    void tv; void bitcoin;

    const summary = await overview.meshSummary();
    assert.equal(summary.online, 1);
    assert.equal(summary.livePasses, 1);
    assert.equal(summary.passDevices, 2);
    assert.equal(summary.visitorsToday, 2, "Distinct devices, not sessions");
    assert.equal(summary.visitors30, 2);
    assert.equal(summary.buyers30, 1);
    assert.equal(summary.paidToday, 2);
    assert.equal(summary.mpesaKesToday, 100);
    assert.equal(summary.bitcoinKesToday, 45, "Bitcoin counts what the buyer paid after the discount");
    assert.equal(summary.unfinishedToday, 2, "Failed plus abandoned; not the one still on screen or internal conflicts");

    const week = await overview.meshLastWeek();
    assert.equal(week.length, 7);
    assert.deepEqual({ ...week[0], day: "" }, { day: "", visitors: 2, started: 5, paid: 2, kes: 145 });

    const passes = await overview.meshLivePasses();
    assert.deepEqual(passes.map(item => [item.kind, item.devices, item.deviceLimit, item.source, item.kes]), [["household", 2, 3, "M-Pesa", 100]]);

    const recent = await overview.meshRecentPayments();
    assert.equal(recent.length, 5);
    assert.deepEqual(recent.map(item => item.label).sort(), ["Cancelled or failed", "Paid", "Paid", "Waiting for PIN", "Waiting for PIN"]);
  } finally {
    Reflect.set(db, "execute", saved);
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await pg.close();
  }
});
