import { generateRegistrationOptions } from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEnrollmentCodes, adminPasskeys } from "@/lib/db/schema";
import { assertTrustedOrigin, hashEnrollmentCode, setWebAuthnChallenge, verifyEnrollmentCode, webAuthnConfig } from "@/lib/webauthn";

const inputSchema = z.object({ deviceName: z.string().trim().min(2).max(80), enrollmentCode: z.string().optional() });

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const input = inputSchema.parse(await request.json());
    const session = await getAdminSession();
    const passkeys = await db.select().from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
    const bootstrap = passkeys.length === 0;
    if (bootstrap && !verifyEnrollmentCode(input.enrollmentCode ?? "")) return Response.json({ error: "Enrollment code is incorrect" }, { status: 401 });
    const [enrollmentCode] = !bootstrap && !session && input.enrollmentCode
      ? await db.select().from(adminEnrollmentCodes).where(and(eq(adminEnrollmentCodes.codeHash, hashEnrollmentCode(input.enrollmentCode)), isNull(adminEnrollmentCodes.usedAt), gt(adminEnrollmentCodes.expiresAt, new Date()))).limit(1)
      : [];
    if (!bootstrap && !session && !enrollmentCode) return Response.json({ error: "Pairing code is invalid or expired" }, { status: 401 });
    const { rpID } = webAuthnConfig();
    const options = await generateRegistrationOptions({
      rpName: "Bitcoin Valley WiFi",
      rpID,
      userName: "bitcoin-valley-admin",
      userID: new TextEncoder().encode("bitcoin-valley-admin"),
      userDisplayName: "Bitcoin Valley WiFi Admin",
      attestationType: "none",
      excludeCredentials: passkeys.map((passkey) => ({ id: passkey.credentialId, transports: passkey.transports as never })),
      authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" },
      preferredAuthenticatorType: "localDevice",
    });
    await setWebAuthnChallenge({ purpose: "registration", challenge: options.challenge, deviceName: input.deviceName, bootstrap, authorizedBy: session?.credentialId, enrollmentCodeId: enrollmentCode?.id });
    return Response.json(options, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to register device" }, { status: 400 });
  }
}
