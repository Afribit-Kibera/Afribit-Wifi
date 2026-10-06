import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { bitikaTransactionCodeSchema, verifyBitikaSignature } from "@/lib/payments/bitika";
import { reconcileBitikaPayment } from "@/lib/payments/reconcile-bitika";
import { readBoundedText, RequestBodyError } from "@/lib/request-body";

export const runtime = "nodejs";
const eventSchema = z.object({
  id: z.string().min(1).max(200),
  event: z.enum(["transaction.updated", "payment.completed", "payment.failed"]),
  data: z.object({ transaction_code: bitikaTransactionCodeSchema }),
});

export async function POST(request: Request) {
  let rawBody: string;
  try { rawBody = await readBoundedText(request, 64_000); }
  catch (error) { return Response.json({ error: "Invalid event body" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  if (!verifyBitikaSignature(rawBody, request.headers.get("x-bitika-signature"), process.env.BITIKA_WEBHOOK_SECRET)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid event" }, { status: 400 }); }
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  // Record verification without logging the callback body, payer or secret.
  // This does not claim settlement; matching and reconciliation happen below.
  console.info("Bitika webhook signature verified", {
    eventId: parsed.data.id,
    event: parsed.data.event,
    transactionCode: parsed.data.data.transaction_code,
  });
  // Sandbox delivery is acknowledged without touching live sales or access.
  if (parsed.data.data.transaction_code.startsWith("SBX-")) return Response.json({ received: true, sandbox: true });
  const [payment] = await db.select().from(payments).where(and(eq(payments.provider, "bitika"), eq(payments.providerInvoiceId, parsed.data.data.transaction_code))).limit(1);
  if (!payment) return Response.json({ received: true });
  try {
    // Signed event is a notification, never sufficient proof: read the current
    // provider transaction and match its amount, destination and delivery hash.
    await reconcileBitikaPayment(payment, true);
  } catch {
    console.error("Bitika settlement reconciliation failed");
    return Response.json({ error: "Reconciliation unavailable; retry delivery" }, { status: 503 });
  }
  return Response.json({ received: true });
}
