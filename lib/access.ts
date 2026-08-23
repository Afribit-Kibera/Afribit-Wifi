import { addMinutes } from "./date";
import { db } from "./db";
import { accessGrants, packages, portalSessions, routerJobs } from "./db/schema";
import { and, eq, gte } from "drizzle-orm";

type GrantInput = {
  portalSessionId: string;
  paymentId?: string;
  voucherId?: string;
  durationMinutes: number;
  dataLimitMb?: number | null;
  speedLimitKbps?: number | null;
  purpose?: "paid" | "voucher" | "manual" | "payment_bootstrap";
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
      purpose: input.purpose ?? "paid",
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
      purpose: input.purpose ?? "paid",
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
    purpose: "paid",
  });
}

export async function queuePaymentBootstrap(portalSessionId: string) {
  if (process.env.PAYMENT_BOOTSTRAP_ENABLED === "false") return null;
  const [session] = await db.select().from(portalSessions).where(eq(portalSessions.id, portalSessionId)).limit(1);
  if (!session || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(session.macAddress)) return null;

  const cooldownHours = Number(process.env.PAYMENT_BOOTSTRAP_COOLDOWN_HOURS ?? 12);
  const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
  const [recent] = await db
    .select({ id: accessGrants.id })
    .from(accessGrants)
    .where(and(eq(accessGrants.macAddress, session.macAddress), eq(accessGrants.purpose, "payment_bootstrap"), gte(accessGrants.createdAt, cutoff)))
    .limit(1);
  if (recent) return null;

  return queueAccessGrant({
    portalSessionId,
    durationMinutes: Number(process.env.PAYMENT_BOOTSTRAP_MINUTES ?? 3),
    speedLimitKbps: Number(process.env.PAYMENT_BOOTSTRAP_SPEED_KBPS ?? 128),
    purpose: "payment_bootstrap",
  });
}
