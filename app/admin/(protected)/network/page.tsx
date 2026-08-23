import { and, count, desc, eq, gt } from "drizzle-orm";
import { Clock3, PowerOff, Wifi } from "lucide-react";
import { extendGrantAction, manualGrantAction, revokeGrantAction } from "./actions";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { accessGrants, routerJobs } from "@/lib/db/schema";

export default async function NetworkPage() {
  const [[queued], [failed], grants, jobs] = await Promise.all([
    db.select({ value: count() }).from(routerJobs).where(eq(routerJobs.status, "queued")),
    db.select({ value: count() }).from(routerJobs).where(eq(routerJobs.status, "failed")),
    db.select().from(accessGrants).where(and(eq(accessGrants.status, "active"), gt(accessGrants.expiresAt, new Date()))).orderBy(desc(accessGrants.expiresAt)).limit(100),
    db.select().from(routerJobs).orderBy(desc(routerJobs.createdAt)).limit(50),
  ]);
  return (
    <>
      <PageHeading eyebrow="Gateway" title="Network operations" description="Access controls and cloud jobs claimed by the local MikroTik gateway agent." />
      <form action={manualGrantAction} className="panel p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><div><label className="field-label" htmlFor="macAddress">Device MAC</label><Input id="macAddress" name="macAddress" placeholder="AA:BB:CC:DD:EE:FF" required /></div><div><label className="field-label" htmlFor="ipAddress">IP address</label><Input id="ipAddress" name="ipAddress" placeholder="192.168.88.20" /></div><div><label className="field-label" htmlFor="durationMinutes">Time (minutes)</label><Input id="durationMinutes" name="durationMinutes" type="number" min="5" defaultValue="60" required /></div><div><label className="field-label" htmlFor="speedLimitKbps">Speed cap (Kbps)</label><Input id="speedLimitKbps" name="speedLimitKbps" type="number" min="1" /></div></div>
        <div className="mt-6 flex justify-end"><Button type="submit"><Wifi size={17} /> Grant access</Button></div>
      </form>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="panel metric orange p-5"><span className="text-xs text-[var(--muted)]">Queued jobs</span><strong className="mt-4 block text-2xl">{queued.value}</strong></div><div className="panel metric green p-5"><span className="text-xs text-[var(--muted)]">Active grants</span><strong className="mt-4 block text-2xl">{grants.length}</strong></div><div className="panel metric p-5"><span className="text-xs text-[var(--muted)]">Failed jobs</span><strong className="mt-4 block text-2xl">{failed.value}</strong></div></div>
      <section className="panel mt-6"><div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Active access</h2></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Device</th><th>Expires</th><th>Limits</th><th>Extend</th><th></th></tr></thead><tbody>{grants.map((grant) => <tr key={grant.id}><td className="font-mono text-xs">{grant.macAddress}</td><td>{grant.expiresAt.toLocaleString("en-KE")}</td><td className="text-[var(--muted)]">{grant.speedLimitKbps ? `${grant.speedLimitKbps} Kbps` : "Default"}</td><td><form action={extendGrantAction} className="flex items-center gap-2"><input type="hidden" name="id" value={grant.id} /><Input aria-label="Extension minutes" className="w-24" name="minutes" type="number" min="5" defaultValue="60" /><Button type="submit" variant="secondary" size="icon" title="Extend access"><Clock3 size={15} /></Button></form></td><td><form action={revokeGrantAction}><input type="hidden" name="id" value={grant.id} /><Button type="submit" variant="danger" size="icon" title="Revoke access"><PowerOff size={15} /></Button></form></td></tr>)}{grants.length === 0 && <tr><td colSpan={5} className="h-28 text-center text-[var(--muted)]">No active access grants.</td></tr>}</tbody></table></div></section>
      <section className="panel mt-6"><div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Router jobs</h2></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Job</th><th>Attempts</th><th>Status</th><th>Error</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td>{job.createdAt.toLocaleString("en-KE")}</td><td className="font-mono text-xs">{job.type}</td><td>{job.attempts} / {job.maxAttempts}</td><td><Badge tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : "warning"}>{job.status}</Badge></td><td className="max-w-sm truncate text-xs text-[var(--muted)]">{job.lastError ?? "—"}</td></tr>)}</tbody></table></div></section>
    </>
  );
}
