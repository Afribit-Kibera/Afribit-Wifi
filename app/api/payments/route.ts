import { z } from "zod";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createBtcpayInvoice } from "@/lib/btcpay";
import { db } from "@/lib/db";
import { packages, payments } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/portal-session";
import { queuePaymentBootstrap } from "@/lib/access";

const paymentSchema = z.object({
  packageId: z.string().uuid(),
  macAddress: z.string().trim().min(1).max(64),
  ipAddress: z.string().trim().max(64).optional(),
  routerId: z.string().trim().max(100).optional(),
  loginUrl: z.string().url().max(1000).optional(),
  originalUrl: z.string().url().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = paymentSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid package or network session" }, { status: 400 });

  const [wifiPackage] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, parsed.data.packageId))
    .limit(1);
  if (!wifiPackage || !wifiPackage.active) return Response.json({ error: "This package is unavailable" }, { status: 404 });

  const requestHeaders = await headers();
  const session = await createPortalSession({ ...parsed.data, userAgent: requestHeaders.get("user-agent") });
  const [payment] = await db
    .insert(payments)
    .values({
      portalSessionId: session.id,
      packageId: wifiPackage.id,
      amountSats: wifiPackage.priceSats,
      metadata: { packageName: wifiPackage.name, priceKes: wifiPackage.priceKes },
    })
    .returning();

  try {
    const invoice = await createBtcpayInvoice({ paymentId: payment.id, amountSats: payment.amountSats, packageName: wifiPackage.name });
    await db
      .update(payments)
      .set({ providerInvoiceId: invoice.id, checkoutUrl: invoice.checkoutLink, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    try {
      await queuePaymentBootstrap(session.id);
    } catch (bootstrapError) {
      console.error("Payment bootstrap grant failed", bootstrapError instanceof Error ? bootstrapError.message : "Unknown error");
    }
    return Response.json({ paymentId: payment.id, checkoutUrl: invoice.checkoutLink }, { status: 201 });
  } catch (error) {
    await db.update(payments).set({ status: "invalid", updatedAt: new Date() }).where(eq(payments.id, payment.id));
    console.error("BTCPay invoice creation failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Lightning payments are temporarily unavailable" }, { status: 503 });
  }
}
