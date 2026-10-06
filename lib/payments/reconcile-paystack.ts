import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { payments } from "../db/schema";
import { PaystackClient, createPaystackProvider, readPaystackConfig } from "./paystack";
import { PaymentProviderError } from "./types";
import { meshAutomaticAccessReady } from "../mesh-access/config";
import { queueMeshPaidAccess } from "../mesh-access/service";

// The Engine owns treasury pricing/sends. Mesh stores its verified receipt.
// The native access service owns the atomic router-bound handoff and receipt
// recheck. Fiat collection alone never enters that service.
export async function reconcilePaystackCollection(payment: typeof payments.$inferSelect, force = false) {
  if (payment.provider !== "paystack" || !payment.providerInvoiceId || !["new", "processing"].includes(payment.status)) return;
  const config = readPaystackConfig();
  if (config.mode !== "live") throw new PaymentProviderError("Sandbox payments cannot enter live collection records");
  if (!force) {
    const [lease] = await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('paystackLastCheckedAt', ${Date.now()}::bigint)` })
      .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"]), sql`COALESCE((${payments.metadata}->>'paystackLastCheckedAt')::bigint, 0) < ${Date.now() - 10_000}`)).returning({ id: payments.id });
    if (!lease) return;
  }
  const snapshot = await createPaystackProvider(new PaystackClient(config)).getSnapshot(payment.providerInvoiceId, payment.metadata);
  const bitcoinVerified = snapshot.status === "settled" && snapshot.verifiedBitcoinDelivery === true;
  const automaticAccess = bitcoinVerified && meshAutomaticAccessReady();
  const patch = JSON.stringify({ status: snapshot.providerStatus, collectionConfirmed: snapshot.collectionConfirmed ?? false,
    resolutionRequired: bitcoinVerified || (snapshot.resolutionRequired ?? false),
    bitcoinSettlement: bitcoinVerified ? "settled" : snapshot.settlementStatus ?? "pending",
    verifiedBitcoinDelivery: bitcoinVerified, paymentHash: snapshot.paymentHash,
    sourceTransactionId: snapshot.sourceTransactionId, amountSats: snapshot.amountSats,
    accessCommissioningRequired: bitcoinVerified && !automaticAccess });
  await db.update(payments).set({ status: snapshot.status === "invalid" ? "invalid" : "processing", updatedAt: new Date(), metadata: sql`jsonb_set(${payments.metadata}, '{paystack}', (${payments.metadata}->'paystack') || ${patch}::jsonb)` })
    .where(and(eq(payments.id, payment.id), eq(payments.provider, "paystack"), inArray(payments.status, ["new", "processing"])));
  // Persist the receipt before handing off. A retry uses the same purchase and
  // immutable native order; it cannot renew an allowance or repeat a BTC send.
  if (automaticAccess) await queueMeshPaidAccess(payment.id);
}
