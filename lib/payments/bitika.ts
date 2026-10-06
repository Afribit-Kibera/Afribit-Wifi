import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PaymentProviderError, type PaymentProvider, type ProviderSnapshot } from "./types";

const apiBase = "https://bitikaserver.up.railway.app";
const statuses = z.enum(["processing", "processing_payment", "fulfilled", "failed", "payment_failed"]);
// Bitika's provider changed on 6 October 2026: new codes use qadi_<hex>.
// Treat references as bounded opaque identifiers; retain historical/sandbox
// codes and case, but never allow URL separators, spaces or query characters.
export const bitikaTransactionCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{3,100}$/);
const codeSchema = bitikaTransactionCodeSchema;
const amountSchema = z.coerce.number().finite().min(10).max(10_000);
const lightningSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_.+-]+@[a-z0-9.-]+\.[a-z]{2,}$/);
const contextSchema = z.object({ mode: z.enum(["test", "live"]), amountKes: amountSchema, lightningAddress: lightningSchema });
const transactionSchema = z.object({
  transaction_code: codeSchema,
  status: statuses,
  amount: amountSchema,
  sats: z.coerce.number().int().nonnegative().nullable().optional(),
  lightningAddress: lightningSchema,
  paymentHash: z.string().nullable().optional(),
});
export type BitikaTransaction = z.infer<typeof transactionSchema>;
export type BitikaConfig = { mode: "test" | "live"; apiKey: string; lightningAddress: string };

export function readBitikaConfig(env: Record<string, string | undefined> = process.env): BitikaConfig {
  const mode = env.BITIKA_MODE ?? "test";
  const apiKey = env.BITIKA_API_KEY;
  const destination = lightningSchema.safeParse(env.BITIKA_LIGHTNING_ADDRESS);
  if (!apiKey || (mode !== "test" && mode !== "live") || !apiKey.startsWith(`bk_${mode}_`) || !destination.success) {
    throw new PaymentProviderError("M-Pesa payments are not configured");
  }
  return { mode, apiKey, lightningAddress: destination.data };
}

export function getBitikaReadiness(env: Record<string, string | undefined> = process.env) {
  let configured = false;
  let mode: "test" | "live" | null = null;
  try { const config = readBitikaConfig(env); configured = true; mode = config.mode; } catch { /* Optional provider. */ }
  const webhookConfigured = Boolean(env.BITIKA_WEBHOOK_SECRET && !env.BITIKA_WEBHOOK_SECRET.startsWith("UNCONFIGURED_"));
  return { configured, mode, webhookConfigured, enabled: env.BITIKA_ENABLED === "true", checkoutReady: configured && mode === "live" && webhookConfigured && env.BITIKA_ENABLED === "true" };
}

export function normalizeKenyanPhone(phone: string) {
  const normalized = phone.replace(/[\s()-]/g, "").replace(/^\+/, "").replace(/^0(?=[17])/, "254");
  if (!/^254[17]\d{8}$/.test(normalized)) throw new PaymentProviderError("Enter a valid Kenyan M-Pesa phone number", 400);
  return normalized;
}

