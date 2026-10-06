import { readMeshAccessConfig } from "./config";
import { authenticateMeshAgent } from "./security";
import { claimMeshAgentRequest } from "./agent-replay";
import { readBoundedText } from "../request-body";
export async function readAgentBody(request: Request): Promise<unknown> {
  const config = readMeshAccessConfig();
  const body = await readBoundedText(request, 16_384);
  const authenticated = authenticateMeshAgent(request, body, config);
  if (!authenticated || !await claimMeshAgentRequest(authenticated, config)) throw new Error("Unauthorized");
  return JSON.parse(body);
}
export const privateHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
