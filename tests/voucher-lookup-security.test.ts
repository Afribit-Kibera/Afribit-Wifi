import assert from "node:assert/strict";
import { test } from "node:test";
import { encryptVoucherCode, hashLegacyVoucherCode, hashVoucherCode } from "../lib/voucher-crypto";
import { legacyVoucherLookupPolicy, lookupVoucherRecord } from "../lib/voucher-lookup";
import { prepareVoucherLookupMigration } from "../scripts/mesh/migrate-voucher-lookup";

test("Keyed lookup fails closed, separates export encryption, and legacy compatibility is bounded and authoritative", async () => {
  const saved = { ...process.env }, now = Date.parse("2026-10-06T12:00:00Z");
  const cutoff = "2026-10-06T10:00:00Z", until = "2026-11-06T10:00:00Z";
  try {
    delete process.env.VOUCHER_LOOKUP_KEY; delete process.env.VOUCHER_ENCRYPTION_KEY;
    delete process.env.VOUCHER_LEGACY_ISSUED_BEFORE; delete process.env.VOUCHER_LEGACY_LOOKUP_UNTIL;
    let calls = 0;
    await assert.rejects(lookupVoucherRecord("012345", async () => { calls++; return undefined; }, now), /VOUCHER_ENCRYPTION_KEY/);
    assert.equal(calls, 0);
    process.env.VOUCHER_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const primary = hashVoucherCode("012345"), legacy = hashLegacyVoucherCode("012345");
    assert.notEqual(primary.split(":")[1], legacy);
    const old = { id: "fixture", oldHash: legacy, ciphertext: encryptVoucherCode("012345"), lastFour: "2345" };
    assert.deepEqual(prepareVoucherLookupMigration([old]), [{ id: "fixture", oldHash: legacy, keyedHash: primary, lastFour: "" }]);
    assert.equal(old.lastFour, "2345", "Preparation itself never mutates retained stock");
    assert.throws(() => prepareVoucherLookupMigration([{ ...old, oldHash: hashLegacyVoucherCode("654321") }]), /ciphertext\/hash mismatch/);
    assert.throws(() => prepareVoucherLookupMigration([old, { ...old, id: "other" }]), /Conflicting voucher values/);
    process.env.VOUCHER_LOOKUP_KEY = "";
    await assert.rejects(lookupVoucherRecord("012345", async () => { calls++; return undefined; }, now), /VOUCHER_LOOKUP_KEY/);
    assert.equal(calls, 0, "An explicitly invalid dedicated key must not silently derive a fallback key");
    process.env.VOUCHER_LOOKUP_KEY = Buffer.alloc(32, 8).toString("base64");
    assert.notEqual(hashVoucherCode("012345"), primary);
    process.env.VOUCHER_LOOKUP_KEY += "!";
    assert.throws(() => hashVoucherCode("012345"), /canonical/);
    delete process.env.VOUCHER_LOOKUP_KEY;
    const seen: Array<{hash:string; cutoff?: Date}> = [];
    const existingLegacy = async (hash: string, issuedBefore?: Date) => {
      seen.push({ hash, cutoff: issuedBefore });
      return hash === legacy ? { disabled: false, kind: "legacy" } : undefined;
    };
    assert.equal(await lookupVoucherRecord("012345", existingLegacy, now), undefined);
    assert.deepEqual(seen.map(row => row.hash), [primary], "Legacy lookup is disabled by default");
    process.env.VOUCHER_LEGACY_ISSUED_BEFORE = cutoff; process.env.VOUCHER_LEGACY_LOOKUP_UNTIL = until;
    seen.length = 0;
    assert.deepEqual(await lookupVoucherRecord("012345", existingLegacy, now), { disabled: false, kind: "legacy" });
    assert.equal(seen[1].cutoff?.toISOString(), cutoff.replace("Z", ".000Z"), "Legacy DB lookup must receive its immutable issued-stock cutoff");
    let secondLookup = false;
    assert.deepEqual(await lookupVoucherRecord("012345", async hash => {
      if (hash === primary) return { disabled: true, redemptionCount: 1 };
      secondLookup = true; return { disabled: false, redemptionCount: 0 };
    }, now), { disabled: true, redemptionCount: 1 });
    assert.equal(secondLookup, false, "Disabled/exhausted keyed records cannot redeem a different historic record");
    seen.length = 0;
    assert.equal(await lookupVoucherRecord("012345", existingLegacy, Date.parse(until)), undefined);
    assert.deepEqual(seen.map(row => row.hash), [primary], "Expiry retires SHA lookup while keeping keyed lookup usable");
    process.env.VOUCHER_LEGACY_LOOKUP_UNTIL = "2027-10-06T10:00:00Z";
    calls = 0;
    await assert.rejects(lookupVoucherRecord("012345", async () => { calls++; return undefined; }, now), /32 days/);
    assert.equal(calls, 0);
    delete process.env.VOUCHER_LEGACY_LOOKUP_UNTIL;
    assert.throws(() => legacyVoucherLookupPolicy(process.env, now), /explicit UTC dates/);
    process.env.VOUCHER_LEGACY_LOOKUP_UNTIL = until;
    process.env.VOUCHER_LEGACY_ISSUED_BEFORE = "2026-10-07T10:00:00Z";
    assert.throws(() => legacyVoucherLookupPolicy(process.env, now), /32 days/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
