import { z } from "zod";
import { internetUpForCheckout } from "@/lib/mesh-access/uplink";
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
import { deviceKeyHash, packageDeviceRules, PassError, readDeviceKey, resolveDeviceCode } from "@/lib/mesh-access/passes";
import { bitcoinPriceKes, readPaymentSettings } from "@/lib/settings";
import { earlierPurchase, refreshEarlierPurchases } from "@/lib/payments/earlier-purchase";

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
  // Pay for another device on this Mesh network (a TV, a child's phone) by the code it shows.
  forDeviceCode: z.string().trim().max(16).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await readBoundedJson(request, 8192); }
  catch (error) { return Response.json({ error: "Invalid payment request" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid package or network session" }, { status: 400 });

  const input = parsed.data;
  const automaticAccess = meshAutomaticAccessEnabled();
  const payer = automaticAccess ? await getTrustedMeshContext(request) : null;
  if (automaticAccess && !meshAutomaticAccessReady()) return Response.json({ error: "Internet checkout is temporarily unavailable" }, { status: 503 });
  // Payments need the internet. With the line down, refuse before asking any provider.
  if (!await internetUpForCheckout()) return Response.json({ error: "The internet line is down, so passes can't be bought right now. Your codes still work. Try again when the line is back." }, { status: 503 });
  if (automaticAccess && !payer) return Response.json({ error: "Reopen the Mesh Wi-Fi welcome page before buying a pass" }, { status: 401 });
  // The device that receives internet. It is still router-attested: the code
  // was created by that device's own Mesh session, never typed as a MAC.
  let context = payer;
  if (payer && input.forDeviceCode) {
    try {
      const target = await resolveDeviceCode(input.forDeviceCode);
      if (target.macAddress === payer.macAddress) return Response.json({ error: "That code is for this phone. Buy a pass normally instead." }, { status: 400 });
      context = { ...target, loginUrl: payer.loginUrl };
    } catch (error) {
      return Response.json({ error: error instanceof PassError ? error.message : "That device code could not be checked" }, { status: error instanceof PassError ? error.status : 503 });
    }
  }
  const payerKey = readDeviceKey(request);
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
      if ((input.provider === "lightning" && !context) || !input.routerId || !input.ipAddress || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(input.macAddress)) throw new PaymentProviderError("Join Mesh Wi-Fi before buying an internet pass", 400);
      if (input.provider !== "lightning") phone = normalizeKenyanPhone(input.phone ?? "");
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
  // Bitcoin buyers pay the KES price less the admin-set discount, in sats at the live rate.
  const settings = input.provider === "lightning" ? await readPaymentSettings() : null;
  if (settings && !settings.bitcoinEnabled) return Response.json({ error: "Bitcoin payments are switched off just now. Choose M-Pesa or use a voucher." }, { status: 503 });
  const bitcoinPrice = settings && wifiPackage.priceKes > 0 ? { ...bitcoinPriceKes(wifiPackage.priceKes, settings.bitcoinDiscountPercent), discountPercent: settings.bitcoinDiscountPercent, priceKes: wifiPackage.priceKes } : null;
  if (settings && !bitcoinPrice) return Response.json({ error: "This pass cannot be paid with Bitcoin" }, { status: 409 });
  let access = { durationMinutes: wifiPackage.durationMinutes, dataLimitMb: wifiPackage.dataLimitMb, speedLimitKbps: wifiPackage.speedLimitKbps };
  if (automaticAccess) {
    try { access = validateAccessPackage(access); }
    catch { return Response.json({ error: "This pass is not available on this Mesh network" }, { status: 409 }); }
  }

  const paymentId = input.requestId ?? randomUUID();
  const fingerprint = createHash("sha256").update(JSON.stringify([input.provider, input.packageId, input.macAddress.toUpperCase(), input.ipAddress ?? "", input.routerId ?? "", input.loginUrl ?? "", input.originalUrl ?? "", phone ?? "", payer?.id ?? ""])).digest("hex");
  const passRules = packageDeviceRules(wifiPackage.kind, wifiPackage.deviceLimit);
  const [previous] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (previous && previous.metadata.requestFingerprint !== fingerprint) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });
  if (context && previous && previous.metadata.meshContextId !== context.id) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });
  const resumeUnstarted = Boolean(context && previous && ["new", "processing"].includes(previous.status) &&
    (input.provider === "paystack" ? !previous.metadata.paystackChargeStartedAt :
      input.provider === "bitika" && !previous.providerInvoiceId && !previous.metadata.bitikaChargeStartedAt));
  if (previous?.checkoutUrl && !resumeUnstarted) return Response.json({ paymentId: previous.id, checkoutUrl: previous.checkoutUrl }, { status: 200 });
  // A closed reference is never reused. The phone drops it and starts a fresh one.
  if (previous && ["invalid", "expired", "refunded", "settled"].includes(previous.status)) return Response.json({ error: "That payment was closed. Tap Pay again to start a new one.", code: "reference_closed" }, { status: 409 });
  if (context && input.provider !== "btcpay" && (!previous || resumeUnstarted)) {
    try {
      if (!previous) {
        const attempt = await consumeCheckoutAttempt({ routerId: payer!.routerId, macAddress: payer!.macAddress, phone });
        if (!attempt.allowed) return Response.json({ error: input.provider === "lightning" ? "Too many payment attempts. Wait a few minutes before creating another Bitcoin invoice." : "Too many payment attempts. Wait before requesting another M-Pesa prompt." },
          { status: 429, headers: { "Retry-After": String(attempt.retryAfter), "Cache-Control": "no-store" } });
      }
      if (input.provider === "bitika" || input.provider === "lightning") await assertMeshDeviceCheckoutReady(context);
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
        access, pass: passRules, collectionGuardVersion: 1, ...(bitcoinPrice ? { bitcoinPrice } : {}), ...(context ? { meshContextId: context.id } : {}),
        ...(payer ? { payerContextId: payer.id } : {}), ...(payerKey ? { payerDeviceKeyHash: deviceKeyHash(payerKey) } : {}),
        ...(input.provider === "paystack" ? { paystack: { mode: "live", amountKes: wifiPackage.priceKes, paymentId, status: "processing", collectionConfirmed: false } } : {}),
        ...(bitika ? { bitika: { mode: bitika.mode, amountKes: wifiPackage.priceKes, lightningAddress: bitika.lightningAddress, status: "processing" } } : {}) },
    })
    .onConflictDoNothing({ target: payments.id })
    .returning();
  const payment = previous ?? inserted ?? (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (!payment || payment.metadata.requestFingerprint !== fingerprint || (context && payment.metadata.meshContextId !== context.id)) return Response.json({ error: "This payment reference belongs to a different request" }, { status: 409 });

  try {
    const owner = context && input.provider !== "btcpay" ? { paymentId: payment.id, contextId: context.id, routerId: context.routerId, macAddress: context.macAddress } : null;
    let reserved = !owner || await reserveMeshCheckout(owner);
    if (owner && !reserved) {
      // An earlier purchase holds this device. Ask its provider now: a prompt
      // nobody answered or an unpaid Bitcoin invoice should not lock it.
      await refreshEarlierPurchases(owner, payment.id);
      reserved = await reserveMeshCheckout(owner);
    }
    if (owner && !reserved) {
      // This reference never reached the provider. Close only the unstarted
      // local attempt; do not cancel or overwrite the existing real payment.
      await db.update(payments).set({ status: "invalid", updatedAt: new Date(),
        metadata: sql`${payments.metadata} || '{"checkoutConflict":true}'::jsonb` })
        .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"]),
          sql`NOT (${payments.metadata} ? 'paystackChargeStartedAt') AND NOT (${payments.metadata} ? 'bitikaChargeStartedAt')`));
      try { await assertMeshDeviceCheckoutReady(context!); }
      catch (error) { if (error instanceof PaymentProviderError) return Response.json({ error: error.message }, { status: error.httpStatus, headers: { "Cache-Control": "no-store" } }); }
      // Take them back to the payment that is still open, rather than a dead end.
      const earlier = await earlierPurchase(owner, payment.id);
      return Response.json({ error: "Your earlier payment is still open. Finish it or wait for it to close.", code: "earlier_payment", ...(earlier ? { paymentId: earlier } : {}) },
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
    const amountKes = input.provider === "lightning" ? Number((payment.metadata.bitcoinPrice as { amountKes?: number } | undefined)?.amountKes) : Number(payment.metadata.priceKes);
    const invoice = await provider.createCheckout({ paymentId: payment.id, amountSats: payment.amountSats, amountKes, packageName: String(payment.metadata.packageName), phone });
    await db
      .update(payments)
      .set({ providerInvoiceId: invoice.id, checkoutUrl: invoice.checkoutUrl, ...(invoice.amountSats ? { amountSats: invoice.amountSats } : {}), metadata: sql`${payments.metadata} || ${JSON.stringify(invoice.metadata)}::jsonb`, updatedAt: new Date() })
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
    if (input.provider === "btcpay" || input.provider === "lightning") await db.update(payments).set({ status: "invalid", updatedAt: new Date() }).where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
    console.error(`${input.provider} checkout creation failed`);
    if (input.provider === "bitika" || input.provider === "paystack") {
      // A collection may already have sent its prompt. Keep the customer on
      // this owned receipt; exposing adapter errors invites a second purchase.
      await db.update(payments).set({ status: "processing", updatedAt: new Date(),
        metadata: sql`${payments.metadata} || '{"checkoutInitiationUnconfirmed":true}'::jsonb` })
        .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
      return Response.json({ paymentId: payment.id, checkoutUrl: `/pay/${payment.id}`, paymentPending: true },
        { status: 202, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ paymentId: payment.id, error: error instanceof PaymentProviderError ? error.message : "Bitcoin payments are temporarily unavailable" }, { status: error instanceof PaymentProviderError ? error.httpStatus : 503 });
  }
}
