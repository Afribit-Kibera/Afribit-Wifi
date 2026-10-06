import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { normalizeKenyanPhone } from "./bitika";
import { PaymentProviderError, type PaymentProvider, type ProviderSnapshot } from "./types";
import { engineConfigured, InsatsSettlementClient, readEngineConfig } from "./insats-engine";
import { meshAutomaticAccessReady } from "../mesh-access/config";

const apiBase = "https://api.paystack.co";
const uuid = z.string().uuid();
const referenceSchema = z.string().regex(/^mesh-[0-9a-f-]{36}$/i);
const amountSchema = z.number().int().min(10).max(10_000);
const emailSchema = z.string().trim().email().max(254);
const transactionSchema = z.object({
  reference: referenceSchema, status: z.string().min(1),
  amount: z.number().int().nonnegative(), currency: z.string(), domain: z.enum(["test", "live"]),
  channel: z.string(), metadata: z.unknown(),
});
export type PaystackTransaction = z.infer<typeof transactionSchema>;
export type PaystackConfig = { mode: "test" | "live"; secretKey: string; receiptEmail?: string };

export function readPaystackConfig(env: Record<string, string | undefined> = process.env): PaystackConfig {
  const mode = env.PAYSTACK_MODE ?? "test";
  if ((mode !== "test" && mode !== "live") || !env.PAYSTACK_SECRET_KEY?.startsWith(`sk_${mode}_`) ||
      (env.PAYSTACK_PUBLIC_KEY && !env.PAYSTACK_PUBLIC_KEY.startsWith(`pk_${mode}_`))) {
    throw new PaymentProviderError("M-Pesa payments are not configured");
  }
  const email = env.PAYSTACK_RECEIPT_EMAIL ? emailSchema.safeParse(env.PAYSTACK_RECEIPT_EMAIL) : null;
  if (email && !email.success) throw new PaymentProviderError("The payment receipt email is not configured");
  return { mode, secretKey: env.PAYSTACK_SECRET_KEY, receiptEmail: email?.data };
}

export function getPaystackReadiness(env: Record<string, string | undefined> = process.env) {
  let configured = false;
  let mode: "test" | "live" | null = null;
  let receiptEmailConfigured = false;
  try { const config = readPaystackConfig(env); configured = true; mode = config.mode; receiptEmailConfigured = Boolean(config.receiptEmail); } catch { /* Optional provider. */ }
  const settlementReady = engineConfigured(env);
  const accessReady = meshAutomaticAccessReady(env);
  const enabled = env.PAYSTACK_ENABLED === "true";
  // Provider availability alone cannot sell a pass. Router enrollment, native
  // activation/expiry commissioning and the settlement engine must be ready.
  const checkoutReady = configured && mode === "live" && receiptEmailConfigured && enabled && settlementReady && accessReady;
  return { configured, mode, receiptEmailConfigured, enabled,
    settlementReady, accessReady, checkoutReady, blocker: checkoutReady ? null : !settlementReady ? "bitcoin_settlement_not_commissioned" :
      !accessReady ? "internet_access_not_commissioned" : "payment_provider_not_configured" };
}

export function meshPaystackReference(paymentId: string) {
  if (!uuid.safeParse(paymentId).success) throw new PaymentProviderError("Invalid payment reference", 400);
  return `mesh-${paymentId.toLowerCase()}`;
}