export class BitikaClient {
  constructor(readonly config: BitikaConfig, private readonly fetcher: typeof fetch = fetch) {
    if (!config.apiKey.startsWith(`bk_${config.mode}_`)) throw new PaymentProviderError("Bitika key and mode do not match");
  }
  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetcher(apiBase + path, {
        ...init,
        headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json", ...init.headers },
        signal: AbortSignal.timeout(12_000), cache: "no-store", redirect: "error",
      });
    } catch {
      // Do not retry a money request automatically or expose its key/phone/body.
      throw new PaymentProviderError("We couldn’t confirm the M-Pesa request. Keep this payment open before trying again.");
    }
    if (!response.ok) {
      if (response.status === 409) throw new PaymentProviderError("This payment request changed. Start a new payment rather than reusing its reference.", 409);
      // The live API also uses 400 for a generic internal failure. Do not
      // blame the payer's number or invite a new logical collection reference.
      if (response.status === 400) throw new PaymentProviderError("The M-Pesa request was not accepted. Keep this payment open before trying again.", 400);
      throw new PaymentProviderError("M-Pesa payments are temporarily unavailable");
    }
    try { return await response.json(); } catch { throw new PaymentProviderError("M-Pesa returned an unexpected response"); }
  }
  async collect(input: { paymentId: string; amountKes: number; phone: string }) {
    if (!z.string().uuid().safeParse(input.paymentId).success) throw new PaymentProviderError("Invalid payment reference", 400);
    const amount = amountSchema.safeParse(input.amountKes);
    if (!amount.success) throw new PaymentProviderError("M-Pesa passes must cost between KES 10 and KES 10,000", 400);
    const response = await this.request("/api/v1/xwift/collect", {
      method: "POST", headers: { "Idempotency-Key": input.paymentId },
      body: JSON.stringify({ amount: String(amount.data), phone: normalizeKenyanPhone(input.phone), lightningAddress: this.config.lightningAddress }),
    });
    // Live M-Pesa collection acknowledges the STK with PENDING, whereas
    // transaction lookup uses the documented processing state. Normalize only
    // this known acknowledgement; it is never proof of collection or delivery.
    const parsed = z.object({ transaction_code: codeSchema,
      status: z.union([statuses, z.literal("PENDING")]).transform(value => value === "PENDING" ? "processing" as const : value) }).safeParse(response);
    if (!parsed.success || parsed.data.transaction_code.startsWith("SBX-") !== (this.config.mode === "test")) {
      throw new PaymentProviderError("We’re checking your payment request. Don’t pay again; keep this page open.");
    }
    return parsed.data;
  }
  async getTransaction(code: string): Promise<BitikaTransaction> {
    if (!codeSchema.safeParse(code).success || code.startsWith("SBX-") !== (this.config.mode === "test")) {
      throw new PaymentProviderError("Payment reference does not match the Bitika environment");
    }
    const parsed = z.object({ success: z.literal(true), data: transactionSchema }).safeParse(await this.request(`/api/v1/transactions/code/${encodeURIComponent(code)}`));
    if (!parsed.success || parsed.data.data.transaction_code !== code) throw new PaymentProviderError("M-Pesa returned an unexpected transaction");
    return parsed.data.data;
  }
  async quote(amountKes: number) {
    const amount = amountSchema.parse(amountKes);
    const parsed = z.object({ success: z.literal(true), data: z.object({ kesAmount: amountSchema, satsAmount: z.number().int().positive(), feePercentage: z.number().min(0).max(1) }) }).safeParse(await this.request(`/api/v1/exchange/rate?amount=${amount}`));
    if (!parsed.success || parsed.data.data.kesAmount !== amount) throw new PaymentProviderError("M-Pesa quote is unavailable");
    return parsed.data.data;
  }
}

export function verifiedBitikaSnapshot(transaction: BitikaTransaction, metadata: Record<string, unknown>): ProviderSnapshot {
  const expected = contextSchema.safeParse(metadata.bitika);
  if (!expected.success || transaction.amount !== expected.data.amountKes || transaction.lightningAddress !== expected.data.lightningAddress || transaction.transaction_code.startsWith("SBX-") !== (expected.data.mode === "test")) {
    throw new PaymentProviderError("The M-Pesa transaction does not match this purchase");
  }
  if (transaction.status === "fulfilled") {
    if (!transaction.sats || !Number.isSafeInteger(transaction.sats) || transaction.sats > 2_147_483_647 || !/^[a-f0-9]{64}$/i.test(transaction.paymentHash ?? "")) {
      throw new PaymentProviderError("Bitcoin delivery could not be verified");
    }
    return { status: "settled", providerStatus: transaction.status, amountSats: transaction.sats, paymentHash: transaction.paymentHash! };
  }
  if (transaction.status === "failed") return { status: "invalid", providerStatus: transaction.status };
  if (transaction.status === "payment_failed") return { status: "processing", providerStatus: transaction.status, resolutionRequired: true };
  return { status: "processing", providerStatus: transaction.status };
}

export function createBitikaProvider(client = new BitikaClient(readBitikaConfig())): PaymentProvider {
  return {
    id: "bitika",
    async createCheckout(input) {
      if (client.config.mode !== "live") throw new PaymentProviderError("Test M-Pesa transactions cannot buy real internet passes");
      if (!input.phone) throw new PaymentProviderError("Enter your M-Pesa phone number", 400);
      const transaction = await client.collect({ paymentId: input.paymentId, amountKes: input.amountKes, phone: input.phone });
      return { id: transaction.transaction_code, checkoutUrl: `/pay/${input.paymentId}`, metadata: { bitika: { mode: client.config.mode, amountKes: input.amountKes, lightningAddress: client.config.lightningAddress, status: transaction.status } } };
    },
    async getSnapshot(code, metadata) { return verifiedBitikaSnapshot(await client.getTransaction(code), metadata); },
  };
}

export function verifyBitikaSignature(rawBody: string, header: string | null, secret: string | undefined, now = Date.now()) {
  if (!secret || secret.startsWith("UNCONFIGURED_") || !header) return false;
  const fields = header.split(",").map(part => part.trim().split("="));
  if (fields.length !== 2 || fields.some(pair => pair.length !== 2) || new Set(fields.map(pair => pair[0])).size !== 2) return false;
  const values = Object.fromEntries(fields);
  if (!/^\d{1,12}$/.test(values.t ?? "") || !/^[a-f0-9]{64}$/i.test(values.v1 ?? "")) return false;
  if (Math.abs(now / 1000 - Number(values.t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${values.t}.${rawBody}`).digest();
  return timingSafeEqual(expected, Buffer.from(values.v1, "hex"));
}
