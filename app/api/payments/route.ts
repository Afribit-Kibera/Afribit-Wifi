import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { getPaymentProvider } from "@/lib/payments/providers";
import { normalizeKenyanPhone, readBitikaConfig } from "@/lib/payments/bitika";
import { paymentProviderIds, PaymentProviderError } from "@/lib/payments/types";
import { db } from "@/lib/db";
import { packages, payments } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/portal-session";
import { queuePaymentBootstrap } from "@/lib/access";
import { meshAutomaticAccessEnabled, meshAutomaticAccessReady, readMeshAccessConfig } from "@/lib/mesh-access/config";
import { encryptAccess } from "@/lib/mesh-access/security";
import { getTrustedMeshContext, assertMeshCheckoutReady, assertMeshDeviceCheckoutReady } from "@/lib/mesh-access/service";
import { validateAccessPackage } from "@/lib/mesh-access/model";
import { readBoundedJson, RequestBodyError } from "@/lib/request-body";
import { consumeCheckoutAttempt } from "@/lib/payments/checkout-rate-limit";
import { reserveMeshCheckout } from "@/lib/mesh-access/checkout-reservation";

const paymentSchema = z.object({
  packageId: z.string().uuid(),
  macAddress: z.string().trim().min(1).max(64).default("unknown"),
  ipAddress: z.string().trim().max(64).optional(),
  routerId: z.string().trim().max(100).optional(),
  loginUrl: z.string().url().max(1000).optional(),
  originalUrl: z.string().url().max(1000).optional(),
  provider: z.enum(paymentProviderIds).default("btcpay"),
  requestId: z.string().uuid().optional(),
  phone: z.string().max(32).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await readBoundedJson(request, 8192); }
  catch (error) { return Response.json({ error: "Invalid payment request" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid package or network session" }, { status: 400 });

  const input = parsed.data;
  const automaticAccess = meshAutomaticAccessEnabled();
  const context = automaticAccess ? await getTrustedMeshContext(request) : null;
  if (automaticAccess && !meshAutomaticAccessReady()) return Response.json({ error: "Internet checkout is temporarily unavailable" }, { status: 503 });
  if (automaticAccess && !context) return Response.json({ error: "Reopen the Mesh Wi-Fi welcome page before buying a pass" }, { status: 401 });
  if (context) {
    // The enrolled router attests the actual host. Browser query parameters
    // cannot choose another device or a management address for paid access.
    input.macAddress = context.macAddress;
    input.ipAddress = context.ipAddress;
    input.routerId = context.routerId;
    input.loginUrl = context.loginUrl;
    input.originalUrl = undefined;
  } else if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(input.macAddress)) {
    return Response.json({ error: "Join Mesh Wi-Fi before buying an internet pass" }, { status: 400 });
  }
  let provider;
  let phone: string | undefined;
  try {
    provider = getPaymentProvider(input.provider);
    if (input.provider !== "btcpay") {
      if (!input.routerId || !input.ipAddress || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(input.macAddress)) throw new PaymentProviderError("Join Mesh Wi-Fi before buying an internet pass", 400);
      phone = normalizeKenyanPhone(input.phone ?? "");
    }
  } catch (error) {
    return Response.json({ error: error instanceof PaymentProviderError ? error.message : "Payment method unavailable" }, { status: error instanceof PaymentProviderError ? error.httpStatus : 503 });
  }

  const [wifiPackage] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, parsed.data.packageId))
    .limit(1);
  if (!wifiPackage || !wifiPackage.active) return Response.json({ error: "This package is unavailable" }, { status: 404 });
  let access = { durationMinutes: wifiPackage.durationMinutes, dataLimitMb: wifiPackage.dataLimitMb, speedLimitKbps: wifiPackage.speedLimitKbps };
  if (automaticAccess) {
    try { access = validateAccessPackage(access); }
    catch { return Response.json({ error: "This pass is not available on this Mesh network" }, { status: 409 }); }
  }

  const paymentId = input.requestId ?? randomUUID();
  const fingerprint = createHash("sha256").update(JSON.stringify([input.provider, input.packageId, input.macAddress.toUpperCase(), input.ipAddress ?? "", input.routerId ?? "", input.loginUrl ?? "", input.originalUrl ?? "", phone ?? ""])).digest("hex");
  const [previous] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (previous && previous.metadata.requestFingerprint !== fingerprint) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });
  if (context && previous && previous.metadata.meshContextId !== context.id) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });
  const resumeUnstarted = Boolean(context && previous && ["new", "processing"].includes(previous.status) &&
    (input.provider === "paystack" ? !previous.metadata.paystackChargeStartedAt :
      input.provider === "bitika" && !previous.providerInvoiceId && !previous.metadata.bitikaChargeStartedAt));
  if (previous?.checkoutUrl && !resumeUnstarted) return Response.json({ paymentId: previous.id, checkoutUrl: previous.checkoutUrl }, { status: 200 });
  if (previous && ["invalid", "expired", "refunded", "settled"].includes(previous.status)) return Response.json({ error: "This payment has ended. Check its result before creating another." }, { status: 409 });
  if (context && input.provider !== "btcpay" && (!previous || resumeUnstarted)) {
    try {
      if (!previous) {
        const attempt = await consumeCheckoutAttempt({ routerId: context.routerId, macAddress: context.macAddress, phone: phone! });
        if (!attempt.allowed) return Response.json({ error: "Too many payment attempts. Wait before requesting another M-Pesa prompt." },
          { status: 429, headers: { "Retry-After": String(attempt.retryAfter), "Cache-Control": "no-store" } });
      }
      if (input.provider === "bitika") await assertMeshDeviceCheckoutReady(context);
      else await assertMeshCheckoutReady(wifiPackage.priceKes, context);
    }
    catch (error) { return Response.json({ error: error instanceof PaymentProviderError ? error.message : "Internet checkout is temporarily unavailable. No payment was requested." }, { status: error instanceof PaymentProviderError ? error.httpStatus : 503 }); }
  }

  const session = previous ? null : await createPortalSession({ ...input, userAgent: request.headers.get("user-agent") });
  const bitika = input.provider === "bitika" ? readBitikaConfig() : null;
  const [inserted] = previous ? [] : await db
    .insert(payments)
    .values({
      id: paymentId,
      provider: input.provider,
      portalSessionId: session!.id,
      packageId: wifiPackage.id,
      amountSats: wifiPackage.priceSats,
      ...(input.provider === "paystack" ? { providerInvoiceId: `mesh-${paymentId}`, checkoutUrl: `/pay/${paymentId}` } : {}),
      metadata: { packageName: wifiPackage.name, priceKes: wifiPackage.priceKes, requestFingerprint: fingerprint,
        access, collectionGuardVersion: 1, ...(context ? { meshContextId: context.id } : {}),
        ...(input.provider === "paystack" ? { paystack: { mode: "live", amountKes: wifiPackage.priceKes, paymentId, status: "processing", collectionConfirmed: false } } : {}),
        ...(bitika ? { bitika: { mode: bitika.mode, amountKes: wifiPackage.priceKes, lightningAddress: bitika.lightningAddress, status: "processing" } } : {}) },
    })
    .onConflictDoNothing({ target: payments.id })
    .returning();
  const payment = previous ?? inserted ?? (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (!payment || payment.metadata.requestFingerprint !== fingerprint || (context && payment.metadata.meshContextId !== context.id)) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });

  try {
    if (context && input.provider !== "btcpay" && !await reserveMeshCheckout({ paymentId: payment.id,
      contextId: context.id, routerId: context.routerId, macAddress: context.macAddress })) {
      // This reference never reached the provider. Close only the unstarted
      // local attempt; do not cancel or overwrite the existing real payment.
      await db.update(payments).set({ status: "invalid", updatedAt: new Date(),
        metadata: sql`${payments.metadata} || '{"checkoutConflict":true}'::jsonb` })
        .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"]),
          sql`NOT (${payments.metadata} ? 'paystackChargeStartedAt') AND NOT (${payments.metadata} ? 'bitikaChargeStartedAt')`));
      return Response.json({ error: "Your earlier payment is still being checked. Return to that payment page; do not pay again." },
        { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    if (input.provider === "paystack") {
      // Durable send reservation before the external effect. A duplicate or
      // ambiguous response must query this reference, never issue another prompt.
      const [reserved] = await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('paystackChargeStartedAt', ${Date.now()}::bigint)` })
        .where(and(eq(payments.id, payment.id), sql`NOT (${payments.metadata} ? 'paystackChargeStartedAt')`)).returning({ id: payments.id });
      if (!reserved) return Response.json({ paymentId: payment.id, checkoutUrl: `/pay/${payment.id}` }, { status: 200 });
    }
    if (input.provider === "bitika") {
      // Retain uncertainty across provider choices. Customer retries retain
      // this UUID and Bitika's documented Idempotency-Key; never fail over an
      // initiated request to another collection provider automatically.
      // Retain the exact original request encrypted, so background recovery
      // can retrieve its acknowledgement using the SAME idempotency key.
      // The phone never enters plaintext metadata or controller jobs.
      const recovery = context ? encryptAccess({ paymentId: payment.id, amountKes: Number(payment.metadata.priceKes),
        phone, lightningAddress: bitika!.lightningAddress }, readMeshAccessConfig()) : null;
      await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('bitikaChargeStartedAt', ${Date.now()}::bigint)
        || ${JSON.stringify(recovery ? { bitikaCollectionRequest: recovery } : {})}::jsonb` })
        .where(and(eq(payments.id, payment.id), sql`NOT (${payments.metadata} ? 'bitikaChargeStartedAt')`));
    }
    const invoice = await provider.createCheckout({ paymentId: payment.id, amountSats: payment.amountSats, amountKes: Number(payment.metadata.priceKes), packageName: String(payment.metadata.packageName), phone });
    await db
      .update(payments)
      .set({ providerInvoiceId: invoice.id, checkoutUrl: invoice.checkoutUrl, metadata: sql`${payments.metadata} || ${JSON.stringify(invoice.metadata)}::jsonb`, updatedAt: new Date() })
      .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
    try {
      // Bitika collection is server-to-server. It never opens a general-internet
      // bootstrap allowance for an unpaid customer.
      if (!automaticAccess && input.provider === "btcpay" && payment.portalSessionId && !previous) await queuePaymentBootstrap(payment.portalSessionId);
    } catch (bootstrapError) {
      console.error("Payment bootstrap grant failed", bootstrapError instanceof Error ? bootstrapError.message : "Unknown error");
    }
    return Response.json({ paymentId: payment.id, checkoutUrl: invoice.checkoutUrl }, { status: 201 });
  } catch (error) {
    // A timeout is an ambiguous collection outcome; retain the same reference
    // so a safe retry uses Bitika's Idempotency-Key rather than another charge.
    if (input.provider === "btcpay") await db.update(payments).set({ status: "invalid", updatedAt: new Date() }).where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
    console.error(`${input.provider} checkout creation failed`);
    if (input.provider !== "btcpay") {
      // A collection may already have sent its prompt. Keep the customer on
      // this owned receipt; exposing adapter errors invites a second purchase.
      await db.update(payments).set({ status: "processing", updatedAt: new Date(),
        metadata: sql`${payments.metadata} || '{"checkoutInitiationUnconfirmed":true}'::jsonb` })
        .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
      return Response.json({ paymentId: payment.id, checkoutUrl: `/pay/${payment.id}`, paymentPending: true },
        { status: 202, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ paymentId: payment.id, error: error instanceof PaymentProviderError ? error.message : input.provider !== "btcpay" ? "M-Pesa payments are temporarily unavailable" : "Lightning payments are temporarily unavailable" }, { status: error instanceof PaymentProviderError ? error.httpStatus : 503 });
  }
}
