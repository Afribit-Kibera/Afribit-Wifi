import { readMeshNotice } from "@/lib/mesh-notice";

// The current Mesh notice, for the Mesh app and any page that polls.
export async function GET() {
  const notice = await readMeshNotice();
  return Response.json({ notice: notice ? { message: notice.message, tone: notice.tone, endsAt: notice.endsAt, updatedAt: notice.updatedAt } : null },
    { headers: { "cache-control": "public, max-age=30" } });
}
