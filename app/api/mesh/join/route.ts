import { NextResponse } from "next/server";
import { consumeMeshJoin } from "@/lib/mesh-access/service";
import { meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { meshCookieName } from "@/lib/mesh-access/security";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ticket = params.get("ticket") ?? "", session = params.get("session") ?? "";
  if (!meshAutomaticAccessReady() || !await consumeMeshJoin(ticket, session)) return Response.json({ error: "Reconnect to Mesh to open checkout" }, { status: 403, headers: privateHeaders });
  const view = params.get("view") === "voucher" ? "voucher" : "internet";
  const response = NextResponse.redirect(`https://wifi.afribit.africa/?view=${view}`, 303);
  response.cookies.set(meshCookieName, session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 32 * 86_400 });
  for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
  return response;
}
