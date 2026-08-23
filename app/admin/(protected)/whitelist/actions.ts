"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, routerJobs, whitelistedSites } from "@/lib/db/schema";
import { normalizeHostname } from "@/lib/utils";

async function queueSync() {
  const sites = await db.select({ hostname: whitelistedSites.hostname, includeSubdomains: whitelistedSites.includeSubdomains }).from(whitelistedSites).where(eq(whitelistedSites.enabled, true));
  await db.insert(routerJobs).values({ type: "sync_walled_garden", payload: { sites } });
}

export async function addWhitelistSiteAction(formData: FormData) {
  const admin = await requireAdmin();
  const hostname = normalizeHostname(z.string().min(3).max(255).parse(formData.get("hostname")));
  const category = z.string().min(2).max(50).parse(formData.get("category"));
  const notes = z.string().max(240).optional().parse(String(formData.get("notes") ?? ""));
  const includeSubdomains = formData.get("includeSubdomains") === "on";
  const [site] = await db.insert(whitelistedSites).values({ hostname, category, notes, includeSubdomains, createdBy: admin.actor }).onConflictDoUpdate({ target: whitelistedSites.hostname, set: { enabled: true, category, notes, includeSubdomains, updatedAt: new Date() } }).returning();
  await queueSync();
  await db.insert(auditLogs).values({ actor: admin.actor, action: "whitelist.saved", entityType: "whitelisted_site", entityId: site.id, details: { hostname } });
  revalidatePath("/admin/whitelist");
}

export async function toggleWhitelistSiteAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const enabled = formData.get("enabled") === "true";
  const [site] = await db.update(whitelistedSites).set({ enabled: !enabled, updatedAt: new Date() }).where(eq(whitelistedSites.id, id)).returning();
  await queueSync();
  await db.insert(auditLogs).values({ actor: admin.actor, action: "whitelist.toggled", entityType: "whitelisted_site", entityId: id, details: { hostname: site.hostname, enabled: !enabled } });
  revalidatePath("/admin/whitelist");
}
