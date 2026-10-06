import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { normalizeKenyanPhone } from "../../lib/payments/bitika";
import { PaystackClient, meshPaystackReference, readPaystackConfig, verifiedPaystackCollection, type PaystackConfig } from "../../lib/payments/paystack";
import { PaymentProviderError } from "../../lib/payments/types";

const receiptSchema = z.object({
  paymentId: z.string().uuid(), reference: z.string(), createdAt: z.string().datetime(),
  mode: z.literal("live"), tag: z.literal("mesh"), amountKes: z.literal(10),
  bindingDigest: z.string().regex(/^[a-f0-9]{64}$/), initiationStarted: z.literal(true),
  providerStatus: z.string(), collectionConfirmed: z.boolean(),
  bitcoinSettlement: z.literal("pending"), verifiedBitcoinDelivery: z.literal(false),
  checkedAt: z.string().datetime().optional(),
});
type Receipt = z.infer<typeof receiptSchema>;
export type PaystackLiveAction = "collect" | "status";

// One separately selected Paystack test. No application DB, engine writes,
// wallet send, router jobs or grants. Never retry POST, including after timeout.
export async function commissionPaystackLive(action: PaystackLiveAction, config: PaystackConfig,
  phone?: string, directory = resolve("artifacts/mesh-lab/private/paystack-live"), fetcher: typeof fetch = fetch) {
  if (config.mode !== "live" || !config.secretKey.startsWith("sk_live_")) throw new PaymentProviderError("Live commissioning requires a production Paystack key");
  const client = new PaystackClient(config, fetcher);
  await mkdir(directory, { recursive: true });
  const filename = join(directory, "purchase.json");
  const lockPath = join(directory, "purchase.lock");
  let lock;
  try { lock = await open(lockPath, "wx"); } catch { throw new PaymentProviderError("Another operation holds the purchase lock. Check that process before removing a stale lock."); }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
    let receipt: Receipt | undefined;
    try { receipt = receiptSchema.parse(JSON.parse(await readFile(filename, "utf8"))); } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw new PaymentProviderError("Preserve and inspect the retained purchase before another collection");
    }
    const normalizedPhone = phone ? normalizeKenyanPhone(phone) : undefined;
    const bindingDigest = normalizedPhone && config.receiptEmail ? createHash("sha256").update(JSON.stringify([normalizedPhone, config.receiptEmail, config.secretKey, "KES", 10, "mesh"])).digest("hex") : undefined;
    if (receipt && (receipt.reference !== meshPaystackReference(receipt.paymentId) || (bindingDigest && receipt.bindingDigest !== bindingDigest))) throw new PaymentProviderError("The retained payment belongs to different purchase details");
    const persist = async () => {
      const temporary = filename + "." + randomUUID() + ".tmp";
      await writeFile(temporary, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
      await rename(temporary, filename);
    };
    if (!receipt && action === "collect") {
      if (!normalizedPhone || !bindingDigest || !config.receiptEmail) throw new PaymentProviderError("Configure the real payer phone and receipt email before collection", 400);
      const paymentId = randomUUID();
      receipt = { paymentId, reference: meshPaystackReference(paymentId), createdAt: new Date().toISOString(),
        mode: "live", tag: "mesh", amountKes: 10, bindingDigest, initiationStarted: true,
        providerStatus: "unconfirmed", collectionConfirmed: false, bitcoinSettlement: "pending", verifiedBitcoinDelivery: false };
      await persist(); // A process crash or ambiguous HTTP response cannot send another POST.
      const response = await client.collect({ paymentId, amountKes: 10, phone: normalizedPhone, email: config.receiptEmail });
      receipt.providerStatus = response.status;
      await persist();
    }
    if (!receipt) throw new PaymentProviderError("No retained Paystack purchase exists");
    const transaction = await client.getTransaction(receipt.reference);
    if (transaction) {
      const collection = verifiedPaystackCollection(transaction, receipt);
      receipt.providerStatus = collection.providerStatus;
      receipt.collectionConfirmed = collection.collectionConfirmed;
    }
    receipt.checkedAt = new Date().toISOString();
    await persist();
    return { ...receipt, bindingDigest: undefined, databaseWrites: false, routerAccessGranted: false, walletSend: false };
  } finally { await lock.close(); await unlink(lockPath); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const action = process.argv[2];
  if (action !== "collect" && action !== "status") {
    console.error("Usage: npm run paystack:live -- collect|status");
    process.exitCode = 1;
  } else Promise.resolve().then(() => commissionPaystackLive(action, readPaystackConfig(), process.env.PAYSTACK_TEST_PHONE))
    .then(report => console.log(JSON.stringify(report, null, 2)))
    .catch(error => { console.error(error instanceof PaymentProviderError ? error.message : "Preserve the purchase receipt and inspect its state before continuing"); process.exitCode = 1; });
}
