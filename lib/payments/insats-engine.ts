import { createHmac } from "node:crypto";
import { z } from "zod";
import { PaymentProviderError } from "./types";

const engineBase = "https://engine.insats.org";
const uuid = z.string().uuid();
const receiptSchema = z.object({
  paymentId: uuid, reference: z.string(), amountKes: z.number().int().positive(),
  amountSats: z.number().int().positive().max(2_147_483_647),
  destination: z.string(), status: z.enum(["registered", "invoice_ready", "send_started", "settled", "review_required"]),
  collectionConfirmed: z.literal(true), verifiedBitcoinDelivery: z.boolean(),
  paymentHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  sourceTransactionId: z.string().min(1).nullable(), settledAt: z.string().nullable(), resolutionRequired: z.boolean(),
});
export type EngineSettlement = z.infer<typeof receiptSchema>;
export type EngineConfig = { serviceKey: string; destination: string };

export function readEngineConfig(env: Record<string, string | undefined> = process.env): EngineConfig {
  if (env.BLINK_SETTLEMENT_ENABLED !== "true" || (env.INSATS_ENGINE_URL && env.INSATS_ENGINE_URL !== engineBase) ||
      !env.INSATS_MESH_SERVICE_KEY || env.INSATS_MESH_SERVICE_KEY.length < 32 || !/^[a-z0-9_.-]+@blink\.sv$/.test(env.MESH_LIGHTNING_ADDRESS ?? "")) {
    throw new PaymentProviderError("The Bitcoin settlement engine is not configured");
  }
  return { serviceKey: env.INSATS_MESH_SERVICE_KEY, destination: env.MESH_LIGHTNING_ADDRESS! };
}

export function engineConfigured(env: Record<string, string | undefined> = process.env) {
  try { readEngineConfig(env); return true; } catch { return false; }
}

export function meshServiceHeaders(config: EngineConfig, method: string, path: string, body = "", timestamp = Math.floor(Date.now() / 1000).toString()) {
  const signature = createHmac("sha256", config.serviceKey).update(`${timestamp}\n${method}\n${path}\n${body}`).digest("hex");
  return { "Content-Type": "application/json", "x-mesh-timestamp": timestamp, "x-mesh-signature": signature };
}

export class InsatsSettlementClient {
  constructor(readonly config: EngineConfig, private readonly fetcher: typeof fetch = fetch) {}
  private async request(method: string, path: string, body = "") {
    let response: Response;
    try {
      response = await this.fetcher(engineBase + path, { method, headers: meshServiceHeaders(this.config, method, path.split("?")[0], body),
        ...(body ? { body } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45_000) });
    } catch { throw new PaymentProviderError("Bitcoin settlement is unconfirmed. Keep this payment reference; do not pay again."); }
    if (!response.ok) throw new PaymentProviderError("The Bitcoin settlement engine needs a receipt check. Do not pay again.");
    try { return await response.json() as unknown; } catch { throw new PaymentProviderError("Bitcoin settlement receipt could not be confirmed"); }
  }
  async readiness() { return this.request("GET", "/rails/mesh/readiness"); }
  async checkoutReadiness(amountKes: number) {
    if (!Number.isInteger(amountKes) || amountKes < 10 || amountKes > 10_000) throw new PaymentProviderError("Invalid pass price", 400);
    const ready = z.object({ enabled: z.literal(true), amountKes: z.literal(amountKes), amountSats: z.number().int().positive(),
      checkoutReady: z.literal(true), budgetAvailable: z.literal(true), writeScope: z.literal(true), funded: z.literal(true),
      sourceWalletVerified: z.literal(true), destinationVerified: z.literal(true), distinctWallets: z.literal(true) })
      .safeParse(await this.request("GET", `/rails/mesh/readiness?amountKes=${amountKes}`));
    if (!ready.success) throw new PaymentProviderError("Internet checkout is temporarily unavailable. No payment was requested.");
    return ready.data;
  }
  private verify(payload: unknown, paymentId: string, amountKes: number) {
    const parsed = receiptSchema.safeParse(payload);
    if (!parsed.success || parsed.data.paymentId !== paymentId || parsed.data.reference !== `mesh-${paymentId}` ||
        parsed.data.amountKes !== amountKes || parsed.data.destination !== this.config.destination ||
        (parsed.data.verifiedBitcoinDelivery && (parsed.data.status !== "settled" || !parsed.data.paymentHash || !parsed.data.sourceTransactionId || !parsed.data.settledAt)) ||
        (!parsed.data.verifiedBitcoinDelivery && parsed.data.status === "settled")) {
      throw new PaymentProviderError("The Bitcoin receipt does not match this Mesh payment");
    }
    return parsed.data;
  }
  private validate(paymentId: string, amountKes: number) {
    if (!uuid.safeParse(paymentId).success || paymentId !== paymentId.toLowerCase() || !Number.isSafeInteger(amountKes) || amountKes < 10 || amountKes > 10_000) {
      throw new PaymentProviderError("Invalid Mesh settlement reference or amount", 400);
    }
  }
  async getReceipt(paymentId: string, amountKes: number) {
    this.validate(paymentId, amountKes);
    return this.verify(await this.request("GET", `/rails/mesh/settlements/${paymentId}`), paymentId, amountKes);
  }
  async settle(paymentId: string, amountKes: number) {
    this.validate(paymentId, amountKes);
    // Engine registration and reconciliation are idempotent. The Engine saves
    // one invoice/send reservation and never sends twice after ambiguity.
    const registered = this.verify(await this.request("POST", "/rails/mesh/settlements", JSON.stringify({ paymentId, amountKes })), paymentId, amountKes);
    if (registered.verifiedBitcoinDelivery) return registered;
    return this.verify(await this.request("POST", `/rails/mesh/settlements/${paymentId}/reconcile`), paymentId, amountKes);
  }
}
