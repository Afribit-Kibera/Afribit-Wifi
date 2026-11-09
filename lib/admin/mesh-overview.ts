import { sql } from "drizzle-orm";
import { db } from "../db";

// Days follow Nairobi time, not the server's clock.
const today = sql.raw(`(date_trunc('day', now() AT TIME ZONE 'Africa/Nairobi') AT TIME ZONE 'Africa/Nairobi')`);
const localDay = (column: string) => sql.raw(`(${column} AT TIME ZONE 'Africa/Nairobi')::date`);
// What the buyer paid in shillings. Bitcoin buyers pay the discounted price.
const kes = sql.raw(`COALESCE((p.metadata->'bitcoinPrice'->>'amountKes')::numeric, (p.metadata->>'priceKes')::numeric, 0)`);
const meshPurchase = sql.raw(`p.provider IN ('bitika','paystack','lightning') AND NOT (p.metadata ? 'checkoutConflict')`);

const num = (value: unknown) => Number(value ?? 0);

export type MeshSummary = {
  online: number; livePasses: number; passDevices: number; visitorsToday: number; visitors30: number; buyers30: number;
  paidToday: number; mpesaKesToday: number; bitcoinKesToday: number; unfinishedToday: number; vouchersToday: number;
};

export async function meshSummary(): Promise<MeshSummary> {
  const { rows: [row] } = await db.execute(sql`SELECT
    (SELECT count(DISTINCT c.mac_address) FROM mesh_access_orders o JOIN mesh_access_contexts c ON c.id=o.context_id
      WHERE o.status IN ('queued','claimed','active') AND o.expires_at > now()) AS online,
    (SELECT count(*) FROM mesh_passes WHERE revoked_at IS NULL AND expires_at > now()) AS live_passes,
    (SELECT count(*) FROM mesh_pass_devices d JOIN mesh_passes s ON s.id=d.pass_id
      WHERE d.removed_at IS NULL AND s.revoked_at IS NULL AND s.expires_at > now()) AS pass_devices,
    (SELECT count(DISTINCT mac_address) FROM mesh_access_contexts WHERE created_at >= ${today}) AS visitors_today,
    (SELECT count(DISTINCT mac_address) FROM mesh_access_contexts WHERE created_at >= now()-interval '30 days') AS visitors_30,
    (SELECT count(DISTINCT COALESCE(payer_device_key_hash, id::text)) FROM mesh_passes WHERE created_at >= now()-interval '30 days') AS buyers_30,
    (SELECT count(*) FROM payments p WHERE ${meshPurchase} AND p.status='settled' AND p.settled_at >= ${today}) AS paid_today,
    (SELECT COALESCE(sum(${kes}),0) FROM payments p WHERE p.provider IN ('bitika','paystack') AND p.status='settled' AND p.settled_at >= ${today}) AS mpesa_today,
    (SELECT COALESCE(sum(${kes}),0) FROM payments p WHERE p.provider='lightning' AND p.status='settled' AND p.settled_at >= ${today}) AS bitcoin_today,
    (SELECT count(*) FROM payments p WHERE ${meshPurchase} AND p.created_at >= ${today}
      AND (p.status IN ('invalid','expired') OR (p.status IN ('new','processing') AND p.created_at < now()-interval '10 minutes'))) AS unfinished_today,
    (SELECT count(*) FROM vouchers WHERE last_redeemed_at >= ${today}) AS vouchers_today`);
  return { online: num(row.online), livePasses: num(row.live_passes), passDevices: num(row.pass_devices),
    visitorsToday: num(row.visitors_today), visitors30: num(row.visitors_30), buyers30: num(row.buyers_30),
    paidToday: num(row.paid_today), mpesaKesToday: num(row.mpesa_today), bitcoinKesToday: num(row.bitcoin_today),
    unfinishedToday: num(row.unfinished_today), vouchersToday: num(row.vouchers_today) };
}

export type MeshDay = { day: string; visitors: number; started: number; paid: number; kes: number };

