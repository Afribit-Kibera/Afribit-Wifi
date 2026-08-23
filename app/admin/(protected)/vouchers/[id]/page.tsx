import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { voucherBatches, vouchers } from "@/lib/db/schema";
import { formatDuration, formatSats } from "@/lib/utils";

export default async function VoucherBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batch] = await db.select().from(voucherBatches).where(eq(voucherBatches.id, id)).limit(1);
  if (!batch) notFound();
  const codes = await db.select().from(vouchers).where(eq(vouchers.batchId, id));
  const redeemed = codes.filter((item) => item.redemptionCount > 0).length;
  return (
    <>
      <PageHeading eyebrow="Voucher batch" title={batch.name} description={`${formatSats(batch.saleAmountSats)} · ${formatDuration(batch.accessDurationMinutes)} · ${batch.maxRedemptions} use${batch.maxRedemptions === 1 ? "" : "s"} each`} action={<Button asChild><a href={`/api/admin/voucher-batches/${batch.id}/export`}><Download size={17} /> Download CSV</a></Button>} />
      <div className="grid gap-3 sm:grid-cols-3"><div className="panel metric orange p-5"><span className="text-xs text-[var(--muted)]">Issued</span><strong className="mt-4 block text-2xl">{codes.length}</strong></div><div className="panel metric green p-5"><span className="text-xs text-[var(--muted)]">Redeemed</span><strong className="mt-4 block text-2xl">{redeemed}</strong></div><div className="panel metric p-5"><span className="text-xs text-[var(--muted)]">Available</span><strong className="mt-4 block text-2xl">{codes.length - redeemed}</strong></div></div>
      <section className="panel mt-6"><div className="table-wrap"><table className="data-table"><thead><tr><th>Voucher</th><th>Status</th><th>Redemptions</th><th>Last used</th></tr></thead><tbody>{codes.map((voucher) => <tr key={voucher.id}><td className="font-mono">{batch.prefix}-••••-••••-{voucher.codeLastFour}</td><td><Badge tone={voucher.disabled ? "danger" : voucher.redemptionCount >= batch.maxRedemptions ? "neutral" : "success"}>{voucher.disabled ? "Disabled" : voucher.redemptionCount >= batch.maxRedemptions ? "Used" : "Available"}</Badge></td><td>{voucher.redemptionCount} / {batch.maxRedemptions}</td><td className="text-[var(--muted)]">{voucher.lastRedeemedAt?.toLocaleString("en-KE") ?? "—"}</td></tr>)}</tbody></table></div></section>
    </>
  );
}

