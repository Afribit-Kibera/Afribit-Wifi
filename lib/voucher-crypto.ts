import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function encryptionKey() {
  const value = process.env.VOUCHER_ENCRYPTION_KEY;
  if (!value) throw new Error("VOUCHER_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("VOUCHER_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

export function generateVoucherCode(prefix = "BV") {
  const bytes = randomBytes(12);
  let body = "";
  for (let index = 0; index < 12; index += 1) {
    body += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return `${prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}

export function hashVoucherCode(code: string) {
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

