import { sql } from "drizzle-orm";
import { db } from "../db";

type PurchaseOwner = { paymentId: string; contextId: string; routerId: string; macAddress: string };

// The unique device row serializes concurrent inserts/updates in PostgreSQL.
// A preliminary SELECT, a browser UUID or an expiring Redis lock cannot provide
// this guarantee after a crash or an ambiguous provider response.
export async function reserveMeshCheckout(owner: PurchaseOwner): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO mesh_checkout_reservations(router_id,mac_address,payment_id)
    SELECT c.router_id,c.mac_address,p.id
    FROM payments p JOIN mesh_access_contexts c ON c.id::text=p.metadata->>'meshContextId'
    WHERE p.id=${owner.paymentId}::uuid AND p.provider IN ('paystack','bitika') AND p.status IN ('new','processing')
      AND c.id=${owner.contextId}::uuid AND c.router_id=${owner.routerId} AND c.mac_address=${owner.macAddress}
      AND c.joined_at IS NOT NULL AND c.expires_at > now()
      -- Also protect collections initiated before this table was installed.
      -- Unstarted contenders must not block each other before the unique row
      -- chooses their owner; a durable provider-send marker is different.
      AND NOT EXISTS(SELECT 1 FROM payments legacy JOIN mesh_access_contexts lc
        ON lc.id::text=legacy.metadata->>'meshContextId'
        WHERE legacy.id<>p.id AND legacy.provider IN ('paystack','bitika')
          AND legacy.status IN ('new','processing')
          AND (legacy.metadata ? 'paystackChargeStartedAt' OR legacy.metadata ? 'bitikaChargeStartedAt'
            OR (legacy.provider='bitika' AND NOT (legacy.metadata ? 'collectionGuardVersion')))
          AND lc.router_id=c.router_id AND lc.mac_address=c.mac_address)
      AND NOT EXISTS(SELECT 1 FROM mesh_access_orders o JOIN mesh_access_contexts context ON context.id=o.context_id
        WHERE o.router_id=c.router_id AND context.mac_address=c.mac_address
          AND o.status IN ('queued','claimed','active') AND o.expires_at > now())
    ON CONFLICT(router_id,mac_address) DO UPDATE
      SET payment_id=EXCLUDED.payment_id,updated_at=now()
    WHERE mesh_checkout_reservations.payment_id=EXCLUDED.payment_id
      OR (
        EXISTS(SELECT 1 FROM payments old WHERE old.id=mesh_checkout_reservations.payment_id
          AND old.status IN ('invalid','expired','refunded','settled'))
        AND NOT EXISTS(SELECT 1 FROM mesh_access_orders o JOIN mesh_access_contexts context ON context.id=o.context_id
          WHERE o.router_id=EXCLUDED.router_id AND context.mac_address=EXCLUDED.mac_address
            AND o.status IN ('queued','claimed','active') AND o.expires_at > now())
      )
    RETURNING payment_id
  `);
  return result.rows.length === 1 && String(result.rows[0].payment_id) === owner.paymentId;
}
