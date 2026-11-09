import { requireAdmin } from "@/lib/auth";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { PackagePlus, Power, Save } from "lucide-react";
import { createPackageAction, togglePackageAction, updatePackageAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { packages } from "@/lib/db/schema";

type Package = typeof packages.$inferSelect;
const mbps = (kbps: number | null) => kbps ? `${kbps / 1000} Mbps` : "2 Mbps (default)";
const select = "h-10 w-full rounded-md border border-[var(--line)] bg-transparent px-3 text-sm";

// One set of fields for adding and editing. Ids are prefixed so several forms can share a page.
function PackageFields({ item }: { item?: Package }) {
  const id = (name: string) => `${item?.id ?? "new"}-${name}`;
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
    <div><label className="field-label" htmlFor={id("name")}>Plan name</label><Input id={id("name")} name="name" defaultValue={item?.name} required /></div>
    <div><label className="field-label" htmlFor={id("priceKes")}>Price (KES)</label><Input id={id("priceKes")} name="priceKes" type="number" min="0" defaultValue={item?.priceKes} required /></div>
    <div><label className="field-label" htmlFor={id("priceSats")}>Lightning equivalent (sats)</label><Input id={id("priceSats")} name="priceSats" type="number" min="1" defaultValue={item?.priceSats} required /></div>
    <div><label className="field-label" htmlFor={id("durationMinutes")}>Time (minutes)</label><Input id={id("durationMinutes")} name="durationMinutes" type="number" min="5" defaultValue={item?.durationMinutes} required /></div>
    <div><label className="field-label" htmlFor={id("speedMbps")}>Speed (Mbps)</label><Input id={id("speedMbps")} name="speedMbps" type="number" min="0.5" max="100" step="0.5" placeholder="2" defaultValue={item?.speedLimitKbps ? item.speedLimitKbps / 1000 : undefined} /></div>
    <div><label className="field-label" htmlFor={id("dataLimitMb")}>Data cap (MB)</label><Input id={id("dataLimitMb")} name="dataLimitMb" type="number" min="1" defaultValue={item?.dataLimitMb ?? undefined} /></div>
    <div><label className="field-label" htmlFor={id("kind")}>Plan type</label><select id={id("kind")} name="kind" defaultValue={item?.kind ?? "personal"} className={select}><option value="personal">Personal (one phone)</option><option value="household">Household (several devices)</option><option value="tv">TV (one TV)</option></select></div>
    <div><label className="field-label" htmlFor={id("deviceLimit")}>Devices (household)</label><Input id={id("deviceLimit")} name="deviceLimit" type="number" min="1" max="10" defaultValue={item?.deviceLimit ?? 1} /></div>
    <div><label className="field-label" htmlFor={id("sortOrder")}>Display order</label><Input id={id("sortOrder")} name="sortOrder" type="number" min="0" defaultValue={item?.sortOrder ?? 50} required /></div>
    <div className="md:col-span-2 xl:col-span-3"><label className="field-label" htmlFor={id("description")}>Description</label><Textarea id={id("description")} name="description" className="min-h-10" defaultValue={item?.description ?? ""} /></div>
  </div>;
}
import { formatDuration, formatKes, formatSats } from "@/lib/utils";

export default async function PackagesPage() {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  const records = await db.select().from(packages).orderBy(asc(packages.sortOrder));
  return (
    <>
      <PageHeading eyebrow="Commercial settings" title="WiFi packages" description="Plans shown on the Mesh page. Changing a speed, price or time applies to passes bought from now on; live passes keep what they were sold with." />
      <form action={createPackageAction} className="panel p-5 md:p-6">
        <PackageFields />
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
                  <td><strong>{item.name}</strong>{item.kind !== "personal" ? <span className="ml-2"><Badge tone="neutral">{item.kind === "tv" ? "TV" : `Household · ${item.deviceLimit} devices`}</Badge></span> : null}<span className="mt-1 block max-w-sm text-xs text-[var(--muted)]">{item.description}</span></td>
                  <td><strong>{formatKes(item.priceKes)}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{formatSats(item.priceSats)}</span></td>
                  <td>{formatDuration(item.durationMinutes)}</td>
                  <td className="text-[var(--muted)]">{mbps(item.speedLimitKbps)}{item.dataLimitMb ? ` · ${item.dataLimitMb} MB` : ""}</td>
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
      <section className="mt-6 grid gap-4">
        <h2 className="text-sm font-bold">Edit a package</h2>
        {records.map(item => <details key={item.id} className="panel">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">{item.name} <span className="font-normal text-[var(--muted)]">· {formatKes(item.priceKes)} · {formatDuration(item.durationMinutes)} · {mbps(item.speedLimitKbps)}</span></summary>
          <form action={updatePackageAction} className="border-t border-[var(--line)] p-5">
            <input type="hidden" name="id" value={item.id} />
            <PackageFields item={item} />
            <div className="mt-6 flex justify-end"><Button type="submit"><Save size={17} /> Save changes</Button></div>
          </form>
        </details>)}
      </section>
    </>
  );
}
