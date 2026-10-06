import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { BitikaClient, readBitikaConfig, verifiedBitikaSnapshot } from "../../lib/payments/bitika";

async function main() {
  const config = readBitikaConfig();
  if (config.mode !== "test" || !config.apiKey.startsWith("bk_test_")) throw new Error("This script requires Bitika TEST credentials; live collections are refused");
  const client = new BitikaClient(config);
  const amountKes = 10;
  const scenarios = [
    { name: "fulfilled", phone: "254700123456", expected: "fulfilled" },
    { name: "declined", phone: "254700000001", expected: "failed" },
    { name: "settlement_failed", phone: "254700000002", expected: "payment_failed" },
  ];
  const quote = await client.quote(amountKes);
  const results = [];
  for (const scenario of scenarios) {
    const paymentId = randomUUID();
    const request = { paymentId, amountKes, phone: scenario.phone };
    const started = await client.collect(request);
    const repeated = await client.collect(request);
    assert.equal(repeated.transaction_code, started.transaction_code, "Same reference must not initiate another collection");
    let transaction = await client.getTransaction(started.transaction_code);
    const deadline = Date.now() + 15_000;
    while (["processing", "processing_payment"].includes(transaction.status) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      transaction = await client.getTransaction(started.transaction_code);
    }
    assert.equal(transaction.status, scenario.expected);
    const snapshot = verifiedBitikaSnapshot(transaction, { bitika: { mode: "test", amountKes, lightningAddress: config.lightningAddress } });
    results.push({ scenario: scenario.name, transactionCode: transaction.transaction_code, status: transaction.status, normalizedStatus: snapshot.status, resolutionRequired: snapshot.resolutionRequired ?? false, idempotencyVerified: true, simulated: true });
  }
  const report = { checkedAt: new Date().toISOString(), mode: "test", moneyMoved: false, smsOrStkSent: false, quoteAvailable: quote.satsAmount > 0, destination: config.lightningAddress, results, databaseWrites: false, accessGrants: false, limitations: ["No signing secret was supplied; real callback delivery and live checkout remain uncommissioned."] };
  await mkdir("artifacts/mesh-lab/bitika-reference", { recursive: true });
  await writeFile("artifacts/mesh-lab/bitika-reference/adapter-sandbox-verification.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
}
main().catch(() => { console.error("Bitika sandbox verification failed. Live collections were not enabled; inspect the adapter configuration and provider documentation."); process.exitCode = 1; });
