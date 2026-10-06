import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { meshAccessContexts, meshAccessOrders, payments } from "../db/schema";
import { InsatsSettlementClient, readEngineConfig } from "../payments/insats-engine";
import { meshAutomaticAccessReady, readMeshAccessConfig } from "./config";
import { freshToken, hashToken, encryptAccess, decryptAccess, meshCookieName } from "./security";
import { validateAccessPackage, accessOrderSchema, observedHostSchema, type MeshAutomaticOrder } from "./model";
import type { MeshNativeStatus } from "./status-types";
import { PaymentProviderError } from "../payments/types";
import { verifiedBitikaSnapshot, type BitikaTransaction } from "../payments/bitika";

const consumedPilot = "e92ab0c0-fd6b-43d4-bfcb-57744876bacc";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export type TrustedMeshContext = typeof meshAccessContexts.$inferSelect & { loginUrl: string };

export async function getTrustedMeshContext(request: Request): Promise<TrustedMeshContext | null> {
  if (!meshAutomaticAccessReady()) return null;
  const cookie = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${meshCookieName}=`))?.slice(meshCookieName.length + 1);
  const [id, token] = (cookie ?? "").split(".");
  if (!uuid.test(id ?? "") || !/^[A-Za-z0-9_-]{43}$/.test(token ?? "")) return null;
  const config = readMeshAccessConfig();
  const [context] = await db.select().from(meshAccessContexts).where(and(eq(meshAccessContexts.id, id),
    eq(meshAccessContexts.browserTokenHash, hashToken(token)), eq(meshAccessContexts.routerId, config.routerId),
    eq(meshAccessContexts.server, config.server), sql`${meshAccessContexts.joinedAt} IS NOT NULL`, sql`${meshAccessContexts.expiresAt} > now()`)).limit(1);
  return context ? { ...context, loginUrl: "http://10.30.0.1/login" } : null;
}

export async function createMeshContext(input: { macAddress: string; ipAddress: string; server: string }) {
  const config = readMeshAccessConfig();
  observedHostSchema.parse(input);
  const id = randomUUID(), ticket = freshToken(), browser = freshToken();
  // Browser secret is released only when the one-use ticket is exchanged.
  const envelope = `${id}.${browser}`;
  await db.insert(meshAccessContexts).values({ id, routerId: config.routerId, server: config.server,
    macAddress: input.macAddress, ipAddress: input.ipAddress, joinTokenHash: hashToken(ticket), browserTokenHash: hashToken(browser),
    joinExpiresAt: new Date(Date.now() + 120_000), expiresAt: new Date(Date.now() + 32 * 86_400_000) });
  return { joinUrl: `https://wifi.afribit.africa/api/mesh/join?ticket=${ticket}&session=${envelope}` };
}

export async function consumeMeshJoin(ticket: string, session: string) {
  const [id, browser] = session.split(".");
  if (!uuid.test(id ?? "") || !/^[A-Za-z0-9_-]{43}$/.test(browser ?? "") || !/^[A-Za-z0-9_-]{43}$/.test(ticket)) return false;
  const result = await db.update(meshAccessContexts).set({ joinedAt: new Date() }).where(and(eq(meshAccessContexts.id, id),
    eq(meshAccessContexts.joinTokenHash, hashToken(ticket)), eq(meshAccessContexts.browserTokenHash, hashToken(browser)),
    sql`${meshAccessContexts.joinedAt} IS NULL`, sql`${meshAccessContexts.joinExpiresAt} > now()`)).returning({ id: meshAccessContexts.id });
  return result.length === 1;
}

function makeOrder(context: typeof meshAccessContexts.$inferSelect, access: ReturnType<typeof validateAccessPackage>, source: {paymentId?: string; voucherId?: string}) {
  const id = randomUUID(), expiresAt = new Date(Date.now() + access.durationMinutes * 60_000);
  const order: MeshAutomaticOrder = accessOrderSchema.parse({ id, routerId: context.routerId, server: context.server, macAddress: context.macAddress,
    ipAddress: context.ipAddress, user: `ma-${id.replaceAll("-", "")}`, password: freshToken(), expiresAt: expiresAt.toISOString(),
    ...access, ...source });
  return { order, expiresAt, encrypted: encryptAccess(order, readMeshAccessConfig()), grantId: randomUUID() };
}

