import { count, isNull, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys } from "@/lib/db/schema";
import { getBitikaReadiness } from "@/lib/payments/bitika";
import { getPaystackReadiness } from "@/lib/payments/paystack";
import { meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { inspectMeshRuntime, evaluateMeshReadiness } from "@/lib/production/runtime-readiness";

const isConfigured = (name: string) => {
  const value = process.env[name];
  return Boolean(value && !value.startsWith("UNCONFIGURED_"));
};

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [snapshot, adminDeviceCount] = await Promise.all([
      inspectMeshRuntime(async statement => (await db.execute(sql.raw(statement))).rows),
      db.select({ value: count() }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt)),
    ]);
    const paystack = getPaystackReadiness();
    const readiness = evaluateMeshReadiness(snapshot, {
      automaticConfigured: meshAutomaticAccessReady(), checkoutConfigured: paystack.checkoutReady,
    });
    return Response.json({
      status: readiness.field.status, ...readiness,
      database: { status: "ok", schema: snapshot.schema },
      authentication: { approvedAdminDevices: adminDeviceCount[0].value },
      payments: { paystack, unresolved: snapshot.payments,
        btcpay: { configured: ["BTCPAY_SERVER_URL", "BTCPAY_STORE_ID", "BTCPAY_API_KEY", "BTCPAY_WEBHOOK_SECRET"].every(isConfigured) },
        bitika: getBitikaReadiness() },
      catalog: snapshot.catalogue,
      network: { controlPlaneVersion: "native-signed-lab-enrollment", gateways: snapshot.gateways,
        multiSiteEnrollmentAvailable: false, orders: snapshot.orders },
      blockers: readiness.field.blockers.map(code => ({ code, severity: "blocker" })),
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "not_ready", error: "Production readiness could not be verified" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
