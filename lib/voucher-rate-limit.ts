import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";

export const VOUCHER_RETRY_SECONDS = 15 * 60;

function attemptLimit(name: string, fallback: number) {
  const limit = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10_000) throw new Error("Invalid voucher attempt limit");
  return limit;
}

// Database-backed so cold starts and different Vercel instances share limits.
// Limits count attempts admitted by the preceding gate, including successes.
// The global ceiling stops bypassing device limits by inventing MAC addresses,
// while a locally blocked client cannot exhaust everyone else's global budget.
export async function consumeVoucherAttempt(macAddress: string, requestHeaders: Headers) {
  const trustedIp = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0].trim() : undefined;
  const scopes: Array<[string, number]> = [
    [`device:${macAddress.toUpperCase()}`, attemptLimit("VOUCHER_DEVICE_ATTEMPTS_PER_WINDOW", 5)]];
  if (trustedIp) scopes.push([`source:${trustedIp}`, attemptLimit("VOUCHER_SOURCE_ATTEMPTS_PER_WINDOW", 30)]);
  scopes.push(["global", attemptLimit("VOUCHER_GLOBAL_ATTEMPTS_PER_WINDOW", 100)]);
  const scopeKeys = scopes.map(([scope]) => createHash("sha256").update(`voucher-v1:${scope}`).digest("hex"));
  const gates = scopes.map(([, limit], index) => sql`
    ${sql.identifier(`gate_${index}`)} AS (
      INSERT INTO voucher_redemption_limits (scope_key, window_started_at, attempts)
      SELECT ${scopeKeys[index]}, now(), 1
      WHERE ${index === 0 ? sql`true` : sql`EXISTS (SELECT 1 FROM ${sql.identifier(`gate_${index - 1}`)})`}
      ON CONFLICT (scope_key) DO UPDATE SET
        attempts = CASE WHEN voucher_redemption_limits.window_started_at <= now() - interval '15 minutes'
          THEN 1 ELSE voucher_redemption_limits.attempts + 1 END,
        window_started_at = CASE WHEN voucher_redemption_limits.window_started_at <= now() - interval '15 minutes'
          THEN now() ELSE voucher_redemption_limits.window_started_at END
      WHERE voucher_redemption_limits.window_started_at <= now() - interval '15 minutes'
        OR voucher_redemption_limits.attempts < ${limit}
      RETURNING scope_key
    )`);
  // ON CONFLICT locks and checks the latest counter, rather than a separate
  // read/check/update that competing serverless requests could race. RETURNING
  // establishes each dependency within the same atomic database statement.
  const firstBlockedKey = sql`CASE ${sql.join(scopeKeys.map((key, index) =>
    sql`WHEN NOT EXISTS (SELECT 1 FROM ${sql.identifier(`gate_${index}`)}) THEN ${key}`), sql` `)} END`;
  const rows = await db.execute(sql`
    WITH ${sql.join(gates, sql`, `)}
    SELECT EXISTS (SELECT 1 FROM ${sql.identifier(`gate_${scopes.length - 1}`)}) AS allowed,
      COALESCE((SELECT CASE
        WHEN window_started_at <= now() - interval '15 minutes' THEN ${VOUCHER_RETRY_SECONDS}
        ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_started_at + interval '15 minutes' - now()))))::int
        END FROM voucher_redemption_limits WHERE scope_key = ${firstBlockedKey}), ${VOUCHER_RETRY_SECONDS}) AS retry_after
  `);
  const row = rows.rows[0];
  if (rows.rows.length !== 1 || typeof row?.allowed !== "boolean") throw new Error("Invalid voucher throttle result");
  const retryAfter = row.allowed ? 0 : Number(row.retry_after);
  if (!Number.isInteger(retryAfter) || retryAfter < 0 || retryAfter > VOUCHER_RETRY_SECONDS
    || (!row.allowed && retryAfter === 0)) throw new Error("Invalid voucher throttle result");
  return { allowed: row.allowed, retryAfter };
}
