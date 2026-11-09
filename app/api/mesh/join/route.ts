import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meshAccessContexts } from "@/lib/db/schema";
import { consumeMeshJoin } from "@/lib/mesh-access/service";
import { meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { meshCookieName } from "@/lib/mesh-access/security";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { deviceKeyHash, meshDeviceCookieName, newDeviceKey, readDeviceKey, restoreDevicePass } from "@/lib/mesh-access/passes";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ticket = params.get("ticket") ?? "", session = params.get("session") ?? "";
  if (!meshAutomaticAccessReady() || !await consumeMeshJoin(ticket, session)) return Response.json({ error: "Reconnect to Mesh to open checkout" }, { status: 403, headers: privateHeaders });
  // A long-lived key for this browser, so a pass follows the phone when its
  // Wi-Fi address changes. It never leaves the cookie in plaintext.
  const deviceKey = readDeviceKey(request) ?? newDeviceKey(), keyHash = deviceKeyHash(deviceKey);
  const contextId = session.split(".")[0];
  let destination: string;
  const requested = params.get("view");
  const view = requested === "voucher" ? "voucher" : requested === "free" || requested === "explore" ? "free" : "internet";
  try {
    const [context] = await db.update(meshAccessContexts).set({ deviceKeyHash: keyHash })
      .where(and(eq(meshAccessContexts.id, contextId))).returning();
    // Someone who already paid goes straight back online; no second purchase.
    const restored = context ? await restoreDevicePass(context, keyHash) : null;
    destination = restored ? `/connected?grant=${restored.grantId}${restored.restored ? "&restored=1" : ""}` : `/?view=${view}`;
  } catch (error) {
    console.error("Pass restore deferred", error instanceof Error ? error.message : "unknown");
    destination = `/?view=${view}`;
  }
  const response = NextResponse.redirect(`https://wifi.afribit.africa${destination}`, 303);
  response.cookies.set(meshCookieName, session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 32 * 86_400 });
  response.cookies.set(meshDeviceCookieName, deviceKey, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 400 * 86_400 });
  for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
  return response;
}