export async function meshLastWeek(): Promise<MeshDay[]> {
  const { rows } = await db.execute(sql`SELECT d::date::text AS day,
    (SELECT count(DISTINCT mac_address) FROM mesh_access_contexts WHERE ${localDay("created_at")} = d::date) AS visitors,
    (SELECT count(*) FROM payments p WHERE ${meshPurchase} AND ${localDay("p.created_at")} = d::date) AS started,
    (SELECT count(*) FROM payments p WHERE ${meshPurchase} AND p.status='settled' AND ${localDay("p.settled_at")} = d::date) AS paid,
    (SELECT COALESCE(sum(${kes}),0) FROM payments p WHERE ${meshPurchase} AND p.status='settled' AND ${localDay("p.settled_at")} = d::date) AS kes
    FROM generate_series((now() AT TIME ZONE 'Africa/Nairobi')::date - 6, (now() AT TIME ZONE 'Africa/Nairobi')::date, interval '1 day') AS d
    ORDER BY d DESC`);
  return rows.map(row => ({ day: String(row.day), visitors: num(row.visitors), started: num(row.started), paid: num(row.paid), kes: num(row.kes) }));
}

export type LivePass = { id: string; kind: string; devices: number; deviceLimit: number; source: string; kes: number | null; createdAt: Date; expiresAt: Date; macs: string };

export async function meshLivePasses(): Promise<LivePass[]> {
  const { rows } = await db.execute(sql`SELECT s.id, s.kind, s.device_limit, s.created_at, s.expires_at,
    (SELECT count(*) FROM mesh_pass_devices d WHERE d.pass_id=s.id AND d.removed_at IS NULL) AS devices,
    (SELECT string_agg(d.mac_address, ' ' ORDER BY d.slot) FROM mesh_pass_devices d WHERE d.pass_id=s.id AND d.removed_at IS NULL) AS macs,
    CASE WHEN s.voucher_id IS NOT NULL THEN 'Voucher' WHEN p.provider='lightning' THEN 'Bitcoin' WHEN p.provider IN ('bitika','paystack') THEN 'M-Pesa' ELSE 'Other' END AS source,
    CASE WHEN p.id IS NULL THEN NULL ELSE ${kes} END AS kes
    FROM mesh_passes s LEFT JOIN payments p ON p.id=s.payment_id
    WHERE s.revoked_at IS NULL AND s.expires_at > now() ORDER BY s.created_at DESC LIMIT 50`);
  return rows.map(row => ({ id: String(row.id), kind: String(row.kind), devices: num(row.devices), deviceLimit: num(row.device_limit),
    source: String(row.source), kes: row.kes === null ? null : num(row.kes), createdAt: new Date(String(row.created_at)),
    expiresAt: new Date(String(row.expires_at)), macs: String(row.macs ?? "") }));
}

export type MeshPayment = { id: string; method: string; kes: number; createdAt: Date; label: string; tone: "success" | "warning" | "danger" | "neutral" };

// Plain words for where each purchase stands.
export function paymentLabel(provider: string, status: string, details: Record<string, unknown> | undefined): Pick<MeshPayment, "label" | "tone"> {
  if (status === "settled") return { label: "Paid", tone: "success" };
  if (status === "expired") return { label: provider === "lightning" ? "Invoice expired" : "Expired", tone: "neutral" };
  if (status === "invalid" || status === "refunded") return { label: provider === "lightning" ? "Closed" : "Cancelled or failed", tone: "danger" };
  if (details?.resolutionRequired === true) return { label: "Needs review", tone: "danger" };
  if (details?.collectionConfirmed === true || details?.status === "paid") return { label: "Paid, connecting", tone: "warning" };
  return { label: provider === "lightning" ? "Invoice open" : "Waiting for PIN", tone: "warning" };
}

export async function meshRecentPayments(): Promise<MeshPayment[]> {
  const { rows } = await db.execute(sql`SELECT p.id, p.provider, p.status, p.created_at, ${kes} AS kes, p.metadata->p.provider AS details
    FROM payments p WHERE ${meshPurchase} ORDER BY p.created_at DESC LIMIT 20`);
  return rows.map(row => ({ id: String(row.id), method: row.provider === "lightning" ? "Bitcoin" : "M-Pesa", kes: num(row.kes),
    createdAt: new Date(String(row.created_at)),
    ...paymentLabel(String(row.provider), String(row.status), (row.details ?? undefined) as Record<string, unknown> | undefined) }));
}
