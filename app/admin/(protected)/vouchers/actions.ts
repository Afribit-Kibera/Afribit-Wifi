"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, voucherBatches, vouchers } from "@/lib/db/schema";
import { issueVoucherBatch } from "@/lib/voucher-issuance";

const batchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  packageId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(1000),
  saleAmountSats: z.coerce.number().int().min(0).max(100_000_000),
  accessDurationMinutes: z.coerce.number().int().min(5).max(525_600),
  dataLimitMb: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  speedLimitKbps: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  maxRedemptions: z.coerce.number().int().min(1).max(100),
});

export async function createVoucherBatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = batchSchema.parse(Object.fromEntries(formData));
  const validFrom = input.validFrom ? new Date(input.validFrom) : null;
  const validUntil = input.validUntil ? new Date(input.validUntil) : null;
  if (validFrom && validUntil && validUntil <= validFrom) throw new Error("Valid until must be later than valid from");

  const batchId = randomUUID();
  await issueVoucherBatch(batchId, input.quantity, async records => db.batch([
    db.insert(voucherBatches).values({
    id: batchId,
    name: input.name,
    packageId: input.packageId || null,
    quantity: input.quantity,
    saleAmountSats: input.saleAmountSats,
    accessDurationMinutes: input.accessDurationMinutes,
    dataLimitMb: input.dataLimitMb === "" ? null : input.dataLimitMb,
    speedLimitKbps: input.speedLimitKbps === "" ? null : input.speedLimitKbps,
    validFrom,
    validUntil,
    maxRedemptions: input.maxRedemptions,
    prefix: "",
    createdBy: admin.actor,
  }),
    db.insert(vouchers).values(records),
    db.insert(auditLogs).values({ actor: admin.actor, action: "voucher_batch.created", entityType: "voucher_batch", entityId: batchId, details: { quantity: input.quantity, durationMinutes: input.accessDurationMinutes, saleAmountSats: input.saleAmountSats, codeFormat: "six-digit" } }),
  ]), async hashes => (await db.select({ hash: vouchers.codeHash }).from(vouchers)
    .where(inArray(vouchers.codeHash, hashes))).map(record => record.hash));
  revalidatePath("/admin/vouchers");
  redirect(`/admin/vouchers/${batchId}`);
}
