import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { and, eq, isNull } from "drizzle-orm";
import { createAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys, auditLogs } from "@/lib/db/schema";
import { assertTrustedOrigin, consumeWebAuthnChallenge, webAuthnConfig } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const response = await request.json() as AuthenticationResponseJSON;
    const challenge = await consumeWebAuthnChallenge("authentication");
    const [passkey] = await db.select().from(adminPasskeys).where(and(eq(adminPasskeys.credentialId, response.id), isNull(adminPasskeys.revokedAt))).limit(1);
    if (!passkey) return Response.json({ error: "This device is not approved" }, { status: 401 });
    const { rpID, origins } = webAuthnConfig();
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origins,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64")),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    });
    if (!verification.verified) return Response.json({ error: "Device verification failed" }, { status: 401 });
    await db.update(adminPasskeys).set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date(), backedUp: verification.authenticationInfo.credentialBackedUp }).where(eq(adminPasskeys.id, passkey.id));
    await createAdminSession(passkey.credentialId, passkey.deviceName);
    await db.insert(auditLogs).values({ actor: `passkey:${passkey.deviceName}`, action: "admin.signed_in", entityType: "admin_passkey", entityId: passkey.id });
    return Response.json({ verified: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Device verification failed" }, { status: 400 });
  }
}
