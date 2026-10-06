import { and, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { readAgentBody, privateHeaders } from "@/lib/mesh-access/agent-api";
import { claimMeshOrders, recordMeshAgentHeartbeat } from "@/lib/mesh-access/service";
import { readMeshAccessConfig } from "@/lib/mesh-access/config";
import { reconcilePaystackCollection } from "@/lib/payments/reconcile-paystack";
import { bitikaMissingReferenceRecoveryCandidate, reconcileBitikaPayment } from "@/lib/payments/reconcile-bitika";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  try { await readAgentBody(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 403, headers: privateHeaders }); }
  const config = readMeshAccessConfig();
  await recordMeshAgentHeartbeat();
  // Router polling, independent of the buyer keeping a browser open. A collection
  // retry keeps its reference; the Engine owns idempotent invoice/send state.
  const pending = await db.select().from(payments).where(and(inArray(payments.provider, ["bitika", "paystack"]), inArray(payments.status, ["new", "processing"]),
    sql`(${payments.providerInvoiceId} IS NOT NULL OR ${bitikaMissingReferenceRecoveryCandidate()})`,
    sql`EXISTS(SELECT 1 FROM mesh_access_contexts c WHERE c.id::text = ${payments.metadata}->>'meshContextId' AND c.router_id=${config.routerId} AND c.joined_at IS NOT NULL)`))
    .orderBy(sql`COALESCE((${payments.metadata}->>(${payments.provider} || 'LastCheckedAt'))::bigint,0) ASC`, payments.createdAt).limit(1);
  for (const payment of pending) {
    try {
      if (payment.provider === "bitika") await reconcileBitikaPayment(payment);
      else await reconcilePaystackCollection(payment);
    } catch { /* Preserve the reference and retry; never grant on uncertainty. */ }
  }
  return Response.json({ jobs: await claimMeshOrders() }, { headers: privateHeaders });
}
