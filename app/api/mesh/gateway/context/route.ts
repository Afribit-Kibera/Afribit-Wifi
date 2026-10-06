import { z } from "zod";
import { readAgentBody, privateHeaders } from "@/lib/mesh-access/agent-api";
import { createMeshContext } from "@/lib/mesh-access/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = z.object({ macAddress: z.string(), ipAddress: z.string(), server: z.string() }).strict().parse(await readAgentBody(request));
    return Response.json(await createMeshContext(input), { headers: privateHeaders });
  } catch { return Response.json({ error: "Mesh enrollment unavailable" }, { status: 403, headers: privateHeaders }); }
}
