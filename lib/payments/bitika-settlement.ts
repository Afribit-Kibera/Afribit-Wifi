import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { PaymentProviderError, type ProviderSnapshot } from "./types";

// One PostgreSQL statement: receipt, grant and job either all commit or all roll
// back. Repeated webhook/poll deliveries cannot mint another paid allowance.
export function bitikaSettlementSql(paymentId: string, transactionCode: string, snapshot: ProviderSnapshot) {
  if (transactionCode.startsWith("SBX-") || snapshot.status !== "settled" || !snapshot.amountSats || !/^[a-f0-9]{64}$/i.test(snapshot.paymentHash ?? "")) {
    throw new PaymentProviderError("A verified live Bitcoin settlement is required");
  }
  const grantId = randomUUID();
  const jobId = randomUUID();
  return sql`
    WITH candidate AS (
      SELECT p.id, p.portal_session_id, p.package_id, s.mac_address, s.ip_address,
             s.router_id, s.login_url, p.metadata
      FROM payments p JOIN portal_sessions s ON s.id = p.portal_session_id
      WHERE p.id = ${paymentId}::uuid AND p.provider = 'bitika'
        AND p.provider_invoice_id = ${transactionCode}
        AND p.status IN ('new', 'processing')
        AND p.metadata->'bitika'->>'mode' = 'live'
        AND s.router_id IS NOT NULL AND s.router_id <> ''
        AND (p.metadata->'access'->>'durationMinutes')::integer > 0
      FOR UPDATE OF p
    ), receipt AS (
      UPDATE payments p SET status = 'settled', amount_sats = ${snapshot.amountSats},
        settled_at = now(), updated_at = now(),
        metadata = jsonb_set(p.metadata, '{bitika}', (p.metadata->'bitika') ||
          jsonb_build_object('status', 'fulfilled', 'paymentHash', ${snapshot.paymentHash}::text, 'resolutionRequired', false))
      FROM candidate c WHERE p.id = c.id AND p.status IN ('new', 'processing')
      RETURNING p.id
    ), allowance AS (
      INSERT INTO access_grants (id, portal_session_id, payment_id, mac_address, status,
        starts_at, expires_at, data_limit_mb, speed_limit_kbps, purpose)
      SELECT ${grantId}::uuid, c.portal_session_id, c.id, c.mac_address, 'pending', now(),
        now() + ((c.metadata->'access'->>'durationMinutes')::integer * interval '1 minute'),
        (c.metadata->'access'->>'dataLimitMb')::integer,
        (c.metadata->'access'->>'speedLimitKbps')::integer, 'paid'
      FROM candidate c JOIN receipt r ON r.id = c.id
      RETURNING id, payment_id, expires_at
    )
    INSERT INTO router_jobs (id, type, status, payload)
    SELECT ${jobId}::uuid, 'grant_access', 'queued', jsonb_build_object(
      'accessGrantId', a.id, 'macAddress', c.mac_address, 'ipAddress', c.ip_address,
      'routerId', c.router_id, 'loginUrl', c.login_url, 'expiresAt', a.expires_at,
      'durationMinutes', (c.metadata->'access'->>'durationMinutes')::integer,
      'dataLimitMb', (c.metadata->'access'->>'dataLimitMb')::integer,
      'speedLimitKbps', (c.metadata->'access'->>'speedLimitKbps')::integer, 'purpose', 'paid')
    FROM allowance a JOIN candidate c ON c.id = a.payment_id
    RETURNING id
  `;
}
