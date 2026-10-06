import { readDaemonConfig } from "../../gateway-agent/mesh-daemon";
import { meshAgentHeaders } from "../../lib/mesh-access/security";
async function main() {
  const config=readDaemonConfig(), path="/api/mesh/gateway/readiness", body="{}";
  const response=await fetch(config.cloudOrigin+path, {method:"POST",headers:meshAgentHeaders(config,path,body),body,redirect:"error",signal:AbortSignal.timeout(20_000)});
  if(!response.ok) throw new Error("Runtime readiness unconfirmed");
  const readiness=await response.json();
  console.log(JSON.stringify(readiness));
}
main().catch(()=>{console.error("Runtime readiness unconfirmed; no secrets logged");process.exitCode=1;});
