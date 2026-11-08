import { readAgentBody, privateHeaders } from "@/lib/mesh-access/agent-api";
import { recordRouterTelemetry, routerStatsSchema } from "@/lib/mesh-access/telemetry";
export const runtime = "nodejs";
// Signed controller report of read-only router health for the admin page.
export async function POST(request: Request) {
  let stats;
  try { stats = routerStatsSchema.parse(await readAgentBody(request, 65_536)); }
  catch { return Response.json({ error: "Unauthorized" }, { status: 403, headers: privateHeaders }); }
  await recordRouterTelemetry(stats);
  return Response.json({ recorded: true }, { headers: privateHeaders });
}
