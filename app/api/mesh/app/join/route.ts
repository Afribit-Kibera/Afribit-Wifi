import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meshAccessContexts } from "@/lib/db/schema";
import { consumeMeshJoin } from "@/lib/mesh-access/service";
import { meshAutomaticAccessReady } from "@/lib/mesh-access/config";
import { privateHeaders } from "@/lib/mesh-access/agent-api";
import { deviceKeyHash, isDeviceKey, newDeviceKey, restoreDevicePass } from "@/lib/mesh-access/passes";
import { readBoundedJson } from "@/lib/request-body";
export const runtime = "nodejs";

const schema = z.object({
  ticket: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  session: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/),
  deviceKey: z.string().optional(),
}).strict();

// The Afribit app's version of /api/mesh/join: the captive page hands the app the
// same one-use ticket and session, and the app keeps the session and device key in
// its secure storage and sends them as headers (see app-credentials.ts). Same checks
// as the browser join: the router attested this device, and the ticket is used once.
export async function POST(request: Request) {
  let input: z.infer<typeof schema>;
  try { input = schema.parse(await readBoundedJson(request, 1024)); }
  catch { return Response.json({ error: "This Mesh link isn't valid. Open Afribit from the Mesh Wi-Fi page again." }, { status: 400, headers: privateHeaders }); }
  if (!meshAutomaticAccessReady() || !await consumeMeshJoin(input.ticket, input.session))
    return Response.json({ error: "Reconnect to Mesh Wi-Fi, then open Afribit from the welcome page again." }, { status: 403, headers: privateHeaders });
  // A phone that joined before keeps its key, so its passes follow it.
  const deviceKey = isDeviceKey(input.deviceKey) ? input.deviceKey : newDeviceKey(), keyHash = deviceKeyHash(deviceKey);
  const contextId = input.session.split(".")[0];
  let grantId: string | null = null, restored = false;
  try {
    const [context] = await db.update(meshAccessContexts).set({ deviceKeyHash: keyHash })
      .where(eq(meshAccessContexts.id, contextId)).returning();
    const pass = context ? await restoreDevicePass(context, keyHash) : null;
    if (pass) { grantId = pass.grantId; restored = Boolean(pass.restored); }
  } catch (error) {
    console.error("Pass restore deferred", error instanceof Error ? error.message : "unknown");
  }
  return Response.json({ deviceKey, grantId, restored }, { headers: privateHeaders });
}
