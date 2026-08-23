"use server";

import { randomBytes } from "node:crypto";
import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEnrollmentCodes, adminPasskeys, auditLogs } from "@/lib/db/schema";
import { hashEnrollmentCode } from "@/lib/webauthn";

export async function generateDevicePairingCodeAction(_previous: { code: string; expiresAt: string }) {
  void _previous;
  const admin = await requireAdmin();
  const token = randomBytes(6).toString("hex").toUpperCase();
  const code = `BV-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(adminEnrollmentCodes).values({ codeHash: hashEnrollmentCode(code), createdBy: admin.actor, expiresAt });
  await db.insert(auditLogs).values({ actor: admin.actor, action: "admin_enrollment_code.created", entityType: "admin_enrollment_code", details: { expiresAt: expiresAt.toISOString() } });
  return { code, expiresAt: expiresAt.toISOString() };
}

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
