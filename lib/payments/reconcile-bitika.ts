import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { payments } from "../db/schema";
import { BitikaClient, normalizeKenyanPhone, readBitikaConfig, verifiedBitikaSnapshot } from "./bitika";
import { bitikaSettlementSql } from "./bitika-settlement";
import { PaymentProviderError } from "./types";
import { meshAutomaticAccessReady, readMeshAccessConfig } from "../mesh-access/config";
import { decryptAccess } from "../mesh-access/security";
import { queueMeshBitikaPaidAccess } from "../mesh-access/service";

const retainedCollectionSchema = z.object({ paymentId: z.string().uuid(), amountKes: z.number().int().min(10).max(10_000),
  phone: z.string().regex(/^254[17]\d{8}$/), lightningAddress: z.string().regex(/^[a-z0-9_.+-]+@[a-z0-9.-]+\.[a-z]{2,}$/) }).strict();
const recoveryLeaseMs = 30_000; // Longer than the provider's 12-second request timeout.

export function bitikaMissingReferenceRecoveryCandidate(now = Date.now()) {
  return sql`(${payments.provider}='bitika' AND ${payments.metadata}->>'collectionGuardVersion'='1'
    AND jsonb_typeof(${payments.metadata}->'bitikaCollectionRequest')='string'
    AND CASE WHEN jsonb_typeof(${payments.metadata}->'bitikaChargeStartedAt')='number'
      THEN (${payments.metadata}->>'bitikaChargeStartedAt')::numeric <= ${now - recoveryLeaseMs} ELSE false END)`;
}

