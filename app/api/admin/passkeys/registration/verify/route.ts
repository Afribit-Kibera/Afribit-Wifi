import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createAdminSession, getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEnrollmentCodes, adminPasskeys, auditLogs } from "@/lib/db/schema";
import { assertTrustedOrigin, consumeWebAuthnChallenge, webAuthnConfig } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const response = await request.json() as RegistrationResponseJSON;
    const challenge = await consumeWebAuthnChallenge("registration");
    if (!challenge.deviceName) throw new Error("Device name is missing");
    const activePasskeys = await db.select({ id: adminPasskeys.id }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
    if (challenge.bootstrap) {
      if (activePasskeys.length) return Response.json({ error: "The first admin device has already been registered" }, { status: 409 });
    } else if (!challenge.enrollmentCodeId) {
      const session = await getAdminSession();
      if (!session || session.credentialId !== challenge.authorizedBy) return Response.json({ error: "Admin verification expired" }, { status: 401 });
    }
    const { rpID, origins } = webAuthnConfig();
    const verification = await verifyRegistrationResponse({ response, expectedChallenge: challenge.challenge, expectedOrigin: origins, expectedRPID: rpID, requireUserVerification: true });
    if (!verification.verified) return Response.json({ error: "Device registration failed" }, { status: 400 });
    if (challenge.enrollmentCodeId) {
      const claimed = await db.update(adminEnrollmentCodes).set({ usedAt: new Date() }).where(and(eq(adminEnrollmentCodes.id, challenge.enrollmentCodeId), isNull(adminEnrollmentCodes.usedAt), gt(adminEnrollmentCodes.expiresAt, new Date()))).returning({ id: adminEnrollmentCodes.id });
      if (!claimed.length) return Response.json({ error: "Pairing code is invalid or expired" }, { status: 401 });
    }
    const info = verification.registrationInfo;
    const [passkey] = await db.insert(adminPasskeys).values({
      credentialId: info.credential.id,
      publicKey: Buffer.from(info.credential.publicKey).toString("base64"),
      counter: info.credential.counter,
      transports: response.response.transports ?? [],
      deviceName: challenge.deviceName,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
      aaguid: info.aaguid,
    }).returning();
    await db.insert(auditLogs).values({ actor: challenge.bootstrap ? "bootstrap" : `passkey:${challenge.deviceName}`, action: "admin_passkey.registered", entityType: "admin_passkey", entityId: passkey.id, details: { deviceName: passkey.deviceName, deviceType: passkey.deviceType, backedUp: passkey.backedUp } });
    if (challenge.bootstrap || challenge.enrollmentCodeId) await createAdminSession(passkey.credentialId, passkey.deviceName);
    return Response.json({ verified: true, redirectTo: challenge.bootstrap || challenge.enrollmentCodeId ? "/admin" : "/admin/security" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Device registration failed" }, { status: 400 });
  }
}
