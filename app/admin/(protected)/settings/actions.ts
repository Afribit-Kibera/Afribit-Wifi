"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { readPaymentSettings, savePaymentSettings } from "@/lib/settings";
import { saveMeshNotice } from "@/lib/mesh-notice";

const formSchema = z.object({
  bitcoinEnabled: z.literal("on").optional(),
  bitcoinDiscountPercent: z.coerce.number().min(0).max(50).multipleOf(0.5),
});

export async function savePaymentSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = formSchema.parse(Object.fromEntries(formData));
  const before = await readPaymentSettings();
  const after = { bitcoinEnabled: input.bitcoinEnabled === "on", bitcoinDiscountPercent: input.bitcoinDiscountPercent };
  await savePaymentSettings(after, admin.actor);
  await db.insert(auditLogs).values({ actor: admin.actor, action: "settings.payments.updated", entityType: "settings", entityId: "payments", details: { before, after } });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

const noticeSchema = z.object({
  message: z.string().trim().max(240),
  tone: z.enum(["info", "warning"]),
  hours: z.union([z.literal(""), z.coerce.number().min(0.25).max(24 * 30)]),
});

// Shows a message on every Mesh page. An empty message removes it.
export async function saveMeshNoticeAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = noticeSchema.parse(Object.fromEntries(formData));
  const notice = input.message ? { message: input.message, tone: input.tone,
    endsAt: input.hours === "" ? null : new Date(Date.now() + input.hours * 3_600_000).toISOString(), updatedAt: new Date().toISOString() } : null;
  await saveMeshNotice(notice, admin.actor);
  await db.insert(auditLogs).values({ actor: admin.actor, action: notice ? "mesh.notice_set" : "mesh.notice_cleared", entityType: "settings", entityId: "notice", details: notice ?? {} });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
