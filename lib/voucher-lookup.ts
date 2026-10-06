import { hashLegacyVoucherCode, hashVoucherCode } from "./voucher-crypto";

/** Compatibility is explicitly dated, stock-bounded and off by default. */
export function legacyVoucherLookupPolicy(env: Record<string, string | undefined> = process.env, now = Date.now()) {
  const before = env.VOUCHER_LEGACY_ISSUED_BEFORE, until = env.VOUCHER_LEGACY_LOOKUP_UNTIL;
  if (before === undefined && until === undefined) return null;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!before || !until || !iso.test(before) || !iso.test(until)) throw new Error("Legacy voucher compatibility requires explicit UTC dates");
  const issuedBefore = Date.parse(before), expiresAt = Date.parse(until);
  const canonical = (value: string) => value.includes(".") ? value : value.replace("Z", ".000Z");
  if (!Number.isFinite(issuedBefore) || !Number.isFinite(expiresAt) || issuedBefore > now || expiresAt <= issuedBefore ||
      expiresAt - issuedBefore > 32 * 86_400_000) throw new Error("Legacy voucher compatibility must end within 32 days of the issuance cutoff");
  if (new Date(issuedBefore).toISOString() !== canonical(before) || new Date(expiresAt).toISOString() !== canonical(until)) throw new Error("Legacy voucher compatibility requires valid UTC calendar dates");
  return now < expiresAt ? { issuedBefore: new Date(issuedBefore), expiresAt: new Date(expiresAt) } : null;
}

export async function lookupVoucherRecord<T>(code: string,
  lookup: (hash: string, issuedBefore?: Date) => Promise<T | undefined>, now = Date.now()) {
  // Validate both key and compatibility configuration before querying stock.
  const primaryHash = hashVoucherCode(code), policy = legacyVoucherLookupPolicy(process.env, now);
  const primary = await lookup(primaryHash);
  // An existing HMAC record is authoritative, even when disabled/exhausted.
  // Never fall through and redeem another legacy record for the same code.
  if (primary !== undefined) return primary;
  return policy ? lookup(hashLegacyVoucherCode(code), policy.issuedBefore) : undefined;
}
