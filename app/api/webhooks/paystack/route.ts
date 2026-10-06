import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { reconcilePaystackCollection } from "@/lib/payments/reconcile-paystack";
import { readBoundedText, RequestBodyError } from "@/lib/request-body";

export const runtime = "nodejs";
// Optional future engine forwarding receiver. Publishing it does not change
// the account's existing engine.insats.org webhook or prove forwarding exists.
export async function POST(request: Request) {
  let rawBody: string;
  try { rawBody = await readBoundedText(request, 64_000); }
  catch (error) { return Response.json({ error: "Invalid event body" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"), process.env.PAYSTACK_SECRET_KEY)) return Response.json({ error: "Invalid signature" }, { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid event" }, { status: 400 }); }
  const envelope = z.object({ event: z.string(), data: z.unknown().optional() }).safeParse(payload);
  if (!envelope.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  if (envelope.data.event !== "charge.success") return Response.json({ received: true, ignored: true });
  const parsed = z.object({ reference: z.string().regex(/^mesh-[0-9a-f-]{36}$/i) }).safeParse(envelope.data.data);
  if (!parsed.success) return Response.json({ received: true, ignored: true });
  const [payment] = await db.select().from(payments).where(and(eq(payments.provider, "paystack"), eq(payments.providerInvoiceId, parsed.data.reference))).limit(1);
  if (!payment) return Response.json({ received: true });
  try {
    // A signed notification is not enough. Authenticated provider lookup must
    // match the stored reference, tag, amount, channel and environment.
    await reconcilePaystackCollection(payment, true);
  } catch {
    console.error("Paystack collection verification failed");
    return Response.json({ error: "Verification unavailable; retry delivery" }, { status: 503 });
  }
  return Response.json({ received: true });
}
