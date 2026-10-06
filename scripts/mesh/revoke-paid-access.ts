import { neon } from "@neondatabase/serverless";

// Operator-only: disable the exact native account first. Payment stays settled.
async function main() {
  const orderId = process.argv[2];
  if (!/^[a-f0-9-]{36}$/.test(orderId ?? "") || !process.env.DATABASE_URL) throw new Error("Order unavailable");
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql.query(`SELECT o.id,o.status,o.payment_id,g.status AS grant_status
    FROM mesh_access_orders o JOIN access_grants g ON g.id=o.grant_id
    WHERE o.id=$1 AND o.router_id='KM-LAB-001' AND o.payment_id IS NOT NULL`, [orderId]);
  if (rows.length !== 1 || !["active", "revoked"].includes(String(rows[0].status))) throw new Error("Inspect order before revoking");
  if (process.argv[3] !== "--apply") { console.log(JSON.stringify({ order: rows[0], changesMade: false })); return; }
  const revoked = await sql.query(`WITH stopped AS (
    UPDATE mesh_access_orders SET status='revoked',claim_token_hash=NULL,claimed_at=NULL,
      last_error='Access ended at operator request',updated_at=now()
    WHERE id=$1 AND router_id='KM-LAB-001' AND payment_id IS NOT NULL
      AND status IN ('active','revoked') RETURNING grant_id
    ) UPDATE access_grants SET status='revoked',updated_at=now()
      WHERE id IN (SELECT grant_id FROM stopped) RETURNING id,status`, [orderId]);
  if (revoked.length !== 1) throw new Error("Revocation unconfirmed");
  console.log(JSON.stringify({ orderId, status: revoked[0].status, paymentUnchanged: true }));
}
main().catch(() => { console.error("Cloud access revocation unconfirmed; inspect native account and cloud order"); process.exitCode = 1; });
