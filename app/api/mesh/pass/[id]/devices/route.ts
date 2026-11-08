import { z } from "zod";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { passCaller, passFailure } from "@/lib/mesh-access/pass-api";
import { addDeviceByCode, PassError, removeDevice } from "@/lib/mesh-access/passes";
import { readBoundedJson } from "@/lib/request-body";
export const runtime = "nodejs";
const addSchema = z.object({ deviceCode: z.string().trim().regex(/^[\d\s-]{6,9}$/), replaceDeviceId: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(24).optional() }).strict();
const removeSchema = z.object({ deviceId: z.string().uuid() }).strict();
async function owner(request: Request, rateLimited = false) {
  const caller = await passCaller(request, { rateLimited });
  if (!caller.keyHash) throw new PassError("Open My pass on a device that uses this pass", 403);
  return caller.keyHash;
}
// Add the device showing a device code (TV, child's phone) to this pass.
export async function POST(request: Request, route: { params: Promise<{ id: string }> }) {
  try {
    const passId = z.string().uuid().parse((await route.params).id);
    const input = addSchema.parse(await readBoundedJson(request, 2048));
    const ownerKeyHash = await owner(request, true);
    const result = await addDeviceByCode({ passId, ownerKeyHash, deviceCode: input.deviceCode, replaceDeviceId: input.replaceDeviceId, label: input.label });
    return Response.json({ added: true, grantId: result.grantId }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Enter the 6-digit code shown on the other device" }, { status: 400, headers: privateHeaders });
    return passFailure(error);
  }
}
// Free a slot; that device goes offline within about a minute.
export async function DELETE(request: Request, route: { params: Promise<{ id: string }> }) {
  try {
    const passId = z.string().uuid().parse((await route.params).id);
    const input = removeSchema.parse(await readBoundedJson(request, 1024));
    await removeDevice({ passId, ownerKeyHash: await owner(request), deviceId: input.deviceId });
    return Response.json({ removed: true }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Choose a device to remove" }, { status: 400, headers: privateHeaders });
    return passFailure(error);
  }
}
