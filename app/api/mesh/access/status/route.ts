import { getMeshAccessStatus } from "@/lib/mesh-access/service";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const responseHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const paymentId = query.get("payment") ?? undefined;
  const grantId = query.get("grant") ?? undefined;
  if ((!paymentId && !grantId) || (paymentId && grantId) || (paymentId && !uuid.test(paymentId)) || (grantId && !uuid.test(grantId))) {
    return Response.json({ error: "Pass not found" }, { status: 404, headers: responseHeaders });
  }
  try {
    const status = await getMeshAccessStatus(request, { paymentId, grantId });
    if (!status) return Response.json({ error: "Pass not found" }, { status: 404, headers: responseHeaders });
    return Response.json(status, { headers: responseHeaders });
  } catch {
    return Response.json({ error: "Could not check your connection" }, { status: 503, headers: responseHeaders });
  }
}
