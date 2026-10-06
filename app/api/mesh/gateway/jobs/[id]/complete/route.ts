import { z } from "zod";
import { readAgentBody, privateHeaders } from "@/lib/mesh-access/agent-api";
import { completeMeshOrder } from "@/lib/mesh-access/service";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const input = z.object({ claimToken: z.string().min(32).max(128), active: z.literal(true), macAddress: z.string(), ipAddress: z.string(),
      server: z.string(), user: z.string(), expiresAt: z.string() }).strict().parse(await readAgentBody(request));
    if (!await completeMeshOrder((await context.params).id, input)) throw new Error("Unconfirmed access");
    return Response.json({ activated: true }, { headers: privateHeaders });
  } catch { return Response.json({ error: "Router activation was not confirmed" }, { status: 409, headers: privateHeaders }); }
}
