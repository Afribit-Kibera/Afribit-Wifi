import { requireAdmin } from "@/lib/auth";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { packages, payments } from "@/lib/db/schema";
import { formatSats } from "@/lib/utils";

export default async function PaymentsPage() {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  const records = await db.select({ payment: payments, packageName: packages.name }).from(payments).leftJoin(packages, eq(payments.packageId, packages.id)).orderBy(desc(payments.createdAt)).limit(200);
  return <><PageHeading eyebrow="Ledger" title="Payments" description="Every purchase, how it was paid and whether internet was turned on." /><section className="panel"><div className="table-wrap"><table className="data-table"><thead><tr><th>Created</th><th>Package</th><th>Method</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead><tbody>{records.map(({ payment, packageName }) => <tr key={payment.id}><td>{payment.createdAt.toLocaleString("en-KE")}</td><td>{packageName ?? "—"}</td><td>{payment.provider === "lightning" ? "Bitcoin" : payment.provider === "bitika" || payment.provider === "paystack" ? "M-Pesa" : payment.provider}</td><td className="font-mono text-xs text-[var(--muted)]">{payment.providerInvoiceId ?? "Not created"}</td><td>{formatSats(payment.amountSats)}</td><td><Badge tone={payment.status === "settled" ? "success" : payment.status === "invalid" || payment.status === "expired" ? "danger" : "warning"}>{payment.status}</Badge></td></tr>)}{records.length === 0 && <tr><td colSpan={6} className="h-32 text-center text-[var(--muted)]">No payment attempts yet.</td></tr>}</tbody></table></div></section></>;
}

