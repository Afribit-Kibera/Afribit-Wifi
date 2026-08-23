import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import { Activity, CircleDollarSign, Router, TicketCheck } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { accessGrants, payments, routerJobs, vouchers } from "@/lib/db/schema";
import { formatSats } from "@/lib/utils";

export default async function AdminOverview() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const [[revenue], [active], [voucherUses], [queued], recentPayments] = await Promise.all([
    db.select({ value: sum(payments.amountSats) }).from(payments).where(and(eq(payments.status, "settled"), gte(payments.settledAt, dayStart))),
    db.select({ value: count() }).from(accessGrants).where(and(eq(accessGrants.status, "active"), gte(accessGrants.expiresAt, new Date()))),
    db.select({ value: count() }).from(vouchers).where(gte(vouchers.lastRedeemedAt, dayStart)),
    db.select({ value: count() }).from(routerJobs).where(eq(routerJobs.status, "queued")),
    db.select().from(payments).orderBy(desc(payments.createdAt)).limit(8),
  ]);
  const metrics = [
    { label: "Revenue today", value: formatSats(Number(revenue.value ?? 0)), icon: CircleDollarSign, tone: "orange" },
    { label: "Active sessions", value: String(active.value), icon: Activity, tone: "green" },
    { label: "Vouchers used", value: String(voucherUses.value), icon: TicketCheck, tone: "gold" },
    { label: "Router jobs", value: String(queued.value), icon: Router, tone: "" },
  ];
  return (
    <>
      <PageHeading eyebrow="Operations" title="Network overview" description="Live commercial and access state across Bitcoin Valley WiFi." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`panel metric ${tone} p-5`}><div className="flex items-center justify-between text-[var(--muted)]"><span className="text-xs font-semibold">{label}</span><Icon size={17} /></div><strong className="mt-5 block text-2xl">{value}</strong></div>)}
      </div>
      <section className="panel mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Recent payments</h2></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Provider</th><th>Amount</th><th>Status</th></tr></thead><tbody>{recentPayments.map((payment) => <tr key={payment.id}><td>{payment.createdAt.toLocaleString("en-KE")}</td><td className="capitalize">{payment.provider}</td><td>{formatSats(payment.amountSats)}</td><td><Badge tone={payment.status === "settled" ? "success" : payment.status === "invalid" || payment.status === "expired" ? "danger" : "warning"}>{payment.status}</Badge></td></tr>)}{recentPayments.length === 0 && <tr><td colSpan={4} className="h-32 text-center text-[var(--muted)]">No payments recorded yet.</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}

