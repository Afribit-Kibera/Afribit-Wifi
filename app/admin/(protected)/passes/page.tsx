import { requireAdmin } from "@/lib/auth";
import { connection } from "next/server";
import { Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminConfirmAction } from "@/components/admin-confirm-action";
import { AdminRevealCode } from "@/components/admin-reveal-code";
import { findPasses, type FoundPass } from "@/lib/admin/passes";
import { endPassAction } from "../network/actions";

const time = (date: Date) => date.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const kindLabel: Record<string, string> = { personal: "Personal", household: "Household", tv: "TV" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Status({ pass }: { pass: FoundPass }) {
  if (pass.live) return <Badge tone="success">Live until {time(pass.expiresAt)}</Badge>;
  if (pass.revokedAt && pass.revokedAt < pass.expiresAt) return <Badge tone="danger">Ended early {time(pass.revokedAt)}</Badge>;
  return <Badge>Ended {time(pass.expiresAt)}</Badge>;
}

export default async function PassesPage({ searchParams }: Props) {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const day = typeof params.day === "string" ? params.day : "";
  let passes: FoundPass[] | null;
  try { passes = await findPasses({ query, day }); } catch { passes = null; }
  return (
    <>
      <PageHeading eyebrow="Mesh" title="Passes" description="Find a customer’s pass to read them their code, or end it. Search by the phone’s Wi-Fi address (any part of it) or a full pass code, and pick the day they bought it. With no search you see the last 3 days." />
      <form className="panel mb-4 flex flex-wrap items-end gap-3 p-5" method="get">
        <div className="min-w-56 flex-1"><label className="field-label" htmlFor="q">Wi-Fi address or pass code</label><Input id="q" name="q" defaultValue={query} placeholder="e.g. 0A:43:42 or 123 456 7890" /></div>
        <div><label className="field-label" htmlFor="day">Day bought</label><Input id="day" name="day" type="date" defaultValue={day} /></div>
        <Button type="submit"><Search size={16} /> Find</Button>
      </form>
      <p className="mb-4 text-xs text-[var(--muted)]">The Wi-Fi address is on the Connections page next to each device, or on the phone under Wi-Fi → Mesh → details. Before sharing a code, check with the customer when they paid, how much and for which plan. Each code you open is logged.</p>
      <section className="panel">
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Bought</th><th>Plan</th><th>Paid with</th><th>Devices</th><th>Status</th><th>Code</th><th></th></tr></thead>
          <tbody>
            {passes?.map(pass => <tr key={pass.id}>
              <td>{time(pass.createdAt)}</td>
              <td>{pass.plan || kindLabel[pass.kind] || pass.kind}{pass.plan ? <span className="block text-xs text-[var(--muted)]">{kindLabel[pass.kind] ?? pass.kind}</span> : null}</td>
              <td>{pass.source}{pass.kes !== null ? ` · KES ${pass.kes}` : ""}</td>
              <td>{pass.devices.map(device => <span key={device.mac + device.label} className={`block font-mono text-[11px] ${device.removed ? "text-[var(--muted)] line-through" : ""}`}>{device.label} · {device.mac}</span>)}</td>
              <td><Status pass={pass} /></td>
              <td><AdminRevealCode passId={pass.id} /></td>
              <td>{pass.live ? <AdminConfirmAction action={endPassAction} name="passId" value={pass.id} label="End pass" confirm="Ends this pass now. Every device on it loses internet and its code stops working. This can’t be undone." /> : null}</td>
            </tr>)}
            {passes?.length === 0 && <tr><td colSpan={7} className="h-28 text-center text-[var(--muted)]">No passes match.</td></tr>}
            {passes === null && <tr><td colSpan={7} className="h-28 text-center text-[var(--muted)]">Passes are unavailable. Check the database connection.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
