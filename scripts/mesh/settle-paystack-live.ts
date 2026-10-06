import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { PaystackClient, readPaystackConfig, verifiedPaystackCollection } from "../../lib/payments/paystack";
import { InsatsSettlementClient, readEngineConfig } from "../../lib/payments/insats-engine";
import { PaymentProviderError } from "../../lib/payments/types";

const retainedSchema = z.object({ paymentId: z.string().uuid(), reference: z.string(), amountKes: z.literal(10), mode: z.literal("live"), collectionConfirmed: z.boolean() });

export async function settleRetainedPurchase(receiptPath: string, statusOnly = false) {
  const receipt = retainedSchema.parse(JSON.parse(await readFile(receiptPath, "utf8")));
  const provider = new PaystackClient(readPaystackConfig());
  const transaction = await provider.getTransaction(receipt.reference);
  if (!transaction || !verifiedPaystackCollection(transaction, receipt).collectionConfirmed) throw new PaymentProviderError("The retained M-Pesa collection is not confirmed; no Bitcoin send is allowed");
  const engine = new InsatsSettlementClient(readEngineConfig());
  const settlement = statusOnly ? await engine.getReceipt(receipt.paymentId, receipt.amountKes) : await engine.settle(receipt.paymentId, receipt.amountKes);
  const report = { ...settlement, bitcoinSettlement: settlement.verifiedBitcoinDelivery ? "settled" : settlement.status,
    routerAccessGranted: false, newMpesaRequest: false, engineOwnsPayout: true, checkedAt: new Date().toISOString() };
  // Keep original fiat receipt unchanged. A separate record links both rails.
  const target = resolve(dirname(receiptPath), "bitcoin-settlement.json");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(report, null, 2) + "\n");
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const action = process.argv[2];
  const filename = process.argv[3];
  if (!filename || !["settle", "status"].includes(action)) {
    console.error("Usage: npm run paystack:settle -- settle|status <retained-purchase.json>");
    process.exitCode = 1;
  } else settleRetainedPurchase(resolve(filename), action === "status")
    .then(report => console.log(JSON.stringify(report, null, 2)))
    .catch(error => { console.error(error instanceof PaymentProviderError ? error.message : "Inspect the retained settlement before continuing"); process.exitCode = 1; });
}
