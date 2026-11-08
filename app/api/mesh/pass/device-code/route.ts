import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { passCaller, passFailure } from "@/lib/mesh-access/pass-api";
import { createDeviceCode } from "@/lib/mesh-access/passes";
export const runtime = "nodejs";
// A short code this device shows so another phone can pay for it or add it.
export async function POST(request: Request) {
  try {
    const { context } = await passCaller(request);
    return Response.json(await createDeviceCode(context), { headers: privateHeaders });
  } catch (error) { return passFailure(error); }
}
