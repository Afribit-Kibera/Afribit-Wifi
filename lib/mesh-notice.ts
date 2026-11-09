import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { appSettings } from "./db/schema";

// A short message from the Mesh team, shown on every Mesh page until it ends.
// Devices see it when they open a Mesh page or the Mesh app; nothing is pushed.
export const meshNoticeSchema = z.object({
  message: z.string().trim().min(1).max(240),
  tone: z.enum(["info", "warning"]),
  endsAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});
export type MeshNotice = z.infer<typeof meshNoticeSchema>;

export async function readMeshNotice(includeEnded = false): Promise<MeshNotice | null> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "notice")).limit(1);
    const parsed = meshNoticeSchema.safeParse(row?.value);
    if (!parsed.success) return null;
    if (!includeEnded && parsed.data.endsAt && Date.parse(parsed.data.endsAt) <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null; // A missing notice must never stop a page from loading.
  }
}

export async function saveMeshNotice(notice: MeshNotice | null, actor: string) {
  if (!notice) { await db.delete(appSettings).where(eq(appSettings.key, "notice")); return; }
  const value = meshNoticeSchema.parse(notice);
  await db.insert(appSettings).values({ key: "notice", value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actor, updatedAt: new Date() } });
}

// What customers see: an outage notice while the internet line is down,
// otherwise the team's notice. Admin settings keep reading readMeshNotice.
export const outageMessage = "The internet line is down right now. Mesh is still on: your pass and codes still work here, and buying passes is paused until the line is back.";
export async function customerNotice(): Promise<Pick<MeshNotice, "message" | "tone"> | null> {
  const { internetStatus } = await import("./mesh-access/uplink");
  if (!internetStatus().online) return { message: outageMessage, tone: "warning" };
  const notice = await readMeshNotice();
  return notice ? { message: notice.message, tone: notice.tone } : null;
}
