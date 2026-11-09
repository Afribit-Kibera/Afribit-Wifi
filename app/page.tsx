import { asc, eq } from "drizzle-orm";
import { packages } from "@/lib/db/schema";
import { PortalExperience } from "@/components/portal-experience";
import { getPaymentMethods } from "@/lib/payments/providers";
import { readPaymentSettings } from "@/lib/settings";
import { customerNotice } from "@/lib/mesh-notice";
import { internetStatus } from "@/lib/mesh-access/uplink";
import { headers } from "next/headers";
import { meshAutomaticAccessEnabled } from "@/lib/mesh-access/config";
import { getTrustedMeshContext } from "@/lib/mesh-access/service";
import { createDeviceCode, deviceOnline, recentlyEndedPass } from "@/lib/mesh-access/passes";
import { deviceCodeQr } from "@/lib/mesh-access/device-code-qr";
import { isTvBrowser } from "@/lib/mesh-access/tv";

type HomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const automaticAccess = meshAutomaticAccessEnabled();
  // These independent reads run together instead of adding two database waits
  // to the router-to-catalogue handoff. Device context remains uncached.
  const [query, trustedContext, catalogue, paymentSettings, notice] = await Promise.all([
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
    readPaymentSettings(),
    customerNotice(),
  ]);
  // A device whose pass just ran out is told so, instead of seeing a plain shop.
  let ended = null;
  if (trustedContext) {
    try { ended = await recentlyEndedPass(trustedContext); } catch { ended = null; }
  }
  const endedPass = ended ? {
    name: ended.packageName || { personal: "Mesh", household: "Household", tv: "TV" }[ended.kind] || "Mesh",
    endedAt: ended.endedAtLabel,
    early: ended.early,
  } : null;
  const initialCode = /^(\d{6}|\d{10})$/.test(first(query.code) ?? "") ? first(query.code) : undefined;
  const initialView = first(query.view) === "voucher" || initialCode ? "voucher" : ["free", "explore"].includes(first(query.view) ?? "") ? "free" : "internet";
  // A smart TV starts on its own code screen, made here so it shows even when
  // the TV's browser is slow to run the page's scripts.
  let tv = null;
  if (trustedContext && initialView === "internet" && isTvBrowser((await headers()).get("user-agent"))) {
    try {
      const online = await deviceOnline(trustedContext);
      if (online.online) tv = { code: null, onlineUntil: online.expiresAt };
      else {
        const code = await createDeviceCode(trustedContext);
        tv = { code: { ...code, qrSvg: await deviceCodeQr(code.code) }, onlineUntil: null };
      }
    } catch { tv = null; }
  }
  return (
    <PortalExperience
      endedPass={endedPass}
      initialCode={initialCode}
      tv={tv}
      packages={catalogue.items}
      packagesUnavailable={catalogue.unavailable}
      // No internet line, nothing to sell: the pass list shows "Payments are paused".
      paymentMethods={internetStatus().online ? getPaymentMethods(paymentSettings) : []}
      notice={notice ? { message: notice.message, tone: notice.tone } : null}
      initialView={initialView}
      initialDevice={/^\d{6}$/.test(first(query.device) ?? "") ? first(query.device) : undefined}
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

