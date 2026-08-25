import { generateRegistrationOptions } from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { MAX_ADMIN_DEVICES, isAdminDeviceSlot } from "@/lib/admin-devices";
import { db } from "@/lib/db";
import { adminEnrollmentCodes, adminPasskeys } from "@/lib/db/schema";
import { assertTrustedOrigin, hashEnrollmentCode, setWebAuthnChallenge, webAuthnConfig } from "@/lib/webauthn";

const inputSchema = z.object({ enrollmentCode: z.string().trim().min(8).max(120) });

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const input = inputSchema.parse(await request.json());
    const passkeys = await db.select().from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
    if (passkeys.length >= MAX_ADMIN_DEVICES) return Response.json({ error: "All admin device slots are already assigned" }, { status: 409 });
    const [enrollmentCode] = await db.select().from(adminEnrollmentCodes).where(and(eq(adminEnrollmentCodes.codeHash, hashEnrollmentCode(input.enrollmentCode)), isNull(adminEnrollmentCodes.usedAt), gt(adminEnrollmentCodes.expiresAt, new Date()))).limit(1);
    if (!enrollmentCode || !isAdminDeviceSlot(enrollmentCode.slot)) return Response.json({ error: "Pairing code is invalid or expired" }, { status: 401 });
    if (passkeys.some((passkey) => passkey.slot === enrollmentCode.slot)) return Response.json({ error: "This admin device slot is already assigned" }, { status: 409 });
    const { rpID } = webAuthnConfig();
    const options = await generateRegistrationOptions({
      rpName: "3 West Satenet WiFi",
      rpID,
      userName: "3-west-satenet-admin",
      userID: new TextEncoder().encode("3-west-satenet-admin"),
      userDisplayName: "3 West Satenet WiFi Admin",
      attestationType: "none",
      excludeCredentials: passkeys.map((passkey) => ({ id: passkey.credentialId, transports: passkey.transports as never })),
      authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" },
      preferredAuthenticatorType: "localDevice",
    });
    await setWebAuthnChallenge({ purpose: "registration", challenge: options.challenge, deviceName: enrollmentCode.deviceName, deviceSlot: enrollmentCode.slot, enrollmentCodeId: enrollmentCode.id });
    return Response.json(options, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to register device" }, { status: 400 });
  }
}
