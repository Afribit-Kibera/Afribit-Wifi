"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { disconnectOrder, endPass } from "@/lib/admin/connections";
import { readMeshAccessConfig } from "@/lib/mesh-access/config";

// Takes one device off the internet. The controller removes it from the router
// within about a minute; the pass stays, so the device can rejoin with it.
export async function disconnectDeviceAction(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = z.string().uuid().parse(formData.get("orderId"));
  const done = await disconnectOrder(readMeshAccessConfig().routerId, orderId);
  await db.insert(auditLogs).values({ actor: admin.actor, action: "mesh.device_disconnected", entityType: "mesh_access_order", entityId: orderId, details: { done } });
  revalidatePath("/admin/network");
  revalidatePath("/admin");
}

// Ends a whole pass early. Every device on it loses internet and the code stops working.
export async function endPassAction(formData: FormData) {
  const admin = await requireAdmin();
  const passId = z.string().uuid().parse(formData.get("passId"));
  const result = await endPass(readMeshAccessConfig().routerId, passId);
  await db.insert(auditLogs).values({ actor: admin.actor, action: "mesh.pass_ended", entityType: "mesh_pass", entityId: passId, details: result });
  revalidatePath("/admin/passes");
  revalidatePath("/admin/network");
  revalidatePath("/admin");
}
