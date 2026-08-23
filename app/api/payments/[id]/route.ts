import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [payment] = await db.select({ status: payments.status }).from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
  return Response.json(payment, { headers: { "Cache-Control": "no-store" } });
}

