// Bounded read-only checks. Does not claim jobs, mint contexts or request payment.
import { mkdir, writeFile } from "node:fs/promises";
import { meshAgentHeaders } from "../../lib/mesh-access/security";

async function main() {
  const serviceKey = process.env.MESH_ROUTER_SERVICE_KEY;
  if (!serviceKey || Buffer.byteLength(serviceKey) < 32) throw new Error("Missing enrolled gateway configuration");
  const path = "/api/mesh/gateway/readiness", body = "{}";
  const config = { routerId: "KM-LAB-001" as const, serviceKey };
  const signed = meshAgentHeaders(config, path, body);
  async function check(headers: HeadersInit) {
    const response = await fetch("https://wifi.afribit.africa" + path, { method: "POST", body, headers,
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
    await response.body?.cancel();
    return response.status;
  }
  const first = await check(signed), replay = await check(signed), fresh = await check(meshAgentHeaders(config, path, body));
  const legacy = await check({ "Content-Type": "application/json", "x-mesh-router": signed["x-mesh-router"],
    "x-mesh-time": signed["x-mesh-time"], "x-mesh-auth": signed["x-mesh-auth"] });
  const passed = first === 200 && replay === 403 && fresh === 200 && legacy === 403;
  const report = { checkedAt: new Date().toISOString(), first, replay, fresh, legacy, passed,
    paymentInitiated: false, accessGranted: false, rawCredentialsOrSignaturesStored: false };
  await mkdir("artifacts/mesh-lab/private/security-release", { recursive: true });
  await writeFile("artifacts/mesh-lab/private/security-release/live-replay-check.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!passed) process.exitCode = 1;
}
main().catch(() => { console.error("Live replay rejection unconfirmed; no financial request was made"); process.exitCode = 1; });
