import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

test("Voucher gates atomically isolate blocked clients and preserve the shared guessing ceiling", async t => {
  const env = { ...process.env };
  Object.assign(process.env, {
    DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture",
    VERCEL: "1", VOUCHER_GLOBAL_ATTEMPTS_PER_WINDOW: "10",
    VOUCHER_DEVICE_ATTEMPTS_PER_WINDOW: "3", VOUCHER_SOURCE_ATTEMPTS_PER_WINDOW: "4",
  });
  const pg = await PGlite.create();
  await pg.exec("CREATE TABLE voucher_redemption_limits(scope_key text PRIMARY KEY,window_started_at timestamptz NOT NULL,attempts integer NOT NULL)");
  const { db } = await import("../lib/db");
  const saved = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  const { consumeVoucherAttempt } = await import("../lib/voucher-rate-limit");
  const headers = (source: string) => new Headers({ "x-vercel-forwarded-for": source });
  const key = (scope: string) => createHash("sha256").update(`voucher-v1:${scope}`).digest("hex");
  const count = async (scope: string) => (await pg.query<{ attempts: number }>(
    "SELECT attempts FROM voucher_redemption_limits WHERE scope_key=$1", [key(scope)])).rows[0]?.attempts;
  const clear = () => pg.exec("TRUNCATE voucher_redemption_limits");
  try {
    await t.test("A concurrent blocked-device flood cannot spend the source or global budget", async () => {
      const mac = "02:11:22:33:44:55", source = "192.0.2.1";
      const results = await Promise.all(Array.from({ length: 50 }, () => consumeVoucherAttempt(mac, headers(source))));
      assert.equal(results.filter(result => result.allowed).length, 3);
      assert(results.filter(result => !result.allowed).every(result => result.retryAfter > 0 && result.retryAfter <= 900));
      assert.equal(await count(`device:${mac}`), 3);
      assert.equal(await count(`source:${source}`), 3);
      assert.equal(await count("global"), 3);
      assert.equal((await consumeVoucherAttempt("02:11:22:33:44:66", headers(source))).allowed, true);
      assert.equal((await consumeVoucherAttempt("02:11:22:33:44:77", headers("192.0.2.2"))).allowed, true);
    });
    await t.test("Rotating MACs behind an exhausted trusted source cannot spend the global budget", async () => {
      await clear();
      const results = await Promise.all(Array.from({ length: 50 }, (_, i) =>
        consumeVoucherAttempt(`02:11:22:33:44:${i.toString(16).padStart(2, "0")}`, headers("192.0.2.1"))));
      assert.equal(results.filter(result => result.allowed).length, 4);
      assert.equal(await count("source:192.0.2.1"), 4);
      assert.equal(await count("global"), 4);
      assert.equal((await consumeVoucherAttempt("02:22:22:33:44:55", headers("192.0.2.2"))).allowed, true);
    });
    await t.test("Concurrent distinct devices and sources still hit the exact global ceiling", async () => {
      await clear();
      const results = await Promise.all(Array.from({ length: 25 }, (_, i) =>
        consumeVoucherAttempt(`02:11:22:33:44:${i.toString(16).padStart(2, "0")}`, headers(`192.0.2.${i + 1}`))));
      assert.equal(results.filter(result => result.allowed).length, 10);
      assert.equal(await count("global"), 10);
      assert.equal((await consumeVoucherAttempt("02:22:22:33:44:55", headers("192.0.2.200"))).allowed, false);
      assert.equal(await count("global"), 10);
    });
    await t.test("Expired windows reset all gates and MAC casing cannot evade the device limit", async () => {
      await clear();
      const mac = "02:aa:bb:cc:dd:ee", source = "192.0.2.1";
      for (let i = 0; i < 3; i++) assert.equal((await consumeVoucherAttempt(mac, headers(source))).allowed, true);
      assert.equal((await consumeVoucherAttempt(mac.toUpperCase(), headers(source))).allowed, false);
      await pg.exec("UPDATE voucher_redemption_limits SET window_started_at=now()-interval '16 minutes'");
      assert.deepEqual(await consumeVoucherAttempt(mac, headers(source)), { allowed: true, retryAfter: 0 });
      assert.equal(await count(`device:${mac.toUpperCase()}`), 1);
      assert.equal(await count(`source:${source}`), 1);
      assert.equal(await count("global"), 1);
    });
    await t.test("Spoofed proxy headers outside Vercel cannot create a source allowance", async () => {
      await clear();
      process.env.VERCEL = "0";
      assert.equal((await consumeVoucherAttempt("02:11:22:33:44:55", headers("192.0.2.1"))).allowed, true);
      assert.equal(await count("source:192.0.2.1"), undefined);
      process.env.VOUCHER_GLOBAL_ATTEMPTS_PER_WINDOW = "0";
      await assert.rejects(consumeVoucherAttempt("02:11:22:33:44:55", headers("192.0.2.1")), /Invalid voucher attempt limit/);
      assert.equal(await count("global"), 1, "Invalid configuration fails before consuming any allowance");
    });
  } finally {
    Reflect.set(db, "execute", saved);
    for (const name of Object.keys(process.env)) if (!(name in env)) delete process.env[name];
    Object.assign(process.env, env);
    await pg.close();
  }
});
