import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { PaymentStatus } from "@/components/payment-status";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { headers } from "next/headers";
import { getMeshAccessStatus, getTrustedMeshContext } from "@/lib/mesh-access/service";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) notFound();
  let nativeAccess = null;
  if (payment.metadata.meshContextId) {
    const request = new Request(`https://wifi.afribit.africa/pay/${id}`, { headers: await headers() });
    const context = await getTrustedMeshContext(request);
    if (!context || context.id !== payment.metadata.meshContextId) notFound();
    nativeAccess = (await getMeshAccessStatus(request, { paymentId: id })) ?? { status: "pending" as const, expiresAt: null };
  }
  const details = payment.metadata[payment.provider] as { status?: string; resolutionRequired?: boolean; collectionConfirmed?: boolean; bitcoinSettlement?: string } | undefined;
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <PaymentStatus paymentId={payment.id} initialStatus={payment.status} checkoutUrl={payment.checkoutUrl} provider={payment.provider} initialResolutionRequired={Boolean(details?.resolutionRequired)} initialNativeAccess={nativeAccess} initialProviderStatus={details?.status} initialCollectionConfirmed={Boolean(details?.collectionConfirmed)} initialSettlementStatus={details?.bitcoinSettlement} />
      </section>
    </main>
  );
}

