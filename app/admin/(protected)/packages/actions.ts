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
  priceKes: z.coerce.number().int().min(0),
  priceSats: z.coerce.number().int().min(1),
  durationMinutes: z.coerce.number().int().min(5),
  dataLimitMb: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  // Typed in Mbps, stored in Kbps. Blank means the router default of 2 Mbps.
  speedMbps: z.union([z.coerce.number().min(0.5).max(100), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  kind: z.enum(["personal", "household", "tv"]).default("personal"),
  deviceLimit: z.coerce.number().int().min(1).max(10).default(1),
});

function packageValues(formData: FormData) {
  const { speedMbps, ...input } = packageSchema.parse(Object.fromEntries(formData));
  return {
    ...input,
    description: input.description || null,
    dataLimitMb: input.dataLimitMb === "" || input.dataLimitMb === undefined ? null : input.dataLimitMb,
    speedLimitKbps: speedMbps === "" || speedMbps === undefined ? null : Math.round(speedMbps * 1000),
    // A household pass shares one deadline across several devices; personal and TV passes cover one.
    deviceLimit: input.kind === "household" ? Math.max(2, input.deviceLimit) : 1,
  };
}

export async function createPackageAction(formData: FormData) {
  const admin = await requireAdmin();
  const [created] = await db.insert(packages).values(packageValues(formData)).returning();
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

// Changes apply to passes bought from now on. Live passes keep the speed and
// time they were sold with.
export async function updatePackageAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const values = packageValues(formData);
  const [before] = await db.select().from(packages).where(eq(packages.id, id));
  if (!before) throw new Error("Package not found");
  await db.update(packages).set({ ...values, updatedAt: new Date() }).where(eq(packages.id, id));
  await db.insert(auditLogs).values({ actor: admin.actor, action: "package.updated", entityType: "package", entityId: id,
    details: { name: values.name, priceKes: [before.priceKes, values.priceKes], durationMinutes: [before.durationMinutes, values.durationMinutes], speedLimitKbps: [before.speedLimitKbps, values.speedLimitKbps] } });
  revalidatePath("/admin/packages");
  revalidatePath("/");
}
