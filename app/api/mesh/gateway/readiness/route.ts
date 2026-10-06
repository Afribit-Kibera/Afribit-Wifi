import { privateHeaders, readAgentBody } from "@/lib/mesh-access/agent-api";
import { getPaystackReadiness } from "@/lib/payments/paystack";
import { getBitikaReadiness } from "@/lib/payments/bitika";

export const runtime = "nodejs";

// An enrolled gateway can inspect checkout gates without requesting a payment,
// publishing configuration values or reconciling a financial transaction.
export async function POST(request: Request) {
  try { await readAgentBody(request); }
  catch { return Response.json({ error: "Unauthorized" }, { status: 403, headers: privateHeaders }); }
  const { configured, receiptEmailConfigured, enabled, settlementReady, accessReady, checkoutReady, blocker } = getPaystackReadiness();
  return Response.json({ preferredProvider: getBitikaReadiness().checkoutReady ? "bitika" : "paystack", bitika: getBitikaReadiness(), paystack: { configured, receiptEmailConfigured, enabled, settlementReady, accessReady, checkoutReady, blocker } }, { headers: privateHeaders });
}
