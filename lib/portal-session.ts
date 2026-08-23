import { db } from "./db";
import { portalSessions } from "./db/schema";

export type PortalSessionInput = {
  macAddress: string;
  ipAddress?: string;
  routerId?: string;
  loginUrl?: string;
  originalUrl?: string;
  userAgent?: string | null;
};

export async function createPortalSession(input: PortalSessionInput) {
  const [session] = await db
    .insert(portalSessions)
    .values({
      macAddress: input.macAddress.trim().toUpperCase(),
      ipAddress: input.ipAddress,
      routerId: input.routerId,
      loginUrl: input.loginUrl,
      originalUrl: input.originalUrl,
      userAgent: input.userAgent,
    })
    .returning();
  return session;
}

