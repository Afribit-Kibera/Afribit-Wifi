import { asc } from "drizzle-orm";
import { Globe2, Power, ShieldCheck } from "lucide-react";
import { addWhitelistSiteAction, toggleWhitelistSiteAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/db";
import { whitelistedSites } from "@/lib/db/schema";

export default async function WhitelistPage() {
  const sites = await db.select().from(whitelistedSites).orderBy(asc(whitelistedSites.category), asc(whitelistedSites.hostname));
  return (
    <>
      <PageHeading eyebrow="Walled garden" title="Free-site access" description="Domains customers may open before payment. Each change queues a MikroTik policy sync." />
      <form action={addWhitelistSiteAction} className="panel p-5 md:p-6"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><div><label className="field-label" htmlFor="hostname">Domain</label><Input id="hostname" name="hostname" placeholder="example.org" required /></div><div><label className="field-label" htmlFor="category">Category</label><Select id="category" name="category" defaultValue="public-service"><option value="public-service">Public service</option><option value="education">Education</option><option value="payment">Payment</option><option value="portal">Portal</option><option value="community">Community</option></Select></div><div><label className="field-label" htmlFor="notes">Notes</label><Input id="notes" name="notes" /></div><label className="mt-7 flex h-10 items-center gap-3 text-sm text-[var(--muted)]"><input name="includeSubdomains" type="checkbox" defaultChecked className="size-4 accent-[var(--orange)]" /> Include subdomains</label></div><div className="mt-6 flex justify-end"><Button type="submit"><ShieldCheck size={17} /> Add free site</Button></div></form>
      <section className="panel mt-6"><div className="table-wrap"><table className="data-table"><thead><tr><th>Domain</th><th>Category</th><th>Coverage</th><th>Status</th><th></th></tr></thead><tbody>{sites.map((site) => <tr key={site.id}><td><span className="flex items-center gap-2 font-mono text-xs"><Globe2 size={15} className="text-[var(--orange)]" /> {site.hostname}</span>{site.notes && <span className="mt-1 block text-xs text-[var(--muted)]">{site.notes}</span>}</td><td className="capitalize">{site.category.replace("-", " ")}</td><td>{site.includeSubdomains ? "Domain + subdomains" : "Exact domain"}</td><td><Badge tone={site.enabled ? "success" : "neutral"}>{site.enabled ? "Free" : "Disabled"}</Badge></td><td><form action={toggleWhitelistSiteAction}><input type="hidden" name="id" value={site.id} /><input type="hidden" name="enabled" value={String(site.enabled)} /><Button type="submit" variant="ghost" size="icon" title={site.enabled ? "Disable free access" : "Enable free access"}><Power size={16} /></Button></form></td></tr>)}</tbody></table></div></section>
    </>
  );
}

