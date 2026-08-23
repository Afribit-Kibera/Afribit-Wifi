import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { VoucherBatchForm } from "@/components/voucher-batch-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { packages, voucherBatches, vouchers } from "@/lib/db/schema";
import { formatDuration, formatSats } from "@/lib/utils";

export default async function VouchersPage() {
  const [wifiPackages, batches] = await Promise.all([
    db.select({ id: packages.id, name: packages.name, priceSats: packages.priceSats, durationMinutes: packages.durationMinutes }).from(packages).where(eq(packages.active, true)),
    db.select({ batch: voucherBatches, issued: count(vouchers.id) }).from(voucherBatches).leftJoin(vouchers, eq(vouchers.batchId, voucherBatches.id)).groupBy(voucherBatches.id).orderBy(desc(voucherBatches.createdAt)),
  ]);
  return (
    <>
      <PageHeading eyebrow="Access inventory" title="Voucher batches" description="Issue printable or digital WiFi codes with controlled value, duration and validity." />
      <VoucherBatchForm packages={wifiPackages} />
      <section className="panel mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Issued batches</h2></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Batch</th><th>Issued</th><th>Value</th><th>Access</th><th>Validity</th><th></th></tr></thead><tbody>{batches.map(({ batch, issued }) => <tr key={batch.id}><td><Link className="font-semibold hover:text-[var(--orange)]" href={`/admin/vouchers/${batch.id}`}>{batch.name}</Link><span className="mt-1 block font-mono text-[11px] text-[var(--muted)]">{batch.prefix}-••••-••••</span></td><td><Badge>{issued} codes</Badge></td><td>{formatSats(batch.saleAmountSats)}</td><td>{formatDuration(batch.accessDurationMinutes)}</td><td className="text-[var(--muted)]">{batch.validUntil ? `Until ${batch.validUntil.toLocaleDateString("en-KE")}` : "No expiry"}</td><td><Button asChild variant="ghost" size="icon"><a href={`/api/admin/voucher-batches/${batch.id}/export`} title="Download CSV"><Download size={16} /></a></Button></td></tr>)}{batches.length === 0 && <tr><td colSpan={6} className="h-32 text-center text-[var(--muted)]">No voucher batches yet.</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}
