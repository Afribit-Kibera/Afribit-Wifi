import { connection } from "next/server";
import { Save } from "lucide-react";
import { savePaymentSettingsAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lightningReady } from "@/lib/payments/lightning";
import { readPaymentSettings } from "@/lib/settings";

export default async function SettingsPage() {
  await connection(); // Admin data is per request; never read the database at build time.
  const settings = await readPaymentSettings();
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
    </>
  );
}
