import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { packages } from "@/lib/db/schema";
import { getTrustedMeshContext } from "@/lib/mesh-access/service";
import { meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { internetStatus } from "@/lib/mesh-access/uplink";
import { getPaymentMethods } from "@/lib/payments/providers";
import { bitcoinPriceKes, readPaymentSettings } from "@/lib/settings";
export const runtime = "nodejs";

// The passes on sale, for the Afribit app's Connect tab: the same catalogue and
// payment methods the welcome page shows this device. The app then buys through
// POST /api/payments with its session and device headers.
export async function GET(request: Request) {
  if (!meshAutomaticAccessReady()) return Response.json({ error: "Passes can't be bought in the app just now." }, { status: 503, headers: privateHeaders });
  const context = await getTrustedMeshContext(request);
  if (!context) return Response.json({ error: "Reconnect to Mesh Wi-Fi, then open Afribit from the welcome page again." }, { status: 401, headers: privateHeaders });
  const [items, settings] = await Promise.all([
    db.select().from(packages).where(eq(packages.active, true)).orderBy(asc(packages.sortOrder)),
    readPaymentSettings(),
  ]);
  // No internet line, nothing to sell, exactly like the welcome page.
  const methods = internetStatus().online ? getPaymentMethods(settings) : [];
  const bitcoinEnabled = methods.some(method => method.id === "lightning");
  const mpesaEnabled = methods.some(method => method.currency === "KES");
  return Response.json({
    packages: items.map(item => ({
      id: item.id, name: item.name, description: item.description ?? null, priceKes: item.priceKes,
      durationMinutes: item.durationMinutes, dataLimitMb: item.dataLimitMb ?? null, kind: item.kind, deviceLimit: item.deviceLimit,
      bitcoinKes: bitcoinEnabled && item.priceKes > 0 ? bitcoinPriceKes(item.priceKes, settings.bitcoinDiscountPercent).amountKes : null,
    })),
    bitcoinEnabled, mpesaEnabled,
  }, { headers: privateHeaders });
}
