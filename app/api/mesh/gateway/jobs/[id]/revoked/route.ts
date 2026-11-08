import { z } from "zod";
import { readAgentBody, privateHeaders } from "@/lib/mesh-access/agent-api";
import { completeMeshRevocation } from "@/lib/mesh-access/passes";
export const runtime = "nodejs";
// The controller confirms the router no longer has this account online.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await context.params).id);
    const input = z.object({ claimToken: z.string().min(32).max(128), revoked: z.literal(true) }).strict().parse(await readAgentBody(request));
    if (!await completeMeshRevocation(id, input.claimToken)) throw new Error("Unconfirmed revocation");
    return Response.json({ revoked: true }, { headers: privateHeaders });
  } catch { return Response.json({ error: "Router revocation was not confirmed" }, { status: 409, headers: privateHeaders }); }
}
