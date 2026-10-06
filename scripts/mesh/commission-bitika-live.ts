import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { bitikaTransactionCodeSchema, BitikaClient, normalizeKenyanPhone, readBitikaConfig, verifiedBitikaSnapshot, type BitikaConfig } from "../../lib/payments/bitika";
import { PaymentProviderError } from "../../lib/payments/types";

const receiptSchema = z.object({
  paymentId: z.string().uuid(), createdAt: z.string().datetime(),
  mode: z.literal("live"), amountKes: z.literal(10), lightningAddress: z.string(),
  phoneDigest: z.string().regex(/^[a-f0-9]{64}$/),
  transactionCode: bitikaTransactionCodeSchema.optional(),
  providerStatus: z.string().optional(), verifiedBitcoinDelivery: z.boolean().default(false),
  deliveredSats: z.number().int().positive().optional(),
  paymentHash: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  resolutionRequired: z.boolean().optional(), checkedAt: z.string().datetime().optional(),
});
type Receipt = z.infer<typeof receiptSchema>;
export type LiveAction = "preflight" | "collect" | "status";

// This is one operator's KES 10 production purchase, not the public checkout.
// It does not import the application database or authorize a router client.
export async function commissionBitikaLive(action: LiveAction, config: BitikaConfig, phone?: string,
  directory = resolve("artifacts/mesh-lab/private/bitika-live"), fetcher: typeof fetch = fetch) {
  if (config.mode !== "live" || !config.apiKey.startsWith("bk_live_")) throw new PaymentProviderError("Live commissioning requires a production key; sandbox credentials are refused");
  const client = new BitikaClient(config, fetcher);
  await mkdir(directory, { recursive: true });
  if (action === "preflight") {
    const quote = await client.quote(10);
    const report = { checkedAt: new Date().toISOString(), mode: "live", amountKes: 10,
      destination: config.lightningAddress, quotedSats: quote.satsAmount, feePercentage: quote.feePercentage,
      collectionInitiated: false, databaseWrites: false, routerAccessGranted: false };
    await writeFile(join(directory, "preflight.json"), JSON.stringify(report, null, 2) + "\n");
    return report;
  }

  const filename = join(directory, "purchase.json");
  const lockPath = join(directory, "purchase.lock");
  let lock;
  try { lock = await open(lockPath, "wx"); } catch {
    throw new PaymentProviderError("Another live operation holds the purchase lock. Check that process before removing a stale lock.");
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
    let receipt: Receipt | undefined;
    try { receipt = receiptSchema.parse(JSON.parse(await readFile(filename, "utf8"))); } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw new PaymentProviderError("The retained live purchase cannot be read. Preserve it and inspect it before another collection.");
    }
    const normalizedPhone = phone ? normalizeKenyanPhone(phone) : undefined;
    const phoneDigest = normalizedPhone ? createHash("sha256").update(normalizedPhone).digest("hex") : undefined;
    if (receipt && (receipt.lightningAddress !== config.lightningAddress || (phoneDigest && receipt.phoneDigest !== phoneDigest))) {
      throw new PaymentProviderError("This live reference belongs to a different payer or destination. No new collection was initiated.");
    }
    const persist = async () => {
      const temporary = filename + "." + randomUUID() + ".tmp";
      await writeFile(temporary, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
      await rename(temporary, filename);
    };
    if (action === "collect" && !receipt?.transactionCode) {
      if (!normalizedPhone || !phoneDigest) throw new PaymentProviderError("Set BITIKA_TEST_PHONE to the operator's real M-Pesa number before live collection", 400);
      // Persist the logical reference BEFORE contacting M-Pesa. An ambiguous
      // timeout/restart must reuse this UUID rather than initiate another charge.
      receipt ??= { paymentId: randomUUID(), createdAt: new Date().toISOString(), mode: "live", amountKes: 10,
        lightningAddress: config.lightningAddress, phoneDigest, verifiedBitcoinDelivery: false };
      await persist();
      const started = await client.collect({ paymentId: receipt.paymentId, amountKes: receipt.amountKes, phone: normalizedPhone });
      receipt.transactionCode = started.transaction_code;
      receipt.providerStatus = started.status;
      await persist();
    }
    if (!receipt?.transactionCode) throw new PaymentProviderError("No transaction code is retained. A collection retry must use the same stored reference; do not delete the receipt.");
    // Once a code exists, even 'collect' only looks up its state. It never
    // starts another purchase after success, decline or undelivered Bitcoin.
    const transaction = await client.getTransaction(receipt.transactionCode);
    const snapshot = verifiedBitikaSnapshot(transaction, { bitika: { mode: "live", amountKes: receipt.amountKes, lightningAddress: receipt.lightningAddress } });
    receipt.providerStatus = snapshot.providerStatus;
    receipt.verifiedBitcoinDelivery = snapshot.status === "settled";
    receipt.resolutionRequired = snapshot.resolutionRequired ?? false;
    receipt.checkedAt = new Date().toISOString();
    if (snapshot.status === "settled") { receipt.deliveredSats = snapshot.amountSats; receipt.paymentHash = snapshot.paymentHash; }
    await persist();
    return { ...receipt, phoneDigest: undefined, databaseWrites: false, routerAccessGranted: false };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const action = process.argv[2];
  if (!["preflight", "collect", "status"].includes(action)) {
    console.error("Usage: npm run bitika:live -- preflight|collect|status");
    process.exitCode = 1;
  } else Promise.resolve().then(() => commissionBitikaLive(action as LiveAction, readBitikaConfig(), process.env.BITIKA_TEST_PHONE))
    .then(report => console.log(JSON.stringify(report, null, 2)))
    .catch(error => {
      console.error(error instanceof PaymentProviderError ? error.message : "Live commissioning could not complete. Preserve the receipt and inspect it before retrying.");
      process.exitCode = 1;
    });
}
