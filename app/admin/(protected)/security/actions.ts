"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys, auditLogs } from "@/lib/db/schema";

export async function revokePasskeyAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  if (id === admin.passkeyId) throw new Error("Sign in from another approved device before revoking this one");
  const [active] = await db.select({ value: count() }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  if (active.value <= 1) throw new Error("At least one approved admin device is required");
  const [passkey] = await db.update(adminPasskeys).set({ revokedAt: new Date() }).where(and(eq(adminPasskeys.id, id), isNull(adminPasskeys.revokedAt))).returning();
  if (passkey) await db.insert(auditLogs).values({ actor: admin.actor, action: "admin_passkey.revoked", entityType: "admin_passkey", entityId: id, details: { deviceName: passkey.deviceName } });
  revalidatePath("/admin/security");
}