/** Recover a lost acknowledgement, never initiate a new logical purchase. */
export async function recoverBitikaCollection(payment: typeof payments.$inferSelect) {
  if (payment.provider !== "bitika" || payment.providerInvoiceId || !["new", "processing"].includes(payment.status) ||
    payment.metadata.collectionGuardVersion !== 1 || !z.string().uuid().safeParse(payment.metadata.meshContextId).success ||
    typeof payment.metadata.bitikaCollectionRequest !== "string" ||
    typeof payment.metadata.bitikaChargeStartedAt !== "number" || !Number.isSafeInteger(payment.metadata.bitikaChargeStartedAt) ||
    payment.metadata.bitikaChargeStartedAt <= 0 || payment.metadata.bitikaChargeStartedAt > Date.now() - recoveryLeaseMs) return;
  const context = z.object({ mode: z.literal("live"), amountKes: z.number().int(), lightningAddress: z.string() }).safeParse(payment.metadata.bitika);
  let retained: z.infer<typeof retainedCollectionSchema>;
  try { retained = retainedCollectionSchema.parse(decryptAccess(payment.metadata.bitikaCollectionRequest, readMeshAccessConfig())); }
  catch { throw new PaymentProviderError("This payment needs confirmation. Do not pay again."); }
  if (!context.success || retained.paymentId !== payment.id || retained.amountKes !== payment.metadata.priceKes ||
    retained.amountKes !== context.data.amountKes || retained.lightningAddress !== context.data.lightningAddress ||
    normalizeKenyanPhone(retained.phone) !== retained.phone) throw new PaymentProviderError("This payment request does not match the retained purchase");
  const config = readBitikaConfig();
  if (config.mode !== "live") throw new PaymentProviderError("Sandbox payments cannot authorize internet");
  const now = Date.now();
  // Persistent compare-and-set protects both concurrent workers and process
  // restarts. Even forced reconciliation cannot bypass this money-request lease.
  const [lease] = await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('bitikaLastCheckedAt', ${now}::bigint)` })
    .where(and(eq(payments.id, payment.id), eq(payments.provider, "bitika"), inArray(payments.status, ["new", "processing"]),
      sql`${payments.providerInvoiceId} IS NULL`, sql`${payments.metadata}->>'bitikaCollectionRequest' = ${payment.metadata.bitikaCollectionRequest}`,
      sql`(${payments.metadata}->>'bitikaChargeStartedAt')::bigint <= ${now - recoveryLeaseMs}`,
      sql`COALESCE((${payments.metadata}->>'bitikaLastCheckedAt')::bigint,0) < ${now - recoveryLeaseMs}`)).returning({ id: payments.id });
  if (!lease) return;
  // Bitika deduplicates the original UUID and exact payload. Configuration
  // changes must not redirect a paid customer's outstanding Bitcoin delivery.
  const acknowledgement = await new BitikaClient({ ...config, lightningAddress: retained.lightningAddress }).collect(retained);
  const [attached] = await db.update(payments).set({ providerInvoiceId: acknowledgement.transaction_code,
    checkoutUrl: `/pay/${payment.id}`, status: "processing", updatedAt: new Date(),
    metadata: sql`${payments.metadata} || '{"checkoutInitiationUnconfirmed":false}'::jsonb` })
    .where(and(eq(payments.id, payment.id), eq(payments.provider, "bitika"), inArray(payments.status, ["new", "processing"]),
      sql`${payments.providerInvoiceId} IS NULL`, sql`${payments.metadata}->>'bitikaCollectionRequest' = ${payment.metadata.bitikaCollectionRequest}`)).returning();
  if (attached) return attached;
  // The first response/webhook may have attached the same reference while the
  // idempotent retry was in flight. Never overwrite a different transaction.
  const [current] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
  if (current?.providerInvoiceId === acknowledgement.transaction_code) return current;
  throw new PaymentProviderError("This payment needs confirmation. Do not pay again.");
}

export async function reconcileBitikaPayment(payment: typeof payments.$inferSelect, force = false) {
  if (payment.provider !== "bitika" || !["new", "processing"].includes(payment.status)) return;
  let recovered = false;
  if (!payment.providerInvoiceId) {
    const result = await recoverBitikaCollection(payment);
    if (!result?.providerInvoiceId) return;
    if (!["new", "processing"].includes(result.status)) return;
    payment = result; recovered = true;
  }
  const code = payment.providerInvoiceId;
  if (!code) return;
  // Test transactions never enter production accounting or the grant queue.
  const config = readBitikaConfig();
  if (config.mode !== "live" || code.startsWith("SBX-")) throw new PaymentProviderError("Sandbox payments cannot authorize internet");
  if (!force && !recovered) {
    const [lease] = await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('bitikaLastCheckedAt', ${Date.now()}::bigint)` })
      .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"]), sql`COALESCE((${payments.metadata}->>'bitikaLastCheckedAt')::bigint, 0) < ${Date.now() - 10_000}`)).returning({ id: payments.id });
    if (!lease) return;
  }
  const transaction = await new BitikaClient(config).getTransaction(code);
  const snapshot = verifiedBitikaSnapshot(transaction, payment.metadata);
  if (snapshot.status === "settled") {
    if (payment.metadata.meshContextId) {
      if (!meshAutomaticAccessReady()) throw new PaymentProviderError("Internet activation is reconnecting. Do not pay again.");
      await queueMeshBitikaPaidAccess(payment.id, transaction);
      return;
    }
    await db.execute(bitikaSettlementSql(payment.id, code, snapshot));
    return;
  }
  const patch = JSON.stringify({ status: snapshot.providerStatus, resolutionRequired: snapshot.resolutionRequired ?? false,
    collectionConfirmed: ["processing_payment", "payment_failed"].includes(snapshot.providerStatus) });
  await db.update(payments).set({ status: snapshot.status, updatedAt: new Date(), metadata: sql`jsonb_set(${payments.metadata}, '{bitika}', (${payments.metadata}->'bitika') || ${patch}::jsonb)` })
    .where(and(eq(payments.id, payment.id), eq(payments.provider, "bitika"), inArray(payments.status, ["new", "processing"])));
}
