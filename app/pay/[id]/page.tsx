import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { PaymentStatus } from "@/components/payment-status";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) notFound();
  return (
    <main className="portal-shell grid min-h-screen place-items-center p-5">
      <section className="panel w-full max-w-md p-7">
        <BrandMark className="justify-center" />
        <div className="mt-10"><PaymentStatus paymentId={payment.id} initialStatus={payment.status} checkoutUrl={payment.checkoutUrl} /></div>
      </section>
    </main>
  );
}

