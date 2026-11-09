"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { passCode } from "@/lib/admin/passes";

// Shows a pass code to staff helping a customer who lost it. Every look is logged.
export async function revealPassCodeAction(passId: string): Promise<{ code: string } | { error: string }> {
  const admin = await requireAdmin();
  const id = z.string().uuid().safeParse(passId);
  if (!id.success) return { error: "Unknown pass" };
  const code = await passCode(id.data);
  if (!code) return { error: "Pass not found" };
  await db.insert(auditLogs).values({ actor: admin.actor, action: "mesh.pass_code_viewed", entityType: "mesh_pass", entityId: id.data, details: {} });
  return { code };
}
