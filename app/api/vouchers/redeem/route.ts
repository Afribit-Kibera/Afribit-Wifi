import { and, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { queueAccessGrant } from "@/lib/access";
import { db } from "@/lib/db";
import { voucherBatches, vouchers } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/portal-session";
import { hashVoucherCode, normalizeVoucherCode } from "@/lib/voucher-crypto";

const redeemSchema = z.object({
  code: z.string().min(8).max(64),
  macAddress: z.string().trim().min(1).max(64),
  ipAddress: z.string().trim().max(64).optional(),
  routerId: z.string().trim().max(100).optional(),
  loginUrl: z.string().url().max(1000).optional(),
  originalUrl: z.string().url().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = redeemSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Enter a valid voucher code" }, { status: 400 });

  const codeHash = hashVoucherCode(normalizeVoucherCode(parsed.data.code));
  const [record] = await db
    .select({ voucher: vouchers, batch: voucherBatches })
    .from(vouchers)
    .innerJoin(voucherBatches, eq(vouchers.batchId, voucherBatches.id))
    .where(eq(vouchers.codeHash, codeHash))
    .limit(1);

  const now = new Date();
  if (!record || record.voucher.disabled) return Response.json({ error: "Voucher not found or disabled" }, { status: 404 });
  if (record.batch.validFrom && record.batch.validFrom > now) return Response.json({ error: "This voucher is not active yet" }, { status: 409 });
  if (record.batch.validUntil && record.batch.validUntil < now) return Response.json({ error: "This voucher has expired" }, { status: 409 });

  const updated = await db
    .update(vouchers)
    .set({ redemptionCount: record.voucher.redemptionCount + 1, lastRedeemedAt: now })
    .where(and(eq(vouchers.id, record.voucher.id), lt(vouchers.redemptionCount, record.batch.maxRedemptions)))
    .returning({ id: vouchers.id });
  if (updated.length === 0) return Response.json({ error: "This voucher has already been used" }, { status: 409 });

  const requestHeaders = await headers();
  const session = await createPortalSession({ ...parsed.data, userAgent: requestHeaders.get("user-agent") });
  const grant = await queueAccessGrant({
    portalSessionId: session.id,
    voucherId: record.voucher.id,
    durationMinutes: record.batch.accessDurationMinutes,
    dataLimitMb: record.batch.dataLimitMb,
    speedLimitKbps: record.batch.speedLimitKbps,
  });
  return Response.json({ accessGrantId: grant.id }, { status: 201 });
}