export async function queueMeshPaidAccess(paymentId: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  // Historical/manual receipts cannot issue a second allowance.
  if (!payment || payment.id === consumedPilot || !uuid.test(String(payment.metadata.meshContextId ?? ""))) return null;
  const [previous] = await db.select().from(meshAccessOrders).where(eq(meshAccessOrders.paymentId, paymentId)).limit(1);
  if (previous) return { id: previous.grantId };
  if (payment.provider !== "paystack" || !["new", "processing"].includes(payment.status)) throw new Error("Payment cannot issue access");
  const config = readMeshAccessConfig();
  const [context] = await db.select().from(meshAccessContexts).where(and(eq(meshAccessContexts.id, String(payment.metadata.meshContextId)),
    eq(meshAccessContexts.routerId, config.routerId), eq(meshAccessContexts.server, config.server), sql`${meshAccessContexts.joinedAt} IS NOT NULL`, sql`${meshAccessContexts.expiresAt} > now()`)).limit(1);
  if (!context) throw new Error("Payment is missing its attested router context");
  const receipt = await new InsatsSettlementClient(readEngineConfig()).getReceipt(paymentId, Number(payment.metadata.priceKes));
  const paystack = payment.metadata.paystack as Record<string, unknown> | undefined;
  if (!receipt.verifiedBitcoinDelivery || receipt.resolutionRequired || receipt.status !== "settled" ||
      paystack?.verifiedBitcoinDelivery !== true || paystack.paymentHash !== receipt.paymentHash) throw new Error("Bitcoin settlement is unconfirmed");
  const access = validateAccessPackage(payment.metadata.access as Parameters<typeof validateAccessPackage>[0]);
  const plan = makeOrder(context, access, { paymentId });
  const rows = await db.execute(sql`
    WITH eligible AS (
      SELECT id FROM payments WHERE id = ${paymentId}::uuid AND status IN ('new','processing')
      AND metadata->>'meshContextId' = ${context.id} AND metadata->'paystack'->>'verifiedBitcoinDelivery' = 'true'
      AND metadata->'paystack'->>'paymentHash' = ${receipt.paymentHash} FOR UPDATE
    ), settled AS (
      UPDATE payments SET status='settled', amount_sats=${receipt.amountSats}, settled_at=now(), updated_at=now(),
        metadata=jsonb_set(metadata,'{paystack}',(metadata->'paystack') || '{"resolutionRequired":false,"accessCommissioningRequired":false}'::jsonb)
      WHERE id IN (SELECT id FROM eligible) RETURNING id, portal_session_id
    ), grant_row AS (
      INSERT INTO access_grants(id,portal_session_id,payment_id,mac_address,status,starts_at,expires_at,data_limit_mb,speed_limit_kbps,purpose)
      SELECT ${plan.grantId}::uuid,portal_session_id,id,${context.macAddress},'pending',now(),${plan.expiresAt.toISOString()}::timestamptz,
        ${access.dataLimitMb},${access.speedLimitKbps},'paid' FROM settled RETURNING id
    ) INSERT INTO mesh_access_orders(id,context_id,router_id,payment_id,grant_id,encrypted_order,expires_at)
      SELECT ${plan.order.id}::uuid,${context.id}::uuid,${config.routerId},${paymentId}::uuid,id,${plan.encrypted},${plan.expiresAt.toISOString()}::timestamptz
      FROM grant_row RETURNING grant_id
  `);
  if (rows.rows[0]) return { id: String(rows.rows[0].grant_id) };
  const [existing] = await db.select().from(meshAccessOrders).where(eq(meshAccessOrders.paymentId, paymentId)).limit(1);
  if (!existing) throw new Error("Access handoff needs reconciliation; do not pay again");
  return { id: existing.grantId };
}

