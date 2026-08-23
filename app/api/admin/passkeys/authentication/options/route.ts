import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminPasskeys } from "@/lib/db/schema";
import { setWebAuthnChallenge, webAuthnConfig } from "@/lib/webauthn";

export async function GET() {
  const passkeys = await db.select().from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  if (!passkeys.length) return Response.json({ error: "No admin devices are registered" }, { status: 409 });
  const { rpID } = webAuthnConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: passkeys.map((passkey) => ({ id: passkey.credentialId, transports: passkey.transports as never })),
  });
  await setWebAuthnChallenge({ purpose: "authentication", challenge: options.challenge });
  return Response.json(options, { headers: { "Cache-Control": "no-store" } });
}
