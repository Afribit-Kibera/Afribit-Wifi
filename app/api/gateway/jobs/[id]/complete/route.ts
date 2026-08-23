import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { accessGrants, routerJobs } from "@/lib/db/schema";
import { isGatewayAuthorized } from "@/lib/gateway-auth";

const resultSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), result: z.record(z.string(), z.unknown()).optional() }),
  z.object({ success: z.literal(false), error: z.string().min(1).max(2000) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isGatewayAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = resultSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid job result" }, { status: 400 });
  const [job] = await db.select().from(routerJobs).where(eq(routerJobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  const grantId = typeof job.payload.accessGrantId === "string" ? job.payload.accessGrantId : null;

  if (parsed.data.success) {
    await db.update(routerJobs).set({ status: "completed", completedAt: new Date(), updatedAt: new Date(), lastError: null }).where(eq(routerJobs.id, id));
    if (grantId && job.type === "grant_access") await db.update(accessGrants).set({ status: "active", updatedAt: new Date() }).where(eq(accessGrants.id, grantId));
    if (grantId && job.type === "revoke_access") await db.update(accessGrants).set({ status: "expired", updatedAt: new Date() }).where(eq(accessGrants.id, grantId));
  } else {
    const exhausted = job.attempts >= job.maxAttempts;
    const delayMinutes = Math.min(30, 2 ** Math.max(0, job.attempts - 1));
    await db.update(routerJobs).set({ status: exhausted ? "failed" : "queued", lastError: parsed.data.error, availableAt: new Date(Date.now() + delayMinutes * 60_000), updatedAt: new Date() }).where(eq(routerJobs.id, id));
    if (grantId && exhausted && job.type === "grant_access") await db.update(accessGrants).set({ status: "failed", updatedAt: new Date() }).where(eq(accessGrants.id, grantId));
  }
  return Response.json({ accepted: true });
}