// A Bitika receipt already includes Lightning delivery. Never send a second
// settlement through the fallback treasury or the retired router-job worker.
export async function queueMeshBitikaPaidAccess(paymentId: string, transaction: BitikaTransaction) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!payment || payment.provider !== "bitika" || !uuid.test(String(payment.metadata.meshContextId ?? "")) ||
      payment.providerInvoiceId !== transaction.transaction_code || (payment.metadata.bitika as { mode?: string })?.mode !== "live") {
    throw new Error("Payment cannot issue access");
  }
  const receipt = verifiedBitikaSnapshot(transaction, payment.metadata);
  if (receipt.status !== "settled") throw new Error("Bitcoin settlement is unconfirmed");
  const [previous] = await db.select().from(meshAccessOrders).where(eq(meshAccessOrders.paymentId, paymentId)).limit(1);
  if (previous) return { id: previous.grantId };
  if (!["new", "processing"].includes(payment.status)) throw new Error("Payment cannot issue access");
  const config = readMeshAccessConfig();
  const [context] = await db.select().from(meshAccessContexts).where(and(eq(meshAccessContexts.id, String(payment.metadata.meshContextId)),
    eq(meshAccessContexts.routerId, config.routerId), eq(meshAccessContexts.server, config.server), sql`${meshAccessContexts.joinedAt} IS NOT NULL`, sql`${meshAccessContexts.expiresAt} > now()`)).limit(1);
  if (!context) throw new Error("Payment is missing its attested router context");
  const access = validateAccessPackage(payment.metadata.access as Parameters<typeof validateAccessPackage>[0]);
  const plan = makeOrder(context, access, { paymentId });
  const rows = await db.execute(sql`
    WITH eligible AS (
      SELECT id,portal_session_id FROM payments WHERE id=${paymentId}::uuid AND provider='bitika'
      AND provider_invoice_id=${transaction.transaction_code} AND status IN ('new','processing')
      AND metadata->>'meshContextId'=${context.id} AND metadata->'bitika'->>'mode'='live'
      AND metadata->'bitika'->>'lightningAddress'=${transaction.lightningAddress}
      AND (metadata->'bitika'->>'amountKes')::numeric=${transaction.amount} FOR UPDATE
    ), settled AS (
      UPDATE payments SET status='settled',amount_sats=${receipt.amountSats!},settled_at=now(),updated_at=now(),
        metadata=jsonb_set(metadata,'{bitika}',(metadata->'bitika') || jsonb_build_object(
          'status','fulfilled','paymentHash',${receipt.paymentHash!}::text,'collectionConfirmed',true,
          'verifiedBitcoinDelivery',true,'resolutionRequired',false))
      WHERE id IN (SELECT id FROM eligible) RETURNING id,portal_session_id
    ), grant_row AS (
      INSERT INTO access_grants(id,portal_session_id,payment_id,mac_address,status,starts_at,expires_at,data_limit_mb,speed_limit_kbps,purpose)
      SELECT ${plan.grantId}::uuid,portal_session_id,id,${context.macAddress},'pending',now(),${plan.expiresAt.toISOString()}::timestamptz,
        ${access.dataLimitMb},${access.speedLimitKbps},'paid' FROM settled RETURNING id
    ) INSERT INTO mesh_access_orders(id,context_id,router_id,payment_id,grant_id,encrypted_order,expires_at)
      SELECT ${plan.order.id}::uuid,${context.id}::uuid,${config.routerId},${paymentId}::uuid,id,${plan.encrypted},${plan.expiresAt.toISOString()}::timestamptz
      FROM grant_row RETURNING grant_id
  `);
  if (rows.rows[0]) return { id: String(rows.rows[0].grant_id) };
  const [existing] = await db.select().from(meshAccessOrders).where(eq(meshAccessOrders.paymentId, paymentId)).limit(1);
  if (!existing) throw new Error("Access handoff needs reconciliation; do not pay again");
  return { id: existing.grantId };
}

