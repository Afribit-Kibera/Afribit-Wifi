import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { PaymentStatus } from "@/components/payment-status";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { headers } from "next/headers";
import { getMeshAccessStatus, getTrustedMeshContext } from "@/lib/mesh-access/service";
import { ownsPurchase } from "@/lib/payments/earlier-purchase";
import { readStoredLightning } from "@/lib/payments/lightning";
import QRCode from "qrcode";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) notFound();
  let nativeAccess = null;
  if (payment.metadata.meshContextId) {
    const request = new Request(`https://wifi.afribit.africa/pay/${id}`, { headers: await headers() });
    const context = await getTrustedMeshContext(request);
    if (!context || !await ownsPurchase(context, payment)) notFound();
    nativeAccess = (await getMeshAccessStatus(request, { paymentId: id })) ?? { status: "pending" as const, expiresAt: null };
  }
  // The invoice is shown only to the device that owns this payment (checked above).
  const stored = payment.provider === "lightning" ? readStoredLightning(payment.metadata) : null;
  const price = payment.metadata.bitcoinPrice as { amountKes?: number; savedKes?: number; discountPercent?: number } | undefined;
  const lightning = stored && /^lnbc[0-9a-z]+$/i.test(stored.invoice.paymentRequest) ? {
    paymentRequest: stored.invoice.paymentRequest, amountSats: stored.amountSats, expiresAt: stored.expiresAt,
    amountKes: price?.amountKes ?? null, savedKes: price?.savedKes ?? 0, discountPercent: price?.discountPercent ?? 0,
    qrSvg: await QRCode.toString(stored.invoice.paymentRequest.toUpperCase(), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#203c32", light: "#ffffff" } }),
  } : null;
  const details = payment.metadata[payment.provider] as { status?: string; resolutionRequired?: boolean; collectionConfirmed?: boolean; bitcoinSettlement?: string } | undefined;
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <PaymentStatus paymentId={payment.id} initialStatus={payment.status} checkoutUrl={payment.checkoutUrl} provider={payment.provider} initialResolutionRequired={Boolean(details?.resolutionRequired)} initialNativeAccess={nativeAccess} initialProviderStatus={details?.status} initialCollectionConfirmed={Boolean(details?.collectionConfirmed)} initialSettlementStatus={details?.bitcoinSettlement} lightning={lightning} />
      </section>
    </main>
  );
}

