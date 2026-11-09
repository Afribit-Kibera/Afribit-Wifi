import { customerNotice } from "@/lib/mesh-notice";

// The current Mesh notice, for the Mesh app and any page that polls.
export async function GET() {
  const notice = await customerNotice();
  return Response.json({ notice: notice ? { message: notice.message, tone: notice.tone } : null },
    { headers: { "cache-control": "public, max-age=30" } });
}