export async function queueMeshVoucherAccess(input: { voucherId: string; portalSessionId: string; contextId: string; durationMinutes: number; dataLimitMb?: number | null; speedLimitKbps?: number | null }) {
  const config = readMeshAccessConfig();
  const [previous] = await db.select().from(meshAccessOrders).where(and(eq(meshAccessOrders.voucherId, input.voucherId), eq(meshAccessOrders.contextId, input.contextId))).limit(1);
  if (previous) return { id: previous.grantId };
  const [context] = await db.select().from(meshAccessContexts).where(and(eq(meshAccessContexts.id, input.contextId),
    eq(meshAccessContexts.routerId, config.routerId), eq(meshAccessContexts.server, config.server), sql`${meshAccessContexts.expiresAt} > now()`, sql`${meshAccessContexts.joinedAt} IS NOT NULL`)).limit(1);
  if (!context) throw new Error("Reconnect to Mesh");
  const access = validateAccessPackage(input), plan = makeOrder(context, access, { voucherId: input.voucherId });
  const rows = await db.execute(sql`
    WITH eligible AS (
      SELECT v.id FROM vouchers v JOIN voucher_batches b ON b.id=v.batch_id
      WHERE v.id=${input.voucherId}::uuid AND NOT v.disabled AND v.redemption_count < b.max_redemptions
      AND (b.valid_from IS NULL OR b.valid_from <= now()) AND (b.valid_until IS NULL OR b.valid_until > now())
      AND b.access_duration_minutes=${access.durationMinutes} AND b.data_limit_mb IS NOT DISTINCT FROM ${access.dataLimitMb}::integer
      AND COALESCE(b.speed_limit_kbps,2000)=${access.speedLimitKbps}
      AND EXISTS(SELECT 1 FROM mesh_access_contexts WHERE id=${context.id}::uuid AND joined_at IS NOT NULL AND expires_at > now())
      AND EXISTS(SELECT 1 FROM portal_sessions WHERE id=${input.portalSessionId}::uuid AND mac_address=${context.macAddress} AND router_id=${config.routerId})
      AND NOT EXISTS(SELECT 1 FROM mesh_access_orders WHERE voucher_id=v.id AND context_id=${context.id}::uuid)
      FOR UPDATE OF v
    ), consumed AS (
      UPDATE vouchers SET redemption_count=redemption_count+1,last_redeemed_at=now() WHERE id IN (SELECT id FROM eligible) RETURNING id
    ), grant_row AS (
      INSERT INTO access_grants(id,portal_session_id,voucher_id,mac_address,status,starts_at,expires_at,data_limit_mb,speed_limit_kbps,purpose)
      SELECT ${plan.grantId}::uuid,${input.portalSessionId}::uuid,id,${context.macAddress},'pending',now(),${plan.expiresAt.toISOString()}::timestamptz,
        ${access.dataLimitMb},${access.speedLimitKbps},'voucher' FROM consumed RETURNING id
    ) INSERT INTO mesh_access_orders(id,context_id,router_id,voucher_id,grant_id,encrypted_order,expires_at)
      SELECT ${plan.order.id}::uuid,${context.id}::uuid,${config.routerId},${input.voucherId}::uuid,id,${plan.encrypted},${plan.expiresAt.toISOString()}::timestamptz
      FROM grant_row RETURNING grant_id
  `);
  if (!rows.rows[0]) {
    const [existing] = await db.select().from(meshAccessOrders).where(and(eq(meshAccessOrders.voucherId, input.voucherId), eq(meshAccessOrders.contextId, input.contextId))).limit(1);
    if (existing) return { id: existing.grantId };
    throw new Error("Voucher unavailable");
  }
  return { id: String(rows.rows[0].grant_id) };
}

export async function getMeshAccessStatus(request: Request, input: { paymentId?: string; grantId?: string }): Promise<MeshNativeStatus | null> {
  const context = await getTrustedMeshContext(request);
  const id = input.paymentId ?? input.grantId;
  if (!context || !id || !uuid.test(id)) return null;
  const [order] = await db.select().from(meshAccessOrders).where(and(eq(meshAccessOrders.contextId, context.id),
    input.paymentId ? eq(meshAccessOrders.paymentId, input.paymentId) : eq(meshAccessOrders.grantId, input.grantId!))).limit(1);
  if (!order) return null;
  return { status: order.expiresAt.getTime() <= Date.now() ? "expired" : order.status === "active" && order.updatedAt.getTime() > Date.now()-90_000 ? "active" :
    ["failed", "revoked"].includes(order.status) ? "failed" : "pending", expiresAt: order.expiresAt.toISOString() };
}

