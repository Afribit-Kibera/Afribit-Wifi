import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { payments } from "../db/schema";
import { BlinkReceiveClient, readBlinkConfig } from "./blink";
import { PaymentProviderError, type PaymentProvider } from "./types";
import { meshAutomaticAccessReady } from "../mesh-access/config";
import { queueMeshLightningPaidAccess } from "../mesh-access/service";

// Bitcoin-only checkout: the customer pays a Lightning invoice straight into
// the Afribit Blink wallet. No conversion, no M-Pesa, no third-party checkout.
export const lightningInvoiceMinutes = 10;

const storedSchema = z.object({
  status: z.string(),
  amountSats: z.number().int().positive(),
  invoice: z.object({ paymentRequest: z.string(), paymentHash: z.string(), satoshis: z.number().int().positive(), walletId: z.string() }),
  expiresAt: z.string(),
});
export type StoredLightning = z.infer<typeof storedSchema>;

export function satsForKes(amountKes: number, kesCentsPerSat: number) {
  return Math.ceil((amountKes * 100) / kesCentsPerSat);
}

export function lightningReady(env: Record<string, string | undefined> = process.env) {
  try { readBlinkConfig(env); return true; } catch { return false; }
}

export function readStoredLightning(metadata: Record<string, unknown>): StoredLightning | null {
  const parsed = storedSchema.safeParse(metadata.lightning);
  return parsed.success ? parsed.data : null;
}

export function createLightningProvider(client = new BlinkReceiveClient(readBlinkConfig())): PaymentProvider {
  return {
    id: "lightning",
    async createCheckout(input) {
      const kesCentsPerSat = await client.kesCentsPerSat();
      const amountSats = satsForKes(input.amountKes, kesCentsPerSat);
      if (amountSats < 1 || amountSats > 5_000_000) throw new PaymentProviderError("This pass cannot be paid with Bitcoin", 409);
      const invoice = await client.createReceiveInvoice(input.paymentId, amountSats, lightningInvoiceMinutes);
      const lightning: StoredLightning = { status: "pending", amountSats, invoice,
        expiresAt: new Date(Date.now() + lightningInvoiceMinutes * 60_000).toISOString() };
      return { id: invoice.paymentHash, checkoutUrl: `/pay/${input.paymentId}`, amountSats,
        metadata: { lightning: { ...lightning, kesCentsPerSat } } };
    },
    async getSnapshot(_invoiceId, metadata) {
      const stored = readStoredLightning(metadata);
      if (!stored) throw new PaymentProviderError("This payment needs review. Do not pay again.");
      const result = await client.getReceiveStatus(stored.invoice);
      return { status: result.status === "PAID" ? "settled" : result.status === "EXPIRED" ? "expired" : "new",
        providerStatus: result.status.toLowerCase(), amountSats: result.amountSats, paymentHash: result.paymentHash,
        verifiedBitcoinDelivery: result.verifiedBitcoinDelivery };
    },
  };
}

// Checks one Lightning payment with Blink. Paid: hand off to the router once.
// Expired: close it so the device can start another purchase.
export async function reconcileLightningPayment(payment: typeof payments.$inferSelect, force = false, client?: BlinkReceiveClient) {
  if (payment.provider !== "lightning" || !payment.providerInvoiceId || !["new", "processing"].includes(payment.status)) return;
  const stored = readStoredLightning(payment.metadata);
  if (!stored || stored.invoice.paymentHash !== payment.providerInvoiceId || stored.invoice.satoshis !== stored.amountSats) {
    throw new PaymentProviderError("This payment needs review. Do not pay again.");
  }
  if (!force) {
    const [lease] = await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('lightningLastCheckedAt', ${Date.now()}::bigint)` })
      .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"]),
        sql`COALESCE((${payments.metadata}->>'lightningLastCheckedAt')::bigint, 0) < ${Date.now() - 2_000}`)).returning({ id: payments.id });
    if (!lease) return;
  }
  const result = await (client ?? new BlinkReceiveClient(readBlinkConfig())).getReceiveStatus(stored.invoice);
  if (result.status === "PAID") {
    if (!meshAutomaticAccessReady()) throw new PaymentProviderError("Internet activation is reconnecting. Do not pay again.");
    await db.update(payments).set({ status: "processing", updatedAt: new Date(),
      metadata: sql`jsonb_set(${payments.metadata}, '{lightning}', (${payments.metadata}->'lightning') || '{"status":"paid","verifiedBitcoinDelivery":true}'::jsonb)` })
      .where(and(eq(payments.id, payment.id), eq(payments.provider, "lightning"), inArray(payments.status, ["new", "processing"])));
    await queueMeshLightningPaidAccess(payment.id, { paymentHash: result.paymentHash, amountSats: result.amountSats });
    return;
  }
  if (result.status === "EXPIRED") {
    await db.update(payments).set({ status: "expired", updatedAt: new Date(),
      metadata: sql`jsonb_set(${payments.metadata}, '{lightning}', (${payments.metadata}->'lightning') || '{"status":"expired"}'::jsonb)` })
      .where(and(eq(payments.id, payment.id), eq(payments.provider, "lightning"), inArray(payments.status, ["new", "processing"]),
        sql`COALESCE(${payments.metadata}->'lightning'->>'status','') <> 'paid'`));
  }
}
