import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes, randomInt } from "node:crypto";

function encryptionKey() {
  const value = process.env.VOUCHER_ENCRYPTION_KEY;
  if (!value) throw new Error("VOUCHER_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("VOUCHER_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

export function generateVoucherCode() {
  // randomInt uses rejection sampling: every six-digit value is equally likely.
  // Leading zeroes belong to the code and must survive CSV export and input.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVoucherCode(code: string) {
  const configured = process.env.VOUCHER_LOOKUP_KEY;
  const key = configured === undefined
    ? Buffer.from(hkdfSync("sha256", encryptionKey(), "afribit-mesh:voucher-lookup:v1", "lookup-only; separate from voucher export encryption", 32))
    : Buffer.from(configured, "base64");
  if (key.length !== 32 || (configured !== undefined && key.toString("base64") !== configured)) throw new Error("VOUCHER_LOOKUP_KEY must be a canonical 32-byte base64 key");
  return `hmac-sha256-v1:${createHmac("sha256", key).update(normalizeVoucherCode(code)).digest("hex")}`;
}

/** Only for bounded migration lookup/collision checks; never new issuance. */
export function hashLegacyVoucherCode(code: string) {
  return createHash("sha256").update(normalizeVoucherCode(code)).digest("hex");
}

export function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function encryptVoucherCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptVoucherCode(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
