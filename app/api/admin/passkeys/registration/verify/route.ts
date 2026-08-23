import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { MAX_ADMIN_DEVICES, isAdminDeviceSlot } from "@/lib/admin-devices";
import { createAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEnrollmentCodes, adminPasskeys, auditLogs } from "@/lib/db/schema";
import { assertTrustedOrigin, consumeWebAuthnChallenge, webAuthnConfig } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const response = await request.json() as RegistrationResponseJSON;
    const challenge = await consumeWebAuthnChallenge("registration");
    if (!challenge.deviceName || !challenge.enrollmentCodeId || !challenge.deviceSlot || !isAdminDeviceSlot(challenge.deviceSlot)) throw new Error("Device authorization is missing");
    const activePasskeys = await db.select({ id: adminPasskeys.id }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
    if (activePasskeys.length >= MAX_ADMIN_DEVICES) return Response.json({ error: "All admin device slots are already assigned" }, { status: 409 });
    const occupiedSlot = await db.select({ id: adminPasskeys.id }).from(adminPasskeys).where(and(eq(adminPasskeys.slot, challenge.deviceSlot), isNull(adminPasskeys.revokedAt))).limit(1);
    if (occupiedSlot.length) return Response.json({ error: "This admin device slot is already assigned" }, { status: 409 });
    const { rpID, origins } = webAuthnConfig();
    const verification = await verifyRegistrationResponse({ response, expectedChallenge: challenge.challenge, expectedOrigin: origins, expectedRPID: rpID, requireUserVerification: true });
    if (!verification.verified) return Response.json({ error: "Device registration failed" }, { status: 400 });
    const claimed = await db.update(adminEnrollmentCodes).set({ usedAt: new Date() }).where(and(eq(adminEnrollmentCodes.id, challenge.enrollmentCodeId), eq(adminEnrollmentCodes.slot, challenge.deviceSlot), isNull(adminEnrollmentCodes.usedAt), gt(adminEnrollmentCodes.expiresAt, new Date()))).returning({ id: adminEnrollmentCodes.id });
    if (!claimed.length) return Response.json({ error: "Pairing code is invalid or expired" }, { status: 401 });
    const info = verification.registrationInfo;
    const [passkey] = await db.insert(adminPasskeys).values({
      credentialId: info.credential.id,
      slot: challenge.deviceSlot,
      publicKey: Buffer.from(info.credential.publicKey).toString("base64"),
      counter: info.credential.counter,
      transports: response.response.transports ?? [],
      deviceName: challenge.deviceName,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      aaguid: info.aaguid,
    }).returning();
    await db.insert(auditLogs).values({ actor: `provisioned-slot:${challenge.deviceSlot}`, action: "admin_passkey.registered", entityType: "admin_passkey", entityId: passkey.id, details: { slot: passkey.slot, deviceName: passkey.deviceName, deviceType: passkey.deviceType, backedUp: passkey.backedUp } });
    await createAdminSession(passkey.credentialId, passkey.deviceName);
    return Response.json({ verified: true, redirectTo: "/admin" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Device registration failed" }, { status: 400 });
  }
}
