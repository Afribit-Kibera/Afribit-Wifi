// Read-only evidence. Never collect, settle, reconcile or issue access.
import { mkdir, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { readDaemonConfig } from "../../gateway-agent/mesh-daemon";
import { meshAgentHeaders } from "../../lib/mesh-access/security";
import { BitikaClient, readBitikaConfig } from "../../lib/payments/bitika";
async function main() {
  const config = readDaemonConfig(), path = "/api/mesh/gateway/readiness", body = "{}";
  const response = await fetch(config.cloudOrigin + path, { method: "POST", body,
    headers: meshAgentHeaders(config, path, body), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error();
  const readiness = await response.json(), db = neon(process.env.DATABASE_URL!);
  const [quote, gateways, collections, orders] = await Promise.all([
    new BitikaClient(readBitikaConfig()).quote(10),
    db.query("SELECT router_id,last_seen_at > now()-interval '90 seconds' AS fresh FROM mesh_agent_heartbeat"),
    db.query(`SELECT provider,count(*)::int AS unresolved FROM payments WHERE provider IN ('bitika','paystack')
      AND status IN ('new','processing') AND metadata ? 'meshContextId'
      AND (metadata ? 'bitikaChargeStartedAt' OR metadata ? 'paystackChargeStartedAt' OR (provider='bitika' AND provider_invoice_id IS NOT NULL)) GROUP BY provider`),
    db.query("SELECT count(*)::int AS outstanding FROM mesh_access_orders WHERE expires_at > now() AND status IN ('queued','claimed','failed')"),
  ]);
  const result = { checkedAt: new Date().toISOString(), preferredProvider: readiness.preferredProvider,
    bitika: readiness.bitika, paystack: readiness.paystack, quoteKes10: quote, gateways, collections, orders,
    paymentInitiated: false, accessIssued: false, limitation: "Configuration and a quote do not prove live collection or activation." };
  await mkdir("artifacts/mesh-lab/private/bitika-primary", { recursive: true });
  await writeFile("artifacts/mesh-lab/private/bitika-primary/readiness.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (readiness.preferredProvider !== "bitika" || !readiness.bitika?.checkoutReady || !readiness.paystack?.checkoutReady ||
      !gateways.some(gateway => gateway.router_id === config.routerId && gateway.fresh)) process.exitCode = 2;
}
main().catch(() => { console.error("Bitika-primary readiness unconfirmed; no payment or transfer requested."); process.exitCode = 1; });
