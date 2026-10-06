// No collection or Bitcoin send. One bounded device-bound diagnostic account.
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { createPinnedRouter, readDaemonConfig } from "../../gateway-agent/mesh-daemon";
import { freshToken } from "../../lib/mesh-access/security";
import type { MeshAutomaticOrder } from "../../lib/mesh-access/model";
async function main() {
  const router = createPinnedRouter(readDaemonConfig());
  const host = await router.observe("10.30.0.197"), id = randomUUID();
  const order: MeshAutomaticOrder = { ...host, id, routerId: "KM-LAB-001", user: `ma-${id.replaceAll("-", "")}`,
    password: freshToken(), expiresAt: new Date(Date.now()+60_000).toISOString(), durationMinutes: 1,
    dataLimitMb: 10, speedLimitKbps: 8192, voucherId: randomUUID() };
  await mkdir("artifacts/mesh-lab/private/automatic-setup",{recursive:true});
  await writeFile(`artifacts/mesh-lab/private/automatic-setup/diagnostic-${id}.json`,JSON.stringify(order),{mode:0o600,flag:"wx"});
  const activated = await router.activate(order);
  const retried = await router.activate(order);
  const report = { activated, retrySameDeadline: retried.expiresAt === activated.expiresAt, noCustomerCredentials:true,
    diagnostic:true, noPayment:true, checkedAt:new Date().toISOString() };
  await writeFile("artifacts/mesh-lab/private/automatic-setup/router-verification.json",JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
main().catch(()=>{console.error("Automatic router diagnostic unconfirmed; inspect retained state");process.exitCode=1;});
