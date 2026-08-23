import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getBtcpayInvoice, mapBtcpayStatus } from "@/lib/btcpay";
import { queuePaidAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { accessGrants, payments } from "@/lib/db/schema";

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("UNCONFIGURED_") || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("btcpay-sig"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { invoiceId?: string };
  if (!event.invoiceId) return Response.json({ received: true });

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerInvoiceId, event.invoiceId))
    .limit(1);
  if (!payment) return Response.json({ received: true });

  const invoice = await getBtcpayInvoice(event.invoiceId);
  const status = mapBtcpayStatus(invoice.status);
  await db.update(payments).set({ status, settledAt: status === "settled" ? new Date() : payment.settledAt, updatedAt: new Date() }).where(eq(payments.id, payment.id));

  if (status === "settled" && payment.portalSessionId && payment.packageId) {
    const [existingGrant] = await db
      .select({ id: accessGrants.id })
      .from(accessGrants)
      .where(and(eq(accessGrants.paymentId, payment.id), eq(accessGrants.portalSessionId, payment.portalSessionId)))
      .limit(1);
    if (!existingGrant) await queuePaidAccess(payment.id, payment.portalSessionId, payment.packageId);
  }

  return Response.json({ received: true });
}
