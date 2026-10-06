import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

test("Checkout prompts share durable device/phone limits across requests, with separate voucher counters", async () => {
  const env = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture",
    CHECKOUT_DEVICE_ATTEMPTS_PER_WINDOW: "3", CHECKOUT_PHONE_ATTEMPTS_PER_WINDOW: "3" });
  const pg = await PGlite.create();
  await pg.exec("CREATE TABLE voucher_redemption_limits(scope_key text PRIMARY KEY,window_started_at timestamptz NOT NULL,attempts integer NOT NULL)");
  const { db } = await import("../lib/db");
  const saved = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  try {
    const { consumeCheckoutAttempt } = await import("../lib/payments/checkout-rate-limit");
    const input = { routerId: "KM-LAB-001", macAddress: "02:11:22:33:44:55", phone: "254700000000" };
    const results = await Promise.all(Array.from({ length: 5 }, () => consumeCheckoutAttempt(input)));
    assert.equal(results.filter(result => result.allowed).length, 3);
    assert(results.filter(result => !result.allowed).every(result => result.retryAfter > 0 && result.retryAfter <= 900));
    assert.equal((await consumeCheckoutAttempt({ ...input, macAddress: "02:11:22:33:44:66" })).allowed, false, "A different device cannot evade the phone limit");
    assert.equal((await consumeCheckoutAttempt({ ...input, phone: "254700000001" })).allowed, false, "A different payer cannot evade the device limit");
    assert.equal((await consumeCheckoutAttempt({ ...input, macAddress: "02:11:22:33:44:77", phone: "254700000002" })).allowed, true, "A blocked client must not consume a global allowance for other customers");
    const deviceKey = createHash("sha256").update(`checkout-v1:device:${input.routerId}:${input.macAddress}`).digest("hex");
    const voucherKey = createHash("sha256").update(`voucher-v1:device:${input.macAddress}`).digest("hex");
    assert.notEqual(deviceKey, voucherKey);
    await pg.query("INSERT INTO voucher_redemption_limits VALUES ($1,now(),5)", [voucherKey]);
    await pg.exec("UPDATE voucher_redemption_limits SET window_started_at=now()-interval '16 minutes'");
    assert.deepEqual(await consumeCheckoutAttempt(input), { allowed: true, retryAfter: 0 });
    assert.equal((await pg.query<{ attempts: number }>("SELECT attempts FROM voucher_redemption_limits WHERE scope_key=$1", [voucherKey])).rows[0].attempts, 5, "Checkout must not change voucher counters");
    process.env.CHECKOUT_PHONE_ATTEMPTS_PER_WINDOW = "0";
    await assert.rejects(consumeCheckoutAttempt(input), /Invalid checkout/);
  } finally {
    Reflect.set(db, "execute", saved);
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await pg.close();
  }
});
