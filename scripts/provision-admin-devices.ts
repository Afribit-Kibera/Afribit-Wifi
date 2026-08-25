import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { MAX_ADMIN_DEVICES } from "../lib/admin-devices";
import { db } from "../lib/db";
import { adminEnrollmentCodes, adminPasskeys, auditLogs } from "../lib/db/schema";
import { hashEnrollmentCode } from "../lib/webauthn";

const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function generateCode() {
  const token = randomBytes(12).toString("hex").toUpperCase();
  return `3W-${token.match(/.{1,4}/g)?.join("-")}`;
}

async function provision() {
  const activeDevices = await db.select({ slot: adminPasskeys.slot }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  const requestedSlotText = argument("--slot");
  if (process.argv.includes("--slot") && !requestedSlotText) throw new Error("--slot requires a value");
  const requestedSlot = requestedSlotText ? Number(requestedSlotText) : undefined;
  if (requestedSlot !== undefined && (!Number.isInteger(requestedSlot) || requestedSlot < 1 || requestedSlot > MAX_ADMIN_DEVICES)) throw new Error(`--slot must be between 1 and ${MAX_ADMIN_DEVICES}`);
  if (requestedSlot === undefined && activeDevices.length) throw new Error("Initial provisioning requires zero active admin devices. Use --slot for a revoked device replacement.");
  if (requestedSlot !== undefined && activeDevices.some((device) => device.slot === requestedSlot)) throw new Error(`Admin device slot ${requestedSlot} must be revoked before it can be reprovisioned`);

  if (requestedSlot === undefined) {
    await db.delete(adminEnrollmentCodes).where(isNull(adminEnrollmentCodes.usedAt));
  } else {
    await db.delete(adminEnrollmentCodes).where(and(eq(adminEnrollmentCodes.slot, requestedSlot), isNull(adminEnrollmentCodes.usedAt)));
  }

  const slots = requestedSlot === undefined ? Array.from({ length: MAX_ADMIN_DEVICES }, (_, index) => index + 1) : [requestedSlot];
  const requestedName = argument("--name")?.trim();
  const records = slots.map((slot) => {
    const deviceName = requestedName && requestedSlot !== undefined ? requestedName : `Admin device ${slot}`;
    const code = generateCode();
    return { slot, deviceName, code };
  });

  for (const record of records) {
    const [enrollment] = await db.insert(adminEnrollmentCodes).values({
      codeHash: hashEnrollmentCode(record.code),
      slot: record.slot,
      deviceName: record.deviceName,
      createdBy: "operator:database",
      expiresAt,
    }).returning({ id: adminEnrollmentCodes.id });
    await db.insert(auditLogs).values({
      actor: "operator:database",
      action: "admin_device.provisioned",
      entityType: "admin_enrollment_code",
      entityId: enrollment.id,
      details: { slot: record.slot, deviceName: record.deviceName, expiresAt: expiresAt.toISOString() },
    });
  }

  const outputPath = resolve(requestedSlot === undefined ? ".env.admin-pairing-codes.local" : `.env.admin-pairing-code-slot-${requestedSlot}.local`);
  const contents = [
    "# Operator-only one-time pairing codes. Never commit or share this file.",
    `ADMIN_PAIRING_CODES_EXPIRE_AT=${expiresAt.toISOString()}`,
    ...records.flatMap((record) => [
      `ADMIN_DEVICE_${record.slot}_NAME=${record.deviceName}`,
      `ADMIN_DEVICE_${record.slot}_PAIRING_CODE=${record.code}`,
    ]),
    "",
  ].join("\n");
  await writeFile(outputPath, contents, { encoding: "utf8", mode: 0o600 });
  console.log(`Provisioned ${records.length} admin device slot${records.length === 1 ? "" : "s"}. Pairing codes were written to ${outputPath}.`);
}

provision().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
