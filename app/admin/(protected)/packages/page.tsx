import { asc } from "drizzle-orm";
import { PackagePlus, Power } from "lucide-react";
import { createPackageAction, togglePackageAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { packages } from "@/lib/db/schema";
import { formatDuration, formatKes, formatSats } from "@/lib/utils";

export default async function PackagesPage() {
  const records = await db.select().from(packages).orderBy(asc(packages.sortOrder));
  return (
    <>
      <PageHeading eyebrow="Commercial settings" title="WiFi packages" description="Plans shown on the captive portal and available as voucher defaults." />
      <form action={createPackageAction} className="panel p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="field-label" htmlFor="name">Plan name</label><Input id="name" name="name" required /></div>
          <div><label className="field-label" htmlFor="priceKes">Price (KES)</label><Input id="priceKes" name="priceKes" type="number" min="0" required /></div>
          <div><label className="field-label" htmlFor="priceSats">Lightning equivalent (sats)</label><Input id="priceSats" name="priceSats" type="number" min="1" required /></div>
          <div><label className="field-label" htmlFor="durationMinutes">Time (minutes)</label><Input id="durationMinutes" name="durationMinutes" type="number" min="5" required /></div>
          <div><label className="field-label" htmlFor="sortOrder">Display order</label><Input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="50" required /></div>
          <div><label className="field-label" htmlFor="speedLimitKbps">Speed cap (Kbps)</label><Input id="speedLimitKbps" name="speedLimitKbps" type="number" min="1" /></div>
          <div><label className="field-label" htmlFor="dataLimitMb">Data cap (MB)</label><Input id="dataLimitMb" name="dataLimitMb" type="number" min="1" /></div>
          <div className="md:col-span-2"><label className="field-label" htmlFor="description">Description</label><Textarea id="description" name="description" className="min-h-10" /></div>
        </div>
        <div className="mt-6 flex justify-end"><Button type="submit"><PackagePlus size={17} /> Add package</Button></div>
      </form>
      <section className="panel mt-6">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Plan</th><th>Price</th><th>Access</th><th>Limits</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {records.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><span className="mt-1 block max-w-sm text-xs text-[var(--muted)]">{item.description}</span></td>
                  <td><strong>{formatKes(item.priceKes)}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{formatSats(item.priceSats)}</span></td>
                  <td>{formatDuration(item.durationMinutes)}</td>
                  <td className="text-[var(--muted)]">{item.speedLimitKbps ? `${item.speedLimitKbps / 1000} Mbps` : "No speed cap"}{item.dataLimitMb ? ` - ${item.dataLimitMb} MB` : ""}</td>
                  <td><Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Hidden"}</Badge></td>
                  <td>
                    <form action={togglePackageAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="active" value={String(item.active)} />
                      <Button type="submit" variant="ghost" size="icon" title={item.active ? "Hide package" : "Activate package"}><Power size={16} /></Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
