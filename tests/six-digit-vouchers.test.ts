import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { decryptVoucherCode, generateVoucherCode, hashLegacyVoucherCode, hashVoucherCode } from "../lib/voucher-crypto";
import { issueVoucherBatch, isVoucherCollision } from "../lib/voucher-issuance";

test("New vouchers are six numeric digits with versioned keyed lookup and preserved export encryption", () => {
  process.env.VOUCHER_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  for (let n = 0; n < 1000; n++) assert.match(generateVoucherCode(), /^\d{6}$/);
  assert.equal(hashVoucherCode(" 3w-ABCD-EFGH-JKLM "), hashVoucherCode("3W-ABCD-EFGH-JKLM"));
  assert.notEqual(hashVoucherCode("012345"), hashVoucherCode("12345"));
  assert.match(hashVoucherCode("012345"), /^hmac-sha256-v1:[a-f0-9]{64}$/);
  assert.notEqual(hashVoucherCode("012345").split(":")[1], hashLegacyVoucherCode("012345"));
});

test("Unique-index collision retries the whole atomic batch and preserves exactly its quantity", async () => {
  const pg = new PGlite();
  await pg.exec(`CREATE TABLE batches (id uuid PRIMARY KEY); CREATE TABLE codes (
    batch_id uuid REFERENCES batches, code_hash text NOT NULL, ciphertext text NOT NULL,
    CONSTRAINT vouchers_code_hash_uidx UNIQUE (code_hash));`);
  const batchId = randomUUID();
  const otherId = randomUUID();
  let attempts = 0;
  try {
    await issueVoucherBatch(batchId, 25, async records => {
      attempts++;
      assert.equal(new Set(records.map(record => record.codeHash)).size, 25);
      for (const record of records) {
        assert.match(decryptVoucherCode(record.codeCiphertext), /^\d{6}$/);
        assert.match(record.codeHash, /^hmac-sha256-v1:[a-f0-9]{64}$/);
        assert.equal(record.codeLastFour, "", "Numeric tickets do not expose four of their six digits in a database leak");
      }
      if (attempts === 1) {
        await pg.query("INSERT INTO batches VALUES ($1)", [otherId]);
        await pg.query("INSERT INTO codes VALUES ($1, $2, $3)", [otherId, records[0].codeHash, records[0].codeCiphertext]);
      }
      return pg.transaction(async tx => {
        await tx.query("INSERT INTO batches VALUES ($1)", [batchId]);
        for (const record of records) await tx.query("INSERT INTO codes VALUES ($1, $2, $3)", [batchId, record.codeHash, record.codeCiphertext]);
      });
    });
    assert.equal(attempts, 2);
    assert.equal((await pg.query<{count:number}>("SELECT count(*)::int AS count FROM codes WHERE batch_id=$1", [batchId])).rows[0].count, 25);
    assert.equal((await pg.query<{count:number}>("SELECT count(*)::int AS count FROM batches")).rows[0].count, 2);
  } finally { await pg.close(); }
});

test("Unrelated database failures never regenerate codes or hide their cause", async () => {
  let attempts = 0;
  const error = Object.assign(new Error("Batch ID conflict"), { code: "23505", constraint: "batches_pkey" });
  assert.equal(isVoucherCollision(error), false);
  await assert.rejects(issueVoucherBatch(randomUUID(), 1, async () => { attempts++; throw error; }), error);
  assert.equal(attempts, 1);
});

test("Existing reserved codes are replaced before insertion, without recycling old vouchers", async () => {
  let lookups = 0;
  let discardedHash: string | undefined;
  await issueVoucherBatch(randomUUID(), 25, async records => {
    assert.equal(records.length, 25);
    assert.equal(records.some(record => record.codeHash === discardedHash), false);
  }, async hashes => {
    lookups++;
    if (lookups === 1) { discardedHash = hashes[0]; return [hashes[0]]; }
    return [];
  });
  assert.equal(lookups, 2);
});

test("Historic SHA-256 stock prevents issuance collisions even when fallback redemption is off", async () => {
  let rejectedLegacy: string | undefined, calls = 0;
  await issueVoucherBatch(randomUUID(), 10, async records => {
    assert(!records.some(record => hashLegacyVoucherCode(decryptVoucherCode(record.codeCiphertext)) === rejectedLegacy));
  }, async hashes => {
    calls++;
    assert(hashes.some(hash => /^hmac-sha256-v1:/.test(hash)));
    assert(hashes.some(hash => /^[a-f0-9]{64}$/.test(hash)));
    if (calls === 1) { rejectedLegacy = hashes.find(hash => /^[a-f0-9]{64}$/.test(hash)); return [rejectedLegacy!]; }
    return [];
  });
  assert.equal(calls, 2);
});

test("Distributed voucher attempts share a durable limit, ignore spoofed proxy IPs and expire after cooldown", async () => {
  process.env.DATABASE_URL ??= "postgresql://fixture:fixture@localhost/unused";
  process.env.VERCEL = "0";
  const pg = new PGlite();
  await pg.exec(`CREATE TABLE voucher_redemption_limits (scope_key text PRIMARY KEY,
    window_started_at timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 1);`);
  const memory = drizzle(pg);
  const { db } = await import("../lib/db");
  const original = db.execute;
  Reflect.set(db, "execute", memory.execute.bind(memory));
  const { consumeVoucherAttempt } = await import("../lib/voucher-rate-limit");
  try {
    const headers = new Headers({ "x-forwarded-for": "spoofed", "x-vercel-forwarded-for": "spoofed" });
    const attempts = await Promise.all(Array.from({length: 6}, () => consumeVoucherAttempt("02:11:22:33:44:55", headers)));
    assert.equal(attempts.filter(value => value.allowed).length, 5);
    assert.equal(attempts.filter(value => !value.allowed).length, 1);
    assert.ok(attempts[5].retryAfter > 0 && attempts[5].retryAfter <= 900);
    assert.equal((await pg.query<{count:number}>("SELECT count(*)::int AS count FROM voucher_redemption_limits")).rows[0].count, 2);
    for (let i = 0; i < 94; i++) await consumeVoucherAttempt(`02:11:22:33:${i.toString(16).padStart(2,"0")}:66`, headers);
    assert.equal((await consumeVoucherAttempt("02:22:22:33:44:54", headers)).allowed, true, "A locally rejected attempt must not consume the shared guessing budget");
    assert.equal((await consumeVoucherAttempt("02:22:22:33:44:55", headers)).allowed, false);
    await pg.exec("UPDATE voucher_redemption_limits SET window_started_at=now()-interval '16 minutes'");
    assert.equal((await consumeVoucherAttempt("02:11:22:33:44:55", headers)).allowed, true);
  } finally { Reflect.set(db, "execute", original); await pg.close(); }
});
