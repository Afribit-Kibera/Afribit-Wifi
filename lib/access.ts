import { addMinutes } from "./date";
import { db } from "./db";
import { accessGrants, packages, portalSessions, routerJobs } from "./db/schema";
import { eq } from "drizzle-orm";

type GrantInput = {
  portalSessionId: string;
  paymentId?: string;
  voucherId?: string;
  durationMinutes: number;
  dataLimitMb?: number | null;
  speedLimitKbps?: number | null;
};

export async function queueAccessGrant(input: GrantInput) {
  const [session] = await db
    .select()
    .from(portalSessions)
    .where(eq(portalSessions.id, input.portalSessionId))
    .limit(1);
  if (!session) throw new Error("Portal session not found");

  const startsAt = new Date();
  const expiresAt = addMinutes(startsAt, input.durationMinutes);
  const [grant] = await db
    .insert(accessGrants)
    .values({
      portalSessionId: input.portalSessionId,
      paymentId: input.paymentId,
      voucherId: input.voucherId,
      macAddress: session.macAddress,
      startsAt,
      expiresAt,
      dataLimitMb: input.dataLimitMb,
      speedLimitKbps: input.speedLimitKbps,
    })
    .returning();

  await db.insert(routerJobs).values({
    type: "grant_access",
    payload: {
      accessGrantId: grant.id,
      macAddress: session.macAddress,
      ipAddress: session.ipAddress,
      loginUrl: session.loginUrl,
      expiresAt: expiresAt.toISOString(),
      durationMinutes: input.durationMinutes,
      dataLimitMb: input.dataLimitMb ?? null,
      speedLimitKbps: input.speedLimitKbps ?? null,
    },
  });
  return grant;
}

export async function queuePaidAccess(paymentId: string, portalSessionId: string, packageId: string) {
  const [wifiPackage] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
  if (!wifiPackage) throw new Error("Package not found");
  return queueAccessGrant({
    portalSessionId,
    paymentId,
    durationMinutes: wifiPackage.durationMinutes,
    dataLimitMb: wifiPackage.dataLimitMb,
    speedLimitKbps: wifiPackage.speedLimitKbps,
  });
}

