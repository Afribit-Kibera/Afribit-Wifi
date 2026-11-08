"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { readPaymentSettings, savePaymentSettings } from "@/lib/settings";

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
