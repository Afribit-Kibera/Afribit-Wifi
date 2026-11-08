import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { passCaller, passFailure } from "@/lib/mesh-access/pass-api";
import { passesForDevice, PassError } from "@/lib/mesh-access/passes";
export const runtime = "nodejs";
// "My pass": passes this device uses or bought for another device.
export async function GET(request: Request) {
  try {
    const { keyHash } = await passCaller(request);
    if (!keyHash) throw new PassError("Open Mesh from the Wi-Fi sign-in page first", 401);
    return Response.json({ passes: await passesForDevice(keyHash) }, { headers: privateHeaders });
  } catch (error) { return passFailure(error); }
}
