import { getTrustedMeshContext } from "./service";
import { deviceKeyHash, PassError, readDeviceKey } from "./passes";
import { consumeVoucherAttempt } from "../voucher-rate-limit";
import { privateHeaders } from "./agent-api";
import { RequestBodyError } from "../request-body";

// Customer pass requests: a router-attested Mesh session, plus this browser's
// device key when it has one. Codes share the voucher guessing limit.
export async function passCaller(request: Request, options: { rateLimited?: boolean } = {}) {
  const context = await getTrustedMeshContext(request);
  if (!context) throw new PassError("Reconnect to Mesh Wi-Fi, then open this page again", 401);
  if (options.rateLimited) {
    const attempt = await consumeVoucherAttempt(context.macAddress, request.headers);
    if (!attempt.allowed) throw new PassError("Too many attempts. Please wait and try again.", 429);
  }
  const key = readDeviceKey(request);
  return { context, keyHash: key ? deviceKeyHash(key) : null };
}
export function passFailure(error: unknown) {
  if (error instanceof RequestBodyError) return Response.json({ error: "Invalid request" }, { status: error.status, headers: privateHeaders });
  if (error instanceof PassError) return Response.json({ error: error.message, ...(error.devices ? { devices: error.devices } : {}) },
    { status: error.status, headers: privateHeaders });
  console.error("Pass request failed", error instanceof Error ? error.message : "unknown");
  return Response.json({ error: "Mesh is busy. Please try again." }, { status: 503, headers: privateHeaders });
}
