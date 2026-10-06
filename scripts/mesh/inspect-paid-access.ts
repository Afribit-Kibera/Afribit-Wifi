import { neon } from "@neondatabase/serverless";
import { InsatsSettlementClient, readEngineConfig } from "../../lib/payments/insats-engine";

// Read-only evidence: never reconcile a collection, issue access, or send funds.
async function main() {
  const orderId = process.argv[2];
  if (!/^[a-f0-9-]{36}$/.test(orderId ?? "") || !process.env.DATABASE_URL) throw new Error("Order unavailable");
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql.query(`SELECT o.id AS order_id,o.status AS order_status,o.payment_id,o.expires_at,
    g.status AS grant_status,g.speed_limit_kbps,p.status AS payment_status,p.provider,
    p.metadata->'paystack'->>'amountKes' AS amount_kes,
    p.metadata->'paystack'->>'collectionConfirmed' AS collection_confirmed,
    p.metadata->'paystack'->>'verifiedBitcoinDelivery' AS bitcoin_verified,
    p.settled_at FROM mesh_access_orders o JOIN access_grants g ON g.id=o.grant_id
    JOIN payments p ON p.id=o.payment_id WHERE o.id=$1`, [orderId]);
  if (rows.length !== 1) throw new Error("Order unavailable");
  const order = rows[0];
  const receipt = await new InsatsSettlementClient(readEngineConfig()).getReceipt(String(order.payment_id), Number(order.amount_kes));
  console.log(JSON.stringify({ order, receipt: { status: receipt.status, collectionConfirmed: receipt.collectionConfirmed,
    verifiedBitcoinDelivery: receipt.verifiedBitcoinDelivery, amountKes: receipt.amountKes, amountSats: receipt.amountSats,
    destination: receipt.destination, settledAt: receipt.settledAt } }));
}
main().catch(() => { console.error("Read-only paid access check unconfirmed; no payment or access changes made"); process.exitCode = 1; });
