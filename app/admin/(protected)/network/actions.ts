"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { queueAccessGrant } from "@/lib/access";
import { requireAdmin } from "@/lib/auth";
import { addMinutes } from "@/lib/date";
import { db } from "@/lib/db";
import { accessGrants, auditLogs, routerJobs } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/portal-session";

export async function manualGrantAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ macAddress: z.string().trim().min(5).max(64), ipAddress: z.string().trim().max(64).optional(), durationMinutes: z.coerce.number().int().min(5).max(525_600), speedLimitKbps: z.union([z.coerce.number().int().positive(), z.literal("")]).optional() }).parse(Object.fromEntries(formData));
  const session = await createPortalSession({ macAddress: input.macAddress, ipAddress: input.ipAddress || undefined, routerId: "admin-manual" });
  const grant = await queueAccessGrant({ portalSessionId: session.id, durationMinutes: input.durationMinutes, speedLimitKbps: input.speedLimitKbps === "" ? null : input.speedLimitKbps, purpose: "manual" });
  await db.insert(auditLogs).values({ actor: admin.actor, action: "access.manual_grant", entityType: "access_grant", entityId: grant.id, details: { macAddress: input.macAddress, durationMinutes: input.durationMinutes } });
  revalidatePath("/admin/network");
}

export async function extendGrantAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const minutes = z.coerce.number().int().min(5).max(525_600).parse(formData.get("minutes"));
  const [grant] = await db.select().from(accessGrants).where(eq(accessGrants.id, id)).limit(1);
  if (!grant) throw new Error("Access grant not found");
  await db.update(accessGrants).set({ expiresAt: addMinutes(grant.expiresAt > new Date() ? grant.expiresAt : new Date(), minutes), status: "active", updatedAt: new Date() }).where(eq(accessGrants.id, id));
  await db.insert(auditLogs).values({ actor: admin.actor, action: "access.extended", entityType: "access_grant", entityId: id, details: { minutes } });
  revalidatePath("/admin/network");
}

export async function revokeGrantAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const [grant] = await db.update(accessGrants).set({ status: "revoked", updatedAt: new Date() }).where(eq(accessGrants.id, id)).returning();
  if (!grant) throw new Error("Access grant not found");
  await db.insert(routerJobs).values({ type: "revoke_access", payload: { accessGrantId: grant.id, macAddress: grant.macAddress } });
  await db.insert(auditLogs).values({ actor: admin.actor, action: "access.revoked", entityType: "access_grant", entityId: id, details: { macAddress: grant.macAddress } });
  revalidatePath("/admin/network");
}
