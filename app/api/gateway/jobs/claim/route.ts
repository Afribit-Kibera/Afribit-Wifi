import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessGrants, routerJobs } from "@/lib/db/schema";
import { isGatewayAuthorized } from "@/lib/gateway-auth";
import { meshAutomaticAccessEnabled } from "@/lib/mesh-access/config";

async function enqueueExpiredGrants() {
  const expired = await db.select().from(accessGrants).where(and(eq(accessGrants.status, "active"), lte(accessGrants.expiresAt, new Date()))).limit(100);
  for (const grant of expired) {
    const [updated] = await db.update(accessGrants).set({ status: "expired", updatedAt: new Date() }).where(and(eq(accessGrants.id, grant.id), eq(accessGrants.status, "active"))).returning({ id: accessGrants.id });
    if (updated) await db.insert(routerJobs).values({ type: "revoke_access", payload: { accessGrantId: grant.id, macAddress: grant.macAddress } });
  }
}

export async function POST(request: Request) {
  if (!isGatewayAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // The older shared queue can create unmetered IP bypasses and has no enrolled
  // router scope. It must never operate alongside the native Mesh controller.
  if (meshAutomaticAccessEnabled()) return Response.json(
    { error: "Legacy gateway is disabled while automatic Mesh access is enabled" },
    { status: 409, headers: { "Cache-Control": "no-store" } },
  );
  await enqueueExpiredGrants();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [candidate] = await db.select().from(routerJobs).where(and(eq(routerJobs.status, "queued"), lte(routerJobs.availableAt, new Date()))).orderBy(asc(routerJobs.createdAt)).limit(1);
    if (!candidate) return new Response(null, { status: 204 });
    const [claimed] = await db.update(routerJobs).set({ status: "claimed", claimedAt: new Date(), attempts: candidate.attempts + 1, updatedAt: new Date() }).where(and(eq(routerJobs.id, candidate.id), eq(routerJobs.status, "queued"))).returning();
    if (claimed) return Response.json({ id: claimed.id, type: claimed.type, payload: claimed.payload, attempt: claimed.attempts });
  }
  return new Response(null, { status: 204 });
}

