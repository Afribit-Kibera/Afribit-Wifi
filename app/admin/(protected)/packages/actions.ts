"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, packages } from "@/lib/db/schema";

const packageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  priceSats: z.coerce.number().int().min(1),
  durationMinutes: z.coerce.number().int().min(5),
  dataLimitMb: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  speedLimitKbps: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

export async function createPackageAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = packageSchema.parse(Object.fromEntries(formData));
  const [created] = await db.insert(packages).values({
    ...input,
    dataLimitMb: input.dataLimitMb === "" ? null : input.dataLimitMb,
    speedLimitKbps: input.speedLimitKbps === "" ? null : input.speedLimitKbps,
  }).returning();
  await db.insert(auditLogs).values({ actor: admin.actor, action: "package.created", entityType: "package", entityId: created.id, details: { name: created.name } });
  revalidatePath("/admin/packages");
  revalidatePath("/");
}

export async function togglePackageAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await db.update(packages).set({ active: !active, updatedAt: new Date() }).where(eq(packages.id, id));
  await db.insert(auditLogs).values({ actor: admin.actor, action: "package.toggled", entityType: "package", entityId: id, details: { active: !active } });
  revalidatePath("/admin/packages");
  revalidatePath("/");
}
