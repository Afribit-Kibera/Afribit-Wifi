import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { deviceCodeQr } from "@/lib/mesh-access/device-code-qr";
import { passCaller, passFailure } from "@/lib/mesh-access/pass-api";
import { createDeviceCode, deviceOnline } from "@/lib/mesh-access/passes";
export const runtime = "nodejs";
// A short code this device shows so another phone can pay for it or add it.
// The QR opens Mesh on the payer's phone with the code filled in.
export async function POST(request: Request) {
  try {
    const { context } = await passCaller(request);
    const code = await createDeviceCode(context);
    return Response.json({ ...code, qrSvg: await deviceCodeQr(code.code) }, { headers: privateHeaders });
  } catch (error) { return passFailure(error); }
}

// Whether someone has paid for this device and the router switched it on.
// The TV screen asks every few seconds while it shows its code.
export async function GET(request: Request) {
  try {
    const { context } = await passCaller(request);
    return Response.json(await deviceOnline(context), { headers: privateHeaders });
  } catch (error) { return passFailure(error); }
}
