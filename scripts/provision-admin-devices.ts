import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isNull } from "drizzle-orm";
import { MAX_ADMIN_DEVICES } from "../lib/admin-devices";
import { db } from "../lib/db";
import { adminEnrollmentCodes, adminPasskeys, auditLogs } from "../lib/db/schema";
import { hashEnrollmentCode } from "../lib/webauthn";

const outputPath = resolve(".env.admin-pairing-codes.local");
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

function generateCode() {
  const token = randomBytes(12).toString("hex").toUpperCase();
  return `BV-${token.match(/.{1,4}/g)?.join("-")}`;
}

async function provision() {
  const activeDevices = await db.select({ slot: adminPasskeys.slot }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  if (activeDevices.length) throw new Error("Provisioning all three initial slots requires zero active admin devices");

  await db.delete(adminEnrollmentCodes).where(isNull(adminEnrollmentCodes.usedAt));

  const records = Array.from({ length: MAX_ADMIN_DEVICES }, (_, index) => {
    const slot = index + 1;
    const deviceName = `Admin device ${slot}`;
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
  console.log(`Provisioned ${MAX_ADMIN_DEVICES} admin device slots. Pairing codes were written to ${outputPath}.`);
}

provision().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
