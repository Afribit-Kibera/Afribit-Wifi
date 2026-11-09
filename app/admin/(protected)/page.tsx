import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { connection } from "next/server";
import { Banknote, CircleSlash, Smartphone, Ticket, Users, Wifi } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { AdminConfirmAction } from "@/components/admin-confirm-action";
import { endPassAction } from "./network/actions";
import { internetStatus } from "@/lib/mesh-access/uplink";
import { meshLastWeek, meshLivePasses, meshRecentPayments, meshSummary } from "@/lib/admin/mesh-overview";

const kes = (value: number) => `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const time = (date: Date) => date.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const kindLabel: Record<string, string> = { personal: "Personal", household: "Household", tv: "TV" };

export default async function AdminOverview() {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  let data;
  try { data = await Promise.all([meshSummary(), meshLastWeek(), meshLivePasses(), meshRecentPayments()]); }
  catch { return <><PageHeading eyebrow="Mesh" title="Overview" /><section className="panel p-5"><p className="text-sm text-[var(--muted)]">Mesh figures are unavailable. Check the database connection.</p></section></>; }
  const [summary, week, passes, recent] = data;
  const metrics = [
    { label: "Online now", value: String(summary.online), note: "devices with internet", icon: Wifi, tone: "green" },
    { label: "Live passes", value: String(summary.livePasses), note: `${summary.passDevices} devices on them`, icon: Ticket, tone: "" },
    { label: "Sales today", value: kes(summary.mpesaKesToday + summary.bitcoinKesToday), note: `${summary.paidToday} paid · M-Pesa ${kes(summary.mpesaKesToday)} · Bitcoin ${kes(summary.bitcoinKesToday)}`, icon: Banknote, tone: "orange" },
    { label: "Visitors today", value: String(summary.visitorsToday), note: `${summary.visitors30} devices in 30 days`, icon: Smartphone, tone: "" },
    { label: "Buyers (30 days)", value: String(summary.buyers30), note: `${summary.vouchersToday} vouchers used today`, icon: Users, tone: "gold" },
    { label: "Unfinished today", value: String(summary.unfinishedToday), note: "started a payment, didn’t pay", icon: CircleSlash, tone: "" },
  ];
  const line = internetStatus();
  return (
    <>
      <PageHeading eyebrow="Mesh" title="Overview" description="Who is online, what sold and who didn't finish paying. Days follow Nairobi time." action={<Link className="text-sm font-semibold underline underline-offset-4" href="/admin/network">Connections and history</Link>} />
      {!line.online ? <p className="panel mb-4 border-[var(--red)] p-4 text-sm font-semibold" role="status">The internet line has been down since {line.since.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", hour: "numeric", minute: "2-digit" })}. Mesh pages and codes still work; pass sales are paused until it’s back.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => <div key={label} className={`panel metric ${tone} p-5`}>
          <div className="flex items-center justify-between text-[var(--muted)]"><span className="text-xs font-semibold">{label}</span><Icon size={17} /></div>
          <strong className="mt-4 block text-2xl">{value}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{note}</span>
        </div>)}
      </div>
      <section className="panel mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Last 7 days</h2></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Day</th><th>Visitors</th><th>Payments started</th><th>Paid</th><th>Sales</th></tr></thead>
          <tbody>{week.map(day => <tr key={day.day}><td>{new Date(`${day.day}T12:00:00+03:00`).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Nairobi" })}</td><td>{day.visitors}</td><td>{day.started}</td><td>{day.paid}</td><td>{kes(day.kes)}</td></tr>)}</tbody></table></div>
      </section>
      <section className="panel mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Live passes</h2></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Bought</th><th>Plan</th><th>Paid with</th><th>Devices</th><th>Ends</th><th></th></tr></thead>
          <tbody>{passes.map(pass => <tr key={pass.id}><td>{time(pass.createdAt)}</td><td>{kindLabel[pass.kind] ?? pass.kind}</td><td>{pass.source}{pass.kes !== null ? ` · ${kes(pass.kes)}` : ""}</td>
            <td><span title={pass.macs}>{pass.devices} of {pass.deviceLimit}</span>{pass.macs ? <span className="block font-mono text-[11px] text-[var(--muted)]">{pass.macs}</span> : null}</td><td>{time(pass.expiresAt)}</td>
              <td><AdminConfirmAction action={endPassAction} name="passId" value={pass.id} label="End pass" confirm="Ends this pass now. Every device on it loses internet and its code stops working. This can’t be undone." /></td></tr>)}
            {passes.length === 0 && <tr><td colSpan={6} className="h-28 text-center text-[var(--muted)]">No live passes right now.</td></tr>}</tbody></table></div>
      </section>
      <section className="panel mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Recent payments</h2></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Started</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{recent.map(payment => <tr key={payment.id}><td>{time(payment.createdAt)}</td><td>{payment.method}</td><td>{kes(payment.kes)}</td><td><Badge tone={payment.tone}>{payment.label}</Badge></td></tr>)}
            {recent.length === 0 && <tr><td colSpan={4} className="h-28 text-center text-[var(--muted)]">No payments yet.</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}
