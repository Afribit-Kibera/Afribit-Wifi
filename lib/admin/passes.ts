import { sql } from "drizzle-orm";
import { db } from "../db";
import { readMeshAccessConfig } from "../mesh-access/config";
import { formatPassCode, normalizeCode, passCodeHash } from "../mesh-access/passes";
import { decryptAccess } from "../mesh-access/security";

const kes = sql.raw(`COALESCE((pay.metadata->'bitcoinPrice'->>'amountKes')::numeric, (pay.metadata->>'priceKes')::numeric)`);

export type FoundPass = { id: string; kind: string; plan: string; source: string; kes: number | null; createdAt: Date; expiresAt: Date;
  revokedAt: Date | null; live: boolean; devices: { label: string; mac: string; removed: boolean }[] };

// What staff can search by: part of a device's Wi-Fi address (MAC), a full
// pass code, or nothing (the latest passes). Optionally one Nairobi day.
export function parsePassSearch(query: string) {
  const text = query.trim();
  const digits = normalizeCode(text);
  if (/^\d{10}$/.test(digits) && /^[\d\s-]+$/.test(text)) return { codeHash: passCodeHash(digits) } as const;
  const mac = text.toUpperCase().replace(/[^0-9A-F]/g, "");
  if (mac.length >= 4 && /^[0-9A-Fa-f:\-.\s]+$/.test(text)) return { mac } as const;
  return {} as const;
}

export async function findPasses(input: { query?: string; day?: string; limit?: number }): Promise<FoundPass[]> {
  const routerId = readMeshAccessConfig().routerId;
  const search = parsePassSearch(input.query ?? "");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(input.day ?? "") ? input.day! : null;
  const filters = [sql`p.router_id=${routerId}`];
  if ("codeHash" in search) filters.push(sql`p.code_hash=${search.codeHash}`);
  if ("mac" in search) filters.push(sql`EXISTS (SELECT 1 FROM mesh_pass_devices d WHERE d.pass_id=p.id AND replace(d.mac_address, ':', '') LIKE ${`%${search.mac}%`})`);
  if (day) filters.push(sql`(p.created_at AT TIME ZONE 'Africa/Nairobi')::date = ${day}::date`);
  if (!("codeHash" in search) && !("mac" in search) && !day) filters.push(sql`p.created_at > now() - interval '3 days'`);
  const { rows } = await db.execute(sql`SELECT p.id, p.kind, p.created_at, p.expires_at, p.revoked_at,
      p.revoked_at IS NULL AND p.expires_at > now() AS live,
      COALESCE(pay.metadata->>'packageName', '') AS plan,
      CASE WHEN p.voucher_id IS NOT NULL THEN 'Voucher' WHEN pay.provider='lightning' THEN 'Bitcoin' WHEN pay.provider IN ('bitika','paystack') THEN 'M-Pesa' ELSE 'Other' END AS source,
      CASE WHEN pay.id IS NULL THEN NULL ELSE ${kes} END AS kes,
      (SELECT json_agg(json_build_object('label', d.label, 'mac', d.mac_address, 'removed', d.removed_at IS NOT NULL) ORDER BY d.slot)
        FROM mesh_pass_devices d WHERE d.pass_id=p.id) AS devices
    FROM mesh_passes p LEFT JOIN payments pay ON pay.id=p.payment_id
    WHERE ${sql.join(filters, sql` AND `)} ORDER BY p.created_at DESC LIMIT ${input.limit ?? 50}`);
  return rows.map(row => ({ id: String(row.id), kind: String(row.kind), plan: String(row.plan), source: String(row.source),
    kes: row.kes === null ? null : Number(row.kes), createdAt: new Date(String(row.created_at)), expiresAt: new Date(String(row.expires_at)),
    revokedAt: row.revoked_at ? new Date(String(row.revoked_at)) : null, live: row.live === true,
    devices: ((typeof row.devices === "string" ? JSON.parse(row.devices) : row.devices) ?? []) as FoundPass["devices"] }));
}

// The pass code, for staff helping someone who lost it. Callers must log who looked.
export async function passCode(passId: string) {
  const config = readMeshAccessConfig();
  const { rows: [row] } = await db.execute(sql`SELECT code_ciphertext FROM mesh_passes WHERE id=${passId}::uuid AND router_id=${config.routerId}`);
  if (!row) return null;
  return formatPassCode(decryptAccess<{ code: string }>(String(row.code_ciphertext), config).code);
}
