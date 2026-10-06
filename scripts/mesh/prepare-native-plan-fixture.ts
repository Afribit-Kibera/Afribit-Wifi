// Generate a syntax-only fixture for RouterOS import ... verbose=yes dry-run.
// Never execute/import this plan without dry-run. It is not a payment receipt.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { attestHost, createPaidOrder } from "../../lib/mesh-access/order";
import { buildNativeProvisionCommand } from "../../lib/mesh-access/native-plan";

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const paymentId = randomUUID();
  const enrollment = { routerId: "KM-LAB-001", server: "KM-MESH-001", key: "public-fixture-key-not-a-router-credential" };
  const host = attestHost({ routerId: enrollment.routerId, server: enrollment.server, ticketId: randomUUID(),
    macAddress: "02:00:00:FE:00:05", ipAddress: "10.30.0.254", checkedAt: now }, enrollment);
  const signed = createPaidOrder({ paymentId, amountKes: 10, destination: "fixture@blink.sv", durationSeconds: 60, now,
    host, enrollment, receipt: { paymentId, reference: `mesh-${paymentId}`, amountKes: 10, amountSats: 85,
      destination: "fixture@blink.sv", status: "settled", collectionConfirmed: true, verifiedBitcoinDelivery: true,
      paymentHash: "ab".repeat(32), sourceTransactionId: "fixture-only", settledAt: new Date().toISOString(), resolutionRequired: false } });
  const command = buildNativeProvisionCommand(signed, enrollment, now).replace(/password="[^"]+"/, 'password="unused-syntax-fixture"');
  await mkdir("artifacts/mesh-lab/deadline-policy", { recursive: true });
  await writeFile("artifacts/mesh-lab/deadline-policy/native-plan-dry-run.rsc", "# Syntax-only fixture; dry-run required.\n" + command + "\n");
  console.log("Prepared syntax-only native plan; no network request or access grant.");
}
main().catch(() => { console.error("Native syntax fixture preparation failed"); process.exitCode = 1; });
