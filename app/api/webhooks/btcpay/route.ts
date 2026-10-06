import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getBtcpayInvoice, mapBtcpayStatus } from "@/lib/btcpay";
import { queuePaidAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { accessGrants, payments } from "@/lib/db/schema";
import { readBoundedText, RequestBodyError } from "@/lib/request-body";
import { z } from "zod";

function validSignature(rawBody: string, signature: string | null) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("UNCONFIGURED_") || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  let rawBody: string;
  try { rawBody = await readBoundedText(request, 64_000); }
  catch (error) { return Response.json({ error: "Invalid event body" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  if (!validSignature(rawBody, request.headers.get("btcpay-sig"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); }
  catch { return Response.json({ error: "Invalid event" }, { status: 400 }); }
  const parsed = z.object({ invoiceId: z.string().min(1).max(200).optional() }).safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  const event = parsed.data;
  if (!event.invoiceId) return Response.json({ received: true });

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "btcpay"), eq(payments.providerInvoiceId, event.invoiceId)))
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
