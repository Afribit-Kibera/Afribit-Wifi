import { requireAdmin } from "@/lib/auth";
import { connection } from "next/server";
import { Megaphone, Save } from "lucide-react";
import { saveMeshNoticeAction, savePaymentSettingsAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lightningReady } from "@/lib/payments/lightning";
import { readPaymentSettings } from "@/lib/settings";
import { readMeshNotice } from "@/lib/mesh-notice";

export default async function SettingsPage() {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  const [settings, notice, liveNotice] = await Promise.all([readPaymentSettings(), readMeshNotice(true), readMeshNotice()]);
  const noticeLive = Boolean(liveNotice);
  const walletReady = lightningReady();
  return (
    <>
      <PageHeading eyebrow="Payments" title="Settings" description="Changes apply to new purchases right away. Payments already started keep their price." />
      <form action={savePaymentSettingsAction} className="panel max-w-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Bitcoin payments</h2>
          <Badge tone={walletReady ? "success" : "danger"}>{walletReady ? "Blink wallet connected" : "Blink wallet not configured"}</Badge>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">Customers pay a Lightning invoice straight into the Afribit Blink wallet, priced in sats at the live rate.</p>
        <label className="mt-5 flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="bitcoinEnabled" defaultChecked={settings.bitcoinEnabled} className="size-4" /> Offer Bitcoin at checkout
        </label>
        <div className="mt-5 max-w-xs">
          <label className="field-label" htmlFor="bitcoinDiscountPercent">Bitcoin discount (%)</label>
          <Input id="bitcoinDiscountPercent" name="bitcoinDiscountPercent" type="number" min="0" max="50" step="0.5" defaultValue={settings.bitcoinDiscountPercent} required />
          <p className="mt-2 text-xs text-[var(--muted)]">Taken off the KES price when paying with Bitcoin. Example: KES 100 at {settings.bitcoinDiscountPercent}% is KES {Math.max(1, Math.floor(100 * (100 - settings.bitcoinDiscountPercent) / 100))}.</p>
        </div>
        <div className="mt-6 flex justify-end"><Button type="submit"><Save size={17} /> Save settings</Button></div>
      </form>
      <form action={saveMeshNoticeAction} className="panel mt-6 max-w-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Megaphone size={16} /> Notice to customers</h2>
          <Badge tone={noticeLive ? "success" : "neutral"}>{noticeLive ? (notice?.endsAt ? `Showing until ${new Date(notice.endsAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Showing") : notice ? "Ended" : "Off"}</Badge>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">Shown at the top of every Mesh page and sent to the Mesh app. People see it the next time they open Mesh; it is not pushed to phones. Leave the message empty and save to remove it.</p>
        <div className="mt-5"><label className="field-label" htmlFor="notice-message">Message</label>
          <textarea id="notice-message" name="message" maxLength={240} rows={3} defaultValue={notice?.message ?? ""} placeholder="Example: Internet is slow tonight while we fix the link. Passes will get extra time." className="w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm" /></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="notice-tone">Style</label>
            <select id="notice-tone" name="tone" defaultValue={notice?.tone ?? "info"} className="h-10 w-full rounded-md border border-[var(--line)] bg-transparent px-3 text-sm"><option value="info">News (green)</option><option value="warning">Problem or warning (amber)</option></select></div>
          <div><label className="field-label" htmlFor="notice-hours">Show for (hours)</label>
            <Input id="notice-hours" name="hours" type="number" min="0.25" max="720" step="0.25" defaultValue="24" placeholder="Until removed" />
            <p className="mt-2 text-xs text-[var(--muted)]">Empty keeps it up until you remove it.</p></div>
        </div>
        <div className="mt-6 flex justify-end"><Button type="submit"><Save size={17} /> Save notice</Button></div>
      </form>
    </>
  );
}
