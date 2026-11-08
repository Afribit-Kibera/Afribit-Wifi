import { and, eq, sql } from "drizzle-orm";
import { decryptVoucherCode, hashLegacyVoucherCode, hashVoucherCode } from "../../lib/voucher-crypto";

export function prepareVoucherLookupMigration(records: Array<{ id: string; oldHash: string; ciphertext: string; lastFour: string }>) {
  const replacements = records.map(record => {
    const code = decryptVoucherCode(record.ciphertext);
    if (hashLegacyVoucherCode(code) !== record.oldHash) throw new Error("Stored voucher ciphertext/hash mismatch; no migration applied");
    return { id: record.id, oldHash: record.oldHash, keyedHash: hashVoucherCode(code),
      lastFour: /^\d{6}$/.test(code) ? "" : record.lastFour };
  });
  if (new Set(replacements.map(record => record.keyedHash)).size !== replacements.length) throw new Error("Conflicting voucher values; no migration applied");
  return replacements;
}

// No plaintext codes, ciphertext, IDs or key material in console output.
// Inspect is read-only. Apply rekeys lookup hashes in one DB transaction and
// leaves ticket values, prices, dates, flags and usage counters untouched.
async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !["--inspect", "--apply"].includes(args[0]))) throw new Error("Use --inspect or explicit --apply");
  const apply = args[0] === "--apply";
  hashVoucherCode("configuration-check"); // Key readiness before any database work.
  const { db } = await import("../../lib/db");
  const { auditLogs, vouchers } = await import("../../lib/db/schema");
  const counts = await db.execute(sql`SELECT
    count(*) FILTER(WHERE code_hash ~ '^[a-f0-9]{64}$')::int AS legacy,
    count(*) FILTER(WHERE code_hash ~ '^hmac-sha256-v1:[a-f0-9]{64}$')::int AS keyed,
    count(*) FILTER(WHERE code_hash !~ '^[a-f0-9]{64}$' AND code_hash !~ '^hmac-sha256-v1:[a-f0-9]{64}$')::int AS unknown
    FROM vouchers`);
  const inventory = { legacy: Number(counts.rows[0].legacy), keyed: Number(counts.rows[0].keyed), unknown: Number(counts.rows[0].unknown) };
  if (!apply || inventory.legacy === 0) {
    console.log(JSON.stringify({ mode: apply ? "apply" : "inspect", inventory, changed: 0, financialRequestMade: false }));
    return;
  }
  if (inventory.unknown !== 0) throw new Error("Unknown voucher hash format requires review before migration");
  // Deliberately bounded operator migration. Larger stock requires a reviewed
  // batching plan rather than loading/decrypting an unlimited table at once.
  if (inventory.legacy > 1000) throw new Error("More than 1000 legacy vouchers: review a bounded batching plan first");
  const records = await db.select({ id: vouchers.id, oldHash: vouchers.codeHash, ciphertext: vouchers.codeCiphertext, lastFour: vouchers.codeLastFour })
    .from(vouchers).where(sql`${vouchers.codeHash} ~ '^[a-f0-9]{64}$'`).limit(1001);
  if (records.length !== inventory.legacy) throw new Error("Voucher inventory changed; pause issuance and inspect again");
  const replacements = prepareVoucherLookupMigration(records);
  if (!replacements.length) return;
  // One transaction: every keyed-hash update and the audit record commit together.
  const changed = await db.transaction(async tx => {
    let total = 0;
    for (const record of replacements) {
      const rows = await tx.update(vouchers).set({ codeHash: record.keyedHash, codeLastFour: record.lastFour })
        .where(and(eq(vouchers.id, record.id), eq(vouchers.codeHash, record.oldHash))).returning({ id: vouchers.id });
      total += rows.length;
    }
    await tx.insert(auditLogs).values({ actor: "operator:voucher-lookup-migration",
      action: "voucher.lookup_hmac_v1", entityType: "voucher_inventory", details: { intendedRows: records.length, plaintextExported: false } });
    return total;
  });
  console.log(JSON.stringify({ mode: "apply", changed, intended: records.length, financialRequestMade: false,
    ticketValuesChanged: false, flagsAndCountersChanged: false, inspectAgain: true }));
}

if (process.argv[1] && /(?:^|[\\/])migrate-voucher-lookup\.(?:ts|js)$/.test(process.argv[1])) main().catch(() => {
  // Do not leak driver query parameters/ciphertext on uniqueness/decrypt errors.
  console.error("Voucher lookup inspection/migration failed. No ticket values were exported; review configuration and retained stock.");
  process.exitCode = 1;
});
