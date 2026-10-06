import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { verifyOrder, type Enrollment, type SignedEnvelope } from "../lib/mesh-access/order";
import { buildNativeProvisionCommand } from "../lib/mesh-access/native-plan";
import type { EngineSettlement } from "../lib/payments/insats-engine";

type Dependencies = {
  enrollment: Enrollment;
  ledgerDirectory: string;
  amountKes: number;
  destination: string;
  now: () => number;
  getReceipt: (paymentId: string, amountKes: number) => Promise<EngineSettlement>;
  execute: (command: string, passwordToRedact: string) => Promise<"created" | "retained">;
};

// Independent lab consumer. It never calls the shared gateway jobs API, creates
// an M-Pesa charge, sends Bitcoin or changes a deadline on retry.
export async function provisionMeshOrder(envelope: SignedEnvelope, deps: Dependencies) {
  const order = verifyOrder(envelope, deps.enrollment, deps.now());
  const digest = createHash("sha256").update(envelope.body).digest("hex");
  await mkdir(deps.ledgerDirectory, { recursive: true, mode: 0o700 });
  const ledgerPath = join(deps.ledgerDirectory, `${order.paymentId}.json`);
  const lockPath = join(deps.ledgerDirectory, `${order.paymentId}.lock`);
  // Exclusive cross-process lock. An abandoned lock requires review; never infer
  // that an ambiguous router write failed and restore a fresh allowance.
  let lock;
  try { lock = await open(lockPath, "wx", 0o600); }
  catch { throw new Error("Mesh payment is being provisioned or needs lock recovery"); }
  try {
    let previous: { orderHash: string; state: string } | null = null;
    try { previous = JSON.parse(await readFile(ledgerPath, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Mesh ledger requires review"); }
    if (previous && (previous.orderHash !== digest || previous.state === "consumed")) throw new Error("Mesh payment already used or bound to another order");

    // Read-only Engine operation: retries never perform another settlement/send.
    const receipt = await deps.getReceipt(order.paymentId, deps.amountKes);
    if (receipt.paymentId !== order.paymentId || receipt.reference !== `mesh-${order.paymentId}` || receipt.amountKes !== deps.amountKes ||
        receipt.destination !== deps.destination || receipt.status !== "settled" || !receipt.collectionConfirmed || !receipt.verifiedBitcoinDelivery ||
        receipt.resolutionRequired || !receipt.sourceTransactionId || !receipt.settledAt || !Number.isFinite(Date.parse(receipt.settledAt)) ||
        receipt.paymentHash !== order.paymentHash || receipt.amountSats !== order.amountSats) throw new Error("Mesh Engine receipt does not authorize this order");
    // Persist before the external router effect. Contains no password/key.
    const record = { paymentId: order.paymentId, orderHash: digest, routerId: order.routerId,
      expiresAt: order.expiresAt, state: "reserved" };
    if (!previous) await writeFile(ledgerPath, JSON.stringify(record) + "\n", { flag: "wx", mode: 0o600 });
    const command = buildNativeProvisionCommand(envelope, deps.enrollment, deps.now());
    const result = await deps.execute(command, order.password);
    const temporary = ledgerPath + ".next";
    await writeFile(temporary, JSON.stringify({ ...record, state: "provisioned" }) + "\n", { mode: 0o600 });
    await rename(temporary, ledgerPath);
    return { result, paymentId: order.paymentId, expiresAt: order.expiresAt, loginRequired: true, customerActive: false };
  } finally {
    await lock.close();
    // Exact known file, no recursive/computed directory deletion.
    const { unlink } = await import("node:fs/promises");
    await unlink(lockPath);
  }
}