export class PaystackClient {
  constructor(readonly config: PaystackConfig, private readonly fetcher: typeof fetch = fetch) {
    if (!config.secretKey.startsWith(`sk_${config.mode}_`)) throw new PaymentProviderError("Paystack key and mode do not match");
  }
  private async request(path: string, init: RequestInit = {}) {
    let response: Response;
    try {
      response = await this.fetcher(apiBase + path, { ...init,
        headers: { Authorization: `Bearer ${this.config.secretKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12_000), redirect: "error", cache: "no-store" });
    } catch {
      throw new PaymentProviderError("We couldn’t confirm the M-Pesa request. Keep this payment reference and don’t pay again.");
    }
    if (response.status === 404 && init.method !== "POST") return null;
    if (!response.ok) throw new PaymentProviderError("M-Pesa payments are temporarily unavailable. Keep this payment reference.");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PaymentProviderError("The M-Pesa response could not be confirmed"); }
    const parsed = z.object({ status: z.literal(true), data: z.unknown() }).safeParse(payload);
    if (!parsed.success) throw new PaymentProviderError("The M-Pesa request could not be confirmed. Keep this payment reference.");
    return parsed.data.data;
  }
  async collect(input: { paymentId: string; amountKes: number; phone: string; email: string }) {
    const reference = meshPaystackReference(input.paymentId);
    const amount = amountSchema.safeParse(input.amountKes);
    const email = emailSchema.safeParse(input.email);
    if (!amount.success) throw new PaymentProviderError("M-Pesa passes must cost between KES 10 and KES 10,000", 400);
    if (!email.success) throw new PaymentProviderError("A valid payment receipt email is required", 400);
    const payload = await this.request("/charge", { method: "POST", body: JSON.stringify({
      amount: amount.data * 100, currency: "KES", email: email.data, reference,
      mobile_money: { phone: `+${normalizeKenyanPhone(input.phone)}`, provider: "mpesa" },
      metadata: { tag: "mesh", tags: ["mesh"], source: "mesh", meshPaymentId: input.paymentId.toLowerCase(),
        custom_fields: [{ display_name: "Service", variable_name: "service", value: "mesh" }] },
    }) });
    const parsed = z.object({ reference: z.literal(reference), status: z.string().min(1) }).safeParse(payload);
    if (!parsed.success) throw new PaymentProviderError("The M-Pesa reference could not be confirmed. Don’t pay again.");
    return parsed.data;
  }
  async getTransaction(reference: string): Promise<PaystackTransaction | null> {
    if (!referenceSchema.safeParse(reference).success || !uuid.safeParse(reference.slice(5)).success) throw new PaymentProviderError("Invalid Mesh payment reference", 400);
    const payload = await this.request(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (payload === null) return null;
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success || parsed.data.reference !== reference || parsed.data.domain !== this.config.mode) throw new PaymentProviderError("The transaction does not match this payment environment");
    return parsed.data;
  }
}

export function verifiedPaystackCollection(transaction: PaystackTransaction, expected: { paymentId: string; amountKes: number; mode: "test" | "live" }) {
  let metadata = transaction.metadata;
  if (typeof metadata === "string") { try { metadata = JSON.parse(metadata); } catch { metadata = null; } }
  const tag = z.object({ tag: z.literal("mesh"), source: z.literal("mesh"), meshPaymentId: uuid }).safeParse(metadata);
  if (!amountSchema.safeParse(expected.amountKes).success || transaction.reference !== meshPaystackReference(expected.paymentId) ||
      transaction.domain !== expected.mode || transaction.currency !== "KES" || transaction.amount !== expected.amountKes * 100 ||
      transaction.channel !== "mobile_money" || !tag.success || tag.data.meshPaymentId !== expected.paymentId.toLowerCase()) {
    throw new PaymentProviderError("The M-Pesa transaction does not match this purchase");
  }
  return { collectionConfirmed: transaction.status === "success", providerStatus: transaction.status,
    amountKes: expected.amountKes, mode: expected.mode, reference: transaction.reference };
}

export function createPaystackProvider(client = new PaystackClient(readPaystackConfig()), engine?: InsatsSettlementClient): PaymentProvider {
  return {
    id: "paystack",
    async createCheckout(input) {
      if (client.config.mode !== "live") throw new PaymentProviderError("Test M-Pesa transactions cannot buy real internet passes");
      if (!input.phone || !client.config.receiptEmail) throw new PaymentProviderError("M-Pesa receipt configuration is incomplete");
      const transaction = await client.collect({ paymentId: input.paymentId, amountKes: input.amountKes, phone: input.phone, email: client.config.receiptEmail });
      return { id: transaction.reference, checkoutUrl: `/pay/${input.paymentId}`, metadata: {
        paystack: { mode: client.config.mode, amountKes: input.amountKes, paymentId: input.paymentId.toLowerCase(),
          tag: "mesh", status: transaction.status, collectionConfirmed: false, bitcoinSettlement: "pending" },
      } };
    },
    async getSnapshot(reference, metadata): Promise<ProviderSnapshot> {
      const expected = z.object({ paymentId: uuid, amountKes: amountSchema, mode: z.enum(["test", "live"]) }).safeParse(metadata.paystack);
      if (!expected.success) throw new PaymentProviderError("Payment context is unavailable");
      const transaction = await client.getTransaction(reference);
      if (!transaction) return { status: "processing", providerStatus: "unconfirmed" };
      const collection = verifiedPaystackCollection(transaction, expected.data);
      if (collection.collectionConfirmed && expected.data.mode === "live" && (engine || engineConfigured())) {
        const receipt = await (engine ?? new InsatsSettlementClient(readEngineConfig())).settle(expected.data.paymentId, expected.data.amountKes);
        return { status: receipt.verifiedBitcoinDelivery ? "settled" : "processing", providerStatus: collection.providerStatus,
          collectionConfirmed: true, amountSats: receipt.amountSats, paymentHash: receipt.paymentHash ?? undefined,
          verifiedBitcoinDelivery: receipt.verifiedBitcoinDelivery, settlementStatus: receipt.status,
          sourceTransactionId: receipt.sourceTransactionId ?? undefined, resolutionRequired: receipt.resolutionRequired };
      }
      // A KES success is not a Bitcoin receipt and must never create a pass.
      return { status: ["failed", "abandoned", "reversed"].includes(collection.providerStatus) ? "invalid" : "processing", providerStatus: collection.providerStatus,
        collectionConfirmed: collection.collectionConfirmed, resolutionRequired: collection.collectionConfirmed };
    },
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null, secretKey: string | undefined) {
  if (!secretKey?.startsWith("sk_live_") || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