export async function claimMeshOrders() {
  const config = readMeshAccessConfig(), token = freshToken();
  const rows = await db.execute(sql`
    UPDATE mesh_access_orders SET status=CASE WHEN status='active' THEN 'active' ELSE 'claimed' END,claim_token_hash=${hashToken(token)},claimed_at=now(),updated_at=now()
    WHERE id IN (SELECT id FROM mesh_access_orders WHERE router_id=${config.routerId} AND expires_at > now()
      AND (status='queued' OR (status='claimed' AND claimed_at < now()-interval '60 seconds') OR (status='active' AND claimed_at < now()-interval '30 seconds'))
      ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED)
    RETURNING id,encrypted_order
  `);
  return rows.rows.map(row => ({ id: String(row.id), claimToken: token, order: decryptAccess<MeshAutomaticOrder>(String(row.encrypted_order), config) }));
}

export async function recordMeshAgentHeartbeat() {
  const config = readMeshAccessConfig();
  await db.execute(sql`INSERT INTO mesh_agent_heartbeat(router_id,last_seen_at) VALUES(${config.routerId},now())
    ON CONFLICT(router_id) DO UPDATE SET last_seen_at=now()`);
}
export async function assertMeshDeviceCheckoutReady(context: TrustedMeshContext) {
  const config = readMeshAccessConfig();
  const result = await db.execute(sql`SELECT router_id FROM mesh_agent_heartbeat WHERE router_id=${config.routerId} AND last_seen_at > now()-interval '90 seconds'`);
  if (result.rows.length !== 1) throw new PaymentProviderError("The Mesh gateway is reconnecting. No payment was requested.");
  const existing = await db.execute(sql`SELECT o.id FROM mesh_access_orders o JOIN mesh_access_contexts c ON c.id=o.context_id
    WHERE o.router_id=${config.routerId} AND c.mac_address=${context.macAddress} AND o.expires_at > now()
    AND o.status IN ('queued','claimed','active') LIMIT 1`);
  if (existing.rows.length) throw new PaymentProviderError("This device already has an internet pass. Use it before buying another.", 409);
}

export async function assertMeshCheckoutReady(amountKes: number, context: TrustedMeshContext) {
  await assertMeshDeviceCheckoutReady(context);
  return new InsatsSettlementClient(readEngineConfig()).checkoutReadiness(amountKes);
}

export async function completeMeshOrder(id: string, input: { claimToken: string; active: boolean; macAddress: string; ipAddress: string; server: string; user: string; expiresAt: string }) {
  const config = readMeshAccessConfig();
  if (!uuid.test(id)) return false;
  const [record] = await db.select().from(meshAccessOrders).where(and(eq(meshAccessOrders.id, id), eq(meshAccessOrders.routerId, config.routerId))).limit(1);
  if (!record || record.claimTokenHash !== hashToken(input.claimToken) || record.expiresAt.getTime() <= Date.now()) return false;
  const order = decryptAccess<MeshAutomaticOrder>(record.encryptedOrder, config);
  if (!input.active || input.macAddress !== order.macAddress || input.ipAddress !== order.ipAddress || input.server !== order.server || input.user !== order.user || input.expiresAt !== order.expiresAt) return false;
  const rows = await db.execute(sql`
    WITH activated AS (UPDATE mesh_access_orders SET status='active',updated_at=now() WHERE id=${id}::uuid
      AND router_id=${config.routerId} AND claim_token_hash=${hashToken(input.claimToken)} AND status IN ('claimed','active') AND expires_at > now() RETURNING grant_id)
    UPDATE access_grants SET status='active',updated_at=now() WHERE id IN (SELECT grant_id FROM activated) RETURNING id
  `);
  return rows.rows.length === 1;
}
