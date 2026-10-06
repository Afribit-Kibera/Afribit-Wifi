import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { reconcileBitikaPayment } from "@/lib/payments/reconcile-bitika";
import { reconcilePaystackCollection } from "@/lib/payments/reconcile-paystack";
import { getMeshAccessStatus, getTrustedMeshContext } from "@/lib/mesh-access/service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return Response.json({ error: "Payment not found" }, { status: 404 });
  let [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
  if (payment.metadata.meshContextId) {
    const context = await getTrustedMeshContext(request);
    if (!context || context.id !== payment.metadata.meshContextId) return Response.json({ error: "Payment not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  let reconciliationUnavailable = false;
  if (payment.provider === "bitika") {
    try { await reconcileBitikaPayment(payment); } catch { reconciliationUnavailable = true; }
    [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  }
  if (payment.provider === "paystack") {
    try { await reconcilePaystackCollection(payment); } catch { reconciliationUnavailable = true; }
    [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  }
  const details = payment.metadata[payment.provider] as { status?: string; resolutionRequired?: boolean; collectionConfirmed?: boolean; bitcoinSettlement?: string } | undefined;
  const nativeAccess = payment.metadata.meshContextId ? (await getMeshAccessStatus(request, { paymentId: id })) ?? { status: "pending", expiresAt: null } : null;
  return Response.json({ status: payment.status, provider: payment.provider, providerStatus: details?.status, resolutionRequired: details?.resolutionRequired ?? false, collectionConfirmed: details?.collectionConfirmed ?? false, settlementStatus: details?.bitcoinSettlement, reconciliationUnavailable, nativeAccess }, { headers: { "Cache-Control": "private, no-store" } });
}

