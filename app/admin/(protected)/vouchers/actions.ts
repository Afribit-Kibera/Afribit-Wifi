"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, voucherBatches, vouchers } from "@/lib/db/schema";
import { encryptVoucherCode, generateVoucherCode, hashVoucherCode } from "@/lib/voucher-crypto";

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
  prefix: z.string().trim().regex(/^[A-Za-z0-9]{1,6}$/),
});

export async function createVoucherBatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = batchSchema.parse(Object.fromEntries(formData));
  const validFrom = input.validFrom ? new Date(input.validFrom) : null;
  const validUntil = input.validUntil ? new Date(input.validUntil) : null;
  if (validFrom && validUntil && validUntil <= validFrom) throw new Error("Valid until must be later than valid from");

  const [batch] = await db.insert(voucherBatches).values({
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
    prefix: input.prefix.toUpperCase(),
    createdBy: admin.email,
  }).returning();

  const records = Array.from({ length: input.quantity }, () => {
    const code = generateVoucherCode(input.prefix);
    return { batchId: batch.id, codeHash: hashVoucherCode(code), codeCiphertext: encryptVoucherCode(code), codeLastFour: code.slice(-4) };
  });
  for (let offset = 0; offset < records.length; offset += 200) await db.insert(vouchers).values(records.slice(offset, offset + 200));
  await db.insert(auditLogs).values({ actor: admin.email, action: "voucher_batch.created", entityType: "voucher_batch", entityId: batch.id, details: { quantity: input.quantity, durationMinutes: input.accessDurationMinutes, saleAmountSats: input.saleAmountSats } });
  revalidatePath("/admin/vouchers");
  redirect(`/admin/vouchers/${batch.id}`);
}

