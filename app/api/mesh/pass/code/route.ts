import { z } from "zod";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { passCaller, passFailure } from "@/lib/mesh-access/pass-api";
import { redeemPassCode } from "@/lib/mesh-access/passes";
import { readBoundedJson } from "@/lib/request-body";
export const runtime = "nodejs";
const schema = z.object({ code: z.string().trim().regex(/^[\d\s-]{10,16}$/), replaceDeviceId: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(24).optional() }).strict();
// Brings this device online with a pass bought earlier or by someone else.
export async function POST(request: Request) {
  try {
    const input = schema.parse(await readBoundedJson(request, 2048));
    const { context, keyHash } = await passCaller(request, { rateLimited: true });
    const result = await redeemPassCode(context, { code: input.code, keyHash, replaceDeviceId: input.replaceDeviceId, label: input.label });
    return Response.json({ grantId: result.grantId }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Enter the 10-digit pass code" }, { status: 400, headers: privateHeaders });
    return passFailure(error);
  }
}
