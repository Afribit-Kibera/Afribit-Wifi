import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { voucherBatches, vouchers } from "@/lib/db/schema";
import { decryptVoucherCode } from "@/lib/voucher-crypto";

function csvCell(value: string | number | null) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [batch] = await db.select().from(voucherBatches).where(eq(voucherBatches.id, id)).limit(1);
  if (!batch) return Response.json({ error: "Batch not found" }, { status: 404 });
  const records = await db.select().from(vouchers).where(eq(vouchers.batchId, id));
  const rows = [
    ["code", "amount_sats", "access_minutes", "valid_from", "valid_until", "max_redemptions"],
    ...records.map((item) => [decryptVoucherCode(item.codeCiphertext), batch.saleAmountSats, batch.accessDurationMinutes, batch.validFrom?.toISOString() ?? "", batch.validUntil?.toISOString() ?? "", batch.maxRedemptions]),
  ];
  const body = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${batch.prefix}-${batch.id.slice(0, 8)}.csv"`, "Cache-Control": "no-store" } });
}

