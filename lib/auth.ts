import { and, eq, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { adminPasskeys } from "./db/schema";

const COOKIE_NAME = "bv_admin_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(credentialId: string, deviceName: string) {
  const token = await new SignJWT({ role: "admin", deviceName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(credentialId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "admin" || typeof payload.sub !== "string" || typeof payload.deviceName !== "string") return null;
    const [passkey] = await db
      .select({ id: adminPasskeys.id, deviceName: adminPasskeys.deviceName })
      .from(adminPasskeys)
      .where(and(eq(adminPasskeys.credentialId, payload.sub), isNull(adminPasskeys.revokedAt)))
      .limit(1);
    if (!passkey) return null;
    return {
      credentialId: payload.sub,
      passkeyId: passkey.id,
      deviceName: passkey.deviceName,
      actor: `passkey:${passkey.deviceName}`,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
