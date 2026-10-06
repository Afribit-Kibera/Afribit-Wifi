import { mkdir, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { InsatsSettlementClient, readEngineConfig } from "../../lib/payments/insats-engine";
import { inspectMeshRuntime, evaluateMeshReadiness } from "../../lib/production/runtime-readiness";
import { readDaemonConfig } from "../../gateway-agent/mesh-daemon";
import { meshAgentHeaders } from "../../lib/mesh-access/security";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Load the existing private database configuration");
  const database = neon(process.env.DATABASE_URL);
  // Deliberately no calls to charge, settle, reconcile, grant or router mutation.
  const [runtime, cloudConfiguration, ...quotes] = await Promise.all([
    inspectMeshRuntime(statement => database.query(statement)),
    (async () => {
      try {
        const config = readDaemonConfig(), path = "/api/mesh/gateway/readiness", body = "{}";
        const response = await fetch(config.cloudOrigin + path, { method: "POST", body,
          headers: meshAgentHeaders(config, path, body), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
        if (!response.ok) throw new Error();
        const value = await response.json();
        return { automaticConfigured: value.paystack?.accessReady === true, checkoutConfigured: value.paystack?.checkoutReady === true };
      } catch { return { automaticConfigured: false, checkoutConfigured: false }; }
    })(),
    ...[10, 450].map(async amountKes => {
      try {
        const ready = await new InsatsSettlementClient(readEngineConfig()).checkoutReadiness(amountKes);
        return { amountKes, amountSats: ready.amountSats, checkoutReady: true };
      } catch { return { amountKes, checkoutReady: false }; }
    }),
  ]);
  const readiness = evaluateMeshReadiness(runtime, cloudConfiguration);
  const result = { checkedAt: new Date().toISOString(), ...readiness, ...runtime, settlementQuotes: quotes };
  await mkdir("artifacts/mesh-lab/private/production-review", { recursive: true });
  await writeFile("artifacts/mesh-lab/private/production-review/runtime-readiness.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, catalogue: { catalogueMatches: runtime.catalogue.catalogueMatches,
    expectedProducts: runtime.catalogue.expectedProducts, actualProducts: runtime.catalogue.actualProducts,
    issueCount: runtime.catalogue.issues.length }, evidenceFile: "artifacts/mesh-lab/private/production-review/runtime-readiness.json" }, null, 2));
  // Exit 2 means field cutover is blocked. A healthy website or treasury quote
  // must not turn the current lab-only implementation into a false go-ahead.
  if (readiness.field.status !== "ready" || quotes.some(quote => !quote.checkoutReady)) process.exitCode = 2;
}
main().catch(() => { console.error("Read-only production runtime check unavailable; no payment or transfer requested."); process.exitCode = 1; });
