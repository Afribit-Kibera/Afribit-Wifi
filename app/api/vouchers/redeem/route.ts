import { and, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { queueAccessGrant } from "@/lib/access";
import { db } from "@/lib/db";
import { voucherBatches, vouchers } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/portal-session";
import { normalizeVoucherCode } from "@/lib/voucher-crypto";
import { lookupVoucherRecord } from "@/lib/voucher-lookup";
import { consumeVoucherAttempt } from "@/lib/voucher-rate-limit";
import { meshAutomaticAccessEnabled, meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { getTrustedMeshContext, queueMeshVoucherAccess } from "@/lib/mesh-access/service";
import { readBoundedJson, RequestBodyError } from "@/lib/request-body";

const redeemSchema = z.object({
  code: z.string().min(6).max(64),
  macAddress: z.string().trim().max(64).optional(),
  ipAddress: z.string().trim().max(64).optional(),
  routerId: z.string().trim().max(100).optional(),
  loginUrl: z.string().url().max(1000).optional(),
  originalUrl: z.string().url().max(1000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await readBoundedJson(request, 4096); }
  catch (error) { return Response.json({ error: "Enter a valid voucher code" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Enter a valid voucher code" }, { status: 400 });

  const isMesh = meshAutomaticAccessEnabled();
  if ((isMesh && !meshAutomaticAccessReady()) || (!isMesh && /^\d{6}$/.test(normalizeVoucherCode(parsed.data.code)))) {
    return Response.json({ error: "Voucher access is being prepared. Please try again shortly." }, { status: 503 });
  }
  const context = isMesh ? await getTrustedMeshContext(request) : null;
  if (isMesh && !context) return Response.json({ error: "Reconnect to Mesh to use your voucher" }, { status: 403 });
  const macAddress = context?.macAddress ?? parsed.data.macAddress?.toUpperCase();
  if (!macAddress || !/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(macAddress)) {
    return Response.json({ error: "Reconnect to Wi-Fi to use your voucher" }, { status: 400 });
  }
  const attempt = await consumeVoucherAttempt(macAddress, request.headers);
  if (!attempt.allowed) return Response.json({ error: "Too many attempts. Please try again later." }, {
    status: 429, headers: { "Retry-After": String(attempt.retryAfter) },
  });

  let record;
  try {
    record = await lookupVoucherRecord(normalizeVoucherCode(parsed.data.code), async (hash, issuedBefore) => {
      const [found] = await db.select({ voucher: vouchers, batch: voucherBatches }).from(vouchers)
        .innerJoin(voucherBatches, eq(vouchers.batchId, voucherBatches.id))
        .where(and(eq(vouchers.codeHash, hash), issuedBefore ? lt(vouchers.createdAt, issuedBefore) : undefined)).limit(1);
      return found;
    });
  } catch {
    return Response.json({ error: "Voucher access is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }

  const now = new Date();
  if (!record || record.voucher.disabled) return Response.json({ error: "That voucher is not available. Check the code." }, { status: 404 });
  if (record.batch.validFrom && record.batch.validFrom > now) return Response.json({ error: "This voucher is not active yet" }, { status: 409 });
  if (record.batch.validUntil && record.batch.validUntil < now) return Response.json({ error: "This voucher has expired" }, { status: 409 });

  if (context) {
    // Ignore browser MAC/IP/router/login fields: the enrolled router attested
    // this session before checkout. Queueing consumes the voucher atomically.
    const session = await createPortalSession({ macAddress: context.macAddress,
      ipAddress: context.ipAddress, routerId: context.routerId, loginUrl: context.loginUrl,
      userAgent: request.headers.get("user-agent") });
    try {
      const grant = await queueMeshVoucherAccess({ voucherId: record.voucher.id, portalSessionId: session.id,
        contextId: context.id, durationMinutes: record.batch.accessDurationMinutes,
        dataLimitMb: record.batch.dataLimitMb, speedLimitKbps: record.batch.speedLimitKbps });
      return Response.json({ accessGrantId: grant.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "This voucher cannot be activated. Check the code or reconnect to Mesh." }, { status: 409 });
    }
  }

  const updated = await db
    .update(vouchers)
    .set({ redemptionCount: sql`${vouchers.redemptionCount} + 1`, lastRedeemedAt: now })
    .where(and(eq(vouchers.id, record.voucher.id), lt(vouchers.redemptionCount, record.batch.maxRedemptions)))
    .returning({ id: vouchers.id });
  if (updated.length === 0) return Response.json({ error: "This voucher has already been used" }, { status: 409 });

  const session = await createPortalSession({ ...parsed.data, macAddress, userAgent: request.headers.get("user-agent") });
  const grant = await queueAccessGrant({
    portalSessionId: session.id,
    voucherId: record.voucher.id,
    durationMinutes: record.batch.accessDurationMinutes,
    dataLimitMb: record.batch.dataLimitMb,
    speedLimitKbps: record.batch.speedLimitKbps,
    purpose: "voucher",
  });
  return Response.json({ accessGrantId: grant.id }, { status: 201 });
}
