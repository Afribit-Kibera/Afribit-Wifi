import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";

function limit(name: string, fallback: number) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1 || value > 10_000) throw new Error("Invalid checkout attempt limit");
  return value;
}

// Use the existing durable counter store with a separate namespace. A new
// request UUID or gateway join cookie cannot evade the device/phone limits.
// Call only for a new M-Pesa purchase, after trusted host and phone validation.
export async function consumeCheckoutAttempt(input: { routerId: string; macAddress: string; phone: string }) {
  const scopes: Array<[string, number]> = [
    [`device:${input.routerId}:${input.macAddress.toUpperCase()}`, limit("CHECKOUT_DEVICE_ATTEMPTS_PER_WINDOW", 3)],
    [`phone:${input.phone}`, limit("CHECKOUT_PHONE_ATTEMPTS_PER_WINDOW", 5)],
  ];
  const keys = scopes.map(([scope]) => createHash("sha256").update(`checkout-v1:${scope}`).digest("hex"));
  const rows = await db.execute(sql`
    INSERT INTO voucher_redemption_limits(scope_key,window_started_at,attempts)
    VALUES ${sql.join(keys.map(key => sql`(${key},now(),1)`), sql`, `)}
    ON CONFLICT(scope_key) DO UPDATE SET
      attempts=CASE WHEN voucher_redemption_limits.window_started_at <= now()-interval '15 minutes'
        THEN 1 ELSE LEAST(voucher_redemption_limits.attempts+1,10001) END,
      window_started_at=CASE WHEN voucher_redemption_limits.window_started_at <= now()-interval '15 minutes'
        THEN now() ELSE voucher_redemption_limits.window_started_at END
    RETURNING scope_key,attempts,
      GREATEST(1,CEIL(EXTRACT(EPOCH FROM (window_started_at+interval '15 minutes'-now()))))::int AS retry_after
  `);
  if (rows.rows.length !== scopes.length) throw new Error("Checkout throttle unavailable");
  let retryAfter = 0;
  for (const row of rows.rows) {
    const index = keys.indexOf(String(row.scope_key));
    if (index < 0) throw new Error("Checkout throttle unavailable");
    if (Number(row.attempts) > scopes[index][1]) retryAfter = Math.max(retryAfter, Number(row.retry_after));
  }
  return { allowed: retryAfter === 0, retryAfter };
}
