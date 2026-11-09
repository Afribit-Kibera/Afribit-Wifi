import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { payments } from "../db/schema";
import { reconcileBitikaPayment } from "./reconcile-bitika";
import { reconcilePaystackCollection } from "./reconcile-paystack";
import { reconcileLightningPayment } from "./lightning";

type Device = { routerId: string; macAddress: string };
type Payment = typeof payments.$inferSelect;

// Unfinished purchases on this device, from any of its Mesh sessions. A phone
// that leaves and rejoins gets a new session but keeps its router-seen address.
function openPurchases(device: Device, exceptId: string) {
  return db.select().from(payments).where(and(inArray(payments.provider, ["bitika", "paystack", "lightning"]),
    inArray(payments.status, ["new", "processing"]), sql`${payments.id} <> ${exceptId}::uuid`,
    sql`EXISTS(SELECT 1 FROM mesh_access_contexts c WHERE c.id::text=${payments.metadata}->>'meshContextId'
      AND c.router_id=${device.routerId} AND c.mac_address=${device.macAddress})`))
    .orderBy(desc(payments.createdAt)).limit(3);
}

// Ask the provider about each earlier purchase now. Paid ones go through as
// usual; ones still waiting are stamped so the reservation can judge them on
// fresh evidence (see replaceablePurchase). A failed check keeps them blocking.
export async function refreshEarlierPurchases(device: Device, exceptId: string) {
  for (const payment of await openPurchases(device, exceptId)) {
    try {
      if (payment.provider === "bitika") await reconcileBitikaPayment(payment, true);
      else if (payment.provider === "lightning") await reconcileLightningPayment(payment, true);
      else await reconcilePaystackCollection(payment, true);
      await db.update(payments).set({ metadata: sql`${payments.metadata} || jsonb_build_object('replaceCheckedAt', ${Date.now()}::bigint)` })
        .where(and(eq(payments.id, payment.id), inArray(payments.status, ["new", "processing"])));
    } catch { /* Unknown state: leave it blocking. */ }
  }
}

// The earlier purchase this device should go back to, if it has a page.
export async function earlierPurchase(device: Device, exceptId: string) {
  return (await openPurchases(device, exceptId)).find(payment => payment.checkoutUrl)?.id ?? null;
}

// A payment page belongs to the session that made it, or to the same device
// after it rejoins Mesh (same router, same address).
export async function ownsPurchase(context: { id: string } & Device, payment: Payment) {
  const owners = [payment.metadata.meshContextId, payment.metadata.payerContextId].filter((id): id is string => typeof id === "string");
  if (owners.includes(context.id)) return true;
  if (!owners.length) return false;
  const rows = await db.execute(sql`SELECT 1 FROM mesh_access_contexts WHERE id::text IN (${sql.join(owners.map(id => sql`${id}`), sql`,`)})
    AND router_id=${context.routerId} AND mac_address=${context.macAddress} LIMIT 1`);
  return rows.rows.length === 1;
}
