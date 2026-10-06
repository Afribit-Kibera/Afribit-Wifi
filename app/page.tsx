import { asc, eq } from "drizzle-orm";
import { packages } from "@/lib/db/schema";
import { PortalExperience } from "@/components/portal-experience";
import { getBlinkAccess, getMeshServices } from "@/lib/mesh-services";
import { getPaymentMethods } from "@/lib/payments/providers";
import { headers } from "next/headers";
import { meshAutomaticAccessEnabled } from "@/lib/mesh-access/config";
import { getTrustedMeshContext } from "@/lib/mesh-access/service";

type HomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const automaticAccess = meshAutomaticAccessEnabled();
  // These independent reads run together instead of adding two database waits
  // to the router-to-catalogue handoff. Device context remains uncached.
  const [query, trustedContext, catalogue] = await Promise.all([
    searchParams,
    (async () => {
      if (!automaticAccess) return null;
      try { return await getTrustedMeshContext(new Request("https://wifi.afribit.africa/", { headers: await headers() })); }
      catch { console.warn("Mesh device context is temporarily unavailable"); return null; }
    })(),
    (async () => {
      try {
        const { db } = await import("@/lib/db");
        return { items: await db.select().from(packages).where(eq(packages.active, true)).orderBy(asc(packages.sortOrder)), unavailable: false };
      } catch {
        console.warn("Mesh package catalogue is temporarily unavailable");
        return { items: [] as typeof packages.$inferSelect[], unavailable: true };
      }
    })(),
  ]);
  return (
    <PortalExperience
      packages={catalogue.items}
      services={getMeshServices()}
      blinkAccess={getBlinkAccess()}
      packagesUnavailable={catalogue.unavailable}
      paymentMethods={getPaymentMethods()}
      initialView={first(query.view) === "voucher" ? "voucher" : ["welcome", "explore"].includes(first(query.view) ?? "") ? "welcome" : "internet"}
      portalContext={trustedContext ? {
        macAddress: trustedContext.macAddress,
        ipAddress: trustedContext.ipAddress,
        routerId: trustedContext.routerId,
        loginUrl: trustedContext.loginUrl,
      } : automaticAccess ? { macAddress: "unknown" } : {
        macAddress: first(query.mac) ?? first(query.macAddress) ?? "unknown",
        ipAddress: first(query.ip),
        routerId: first(query.router),
        loginUrl: first(query.link_login) ?? first(query["link-login"]),
        originalUrl: first(query.link_orig) ?? first(query["link-orig"]),
      }}
    />
  );
}

