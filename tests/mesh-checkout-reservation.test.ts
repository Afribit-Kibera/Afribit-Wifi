import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

test("Device purchase reservation serializes contenders, survives uncertainty and respects remaining access", async () => {
  const env = { ...process.env };
  process.env.DATABASE_URL = "postgresql://fixture:fixture@unused.invalid/fixture";
  const pg = await PGlite.create();
  await pg.exec(`CREATE TABLE payments(id uuid PRIMARY KEY,provider text,status text,metadata jsonb);
    CREATE TABLE mesh_access_contexts(id uuid PRIMARY KEY,router_id text,mac_address text,joined_at timestamptz,expires_at timestamptz);
    CREATE TABLE mesh_access_orders(context_id uuid,router_id text,status text,expires_at timestamptz);`);
  await pg.exec(await readFile("scripts/mesh/checkout-reservations-schema.sql", "utf8"));
  const { db } = await import("../lib/db");
  const saved = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  const { reserveMeshCheckout } = await import("../lib/mesh-access/checkout-reservation");
  const macAddress = "02:11:22:33:44:55", routerId = "KM-LAB-001";
  async function purchase(provider = "paystack") {
    const contextId = randomUUID(), paymentId = randomUUID();
    await pg.query("INSERT INTO mesh_access_contexts VALUES($1,$2,$3,now(),now()+interval '1 day')", [contextId, routerId, macAddress]);
    await pg.query("INSERT INTO payments VALUES($1,$2,'new',$3::jsonb)", [paymentId, provider, JSON.stringify({ meshContextId: contextId, collectionGuardVersion: 1 })]);
    return { contextId, paymentId, routerId, macAddress };
  }
  try {
    const owners = await Promise.all([purchase(), purchase()]);
    const results = await Promise.all(owners.map(reserveMeshCheckout));
    assert.equal(results.filter(Boolean).length, 1, "Exactly one different reference can acquire the device");
    const winner = owners[results.indexOf(true)], loser = owners[results.indexOf(false)];
    assert.equal(await reserveMeshCheckout(winner), true, "Same purchase retains its reservation");
    assert.equal(await reserveMeshCheckout({ ...winner, contextId: loser.contextId }), false);
    assert.equal(await reserveMeshCheckout({ ...winner, macAddress: "02:11:22:33:44:66" }), false);
    await pg.query("UPDATE payments SET status='processing' WHERE id=$1", [winner.paymentId]);
    await pg.exec("UPDATE mesh_checkout_reservations SET created_at=now()-interval '2 days',updated_at=now()-interval '2 days'");
    assert.equal(await reserveMeshCheckout(loser), false, "Age alone cannot release an ambiguous collection");
    await pg.query("UPDATE payments SET status='invalid' WHERE id=$1", [winner.paymentId]);
    assert.equal(await reserveMeshCheckout(loser), true, "Definitively ended payment allows a new attempt");
    const next = await purchase();
    await pg.query("UPDATE payments SET status='settled' WHERE id=$1", [loser.paymentId]);
    await pg.query("INSERT INTO mesh_access_orders VALUES($1,$2,'active',now()+interval '1 hour')", [loser.contextId, routerId]);
    assert.equal(await reserveMeshCheckout(next), false, "A successful payment does not erase a live pass");
    await pg.exec("UPDATE mesh_access_orders SET expires_at=now()-interval '1 second'");
    assert.equal(await reserveMeshCheckout(next), true);
    const other = await purchase();
    await pg.query("UPDATE mesh_access_contexts SET expires_at=now()-interval '1 second' WHERE id=$1", [other.contextId]);
    assert.equal(await reserveMeshCheckout(other), false);
    // An additive deployment starts with an empty reservation table. A real
    // pre-upgrade collection must still block a new reference for its device.
    await pg.exec("DELETE FROM mesh_checkout_reservations");
    await pg.query("UPDATE payments SET metadata=metadata || '{\"paystackChargeStartedAt\":1}'::jsonb WHERE id=$1", [next.paymentId]);
    const afterUpgrade = await purchase();
    assert.equal(await reserveMeshCheckout(afterUpgrade), false, "Legacy initiated collections remain protected without a reservation row");
    assert.equal(await reserveMeshCheckout(next), true, "The original legacy purchase can acquire its reservation");
    await pg.exec("UPDATE payments SET status='invalid'; DELETE FROM mesh_checkout_reservations");
    const legacyBitika = await purchase("bitika"), backup = await purchase("paystack");
    await pg.query("UPDATE payments SET metadata=metadata-'collectionGuardVersion' WHERE id=$1", [legacyBitika.paymentId]);
    assert.equal(await reserveMeshCheckout(backup), false, "Pre-upgrade Bitika ambiguity blocks fallback even without a marker");
    assert.equal(await reserveMeshCheckout(legacyBitika), true);
    await pg.query("UPDATE payments SET status='invalid' WHERE id=$1", [legacyBitika.paymentId]);
    assert.equal(await reserveMeshCheckout(backup), true, "A confirmed Bitika decline permits a backup purchase");
  } finally {
    Reflect.set(db, "execute", saved);
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await pg.close();
  }
});
