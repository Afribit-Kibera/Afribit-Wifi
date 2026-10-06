import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MeshConnectionStatus, type MeshConnectionState } from "@/components/mesh-connection-status";

export default async function ConnectedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const grantId = typeof query.grant === "string" ? query.grant : undefined;
  const paymentId = typeof query.payment === "string" ? query.payment : undefined;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validPaymentId = paymentId && uuid.test(paymentId) ? paymentId : undefined;
  const validGrantId = grantId && uuid.test(grantId) ? grantId : undefined;
  // The browser's HttpOnly Mesh session authenticates the status request. A
  // public payment/grant UUID alone cannot establish customer ownership.
  const state: MeshConnectionState = validPaymentId || validGrantId ? "pending" : "unknown";
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <MeshConnectionStatus state={state} paymentId={validPaymentId} grantId={validGrantId} />
      </section>
    </main>
  );
}

