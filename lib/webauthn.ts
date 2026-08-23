import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const CHALLENGE_COOKIE = "bv_admin_webauthn";

export type WebAuthnPurpose = "authentication" | "registration";

type ChallengePayload = {
  purpose: WebAuthnPurpose;
  challenge: string;
  deviceName?: string;
  deviceSlot?: number;
  enrollmentCodeId?: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export function webAuthnConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID ?? (process.env.NODE_ENV === "production" ? "wifi.afribit.africa" : "localhost");
  const configuredOrigins = (process.env.WEBAUTHN_ORIGINS ?? process.env.WEBAUTHN_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const fallbackOrigin = process.env.NODE_ENV === "production" ? "https://wifi.afribit.africa" : "http://localhost:3000";
  return { rpID, origins: configuredOrigins.length ? configuredOrigins : [fallbackOrigin] };
}

export function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (!origin) throw new Error("Request origin is missing");
  const { origins } = webAuthnConfig();
  if (process.env.NODE_ENV !== "production" && new URL(origin).hostname === "localhost") return;
  if (!origins.includes(origin)) throw new Error("Request origin is not allowed");
}

export async function setWebAuthnChallenge(payload: ChallengePayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secretKey());
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/passkeys",
    maxAge: 60 * 5,
  });
}

export async function consumeWebAuthnChallenge(expectedPurpose: WebAuthnPurpose) {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  store.delete(CHALLENGE_COOKIE);
  if (!token) throw new Error("The security request expired. Please try again.");
  const { payload } = await jwtVerify(token, secretKey());
  if (payload.purpose !== expectedPurpose || typeof payload.challenge !== "string") throw new Error("Invalid security request");
  return payload as typeof payload & ChallengePayload;
}

export function hashEnrollmentCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
