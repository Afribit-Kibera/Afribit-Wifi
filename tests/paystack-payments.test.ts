import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { PaystackClient, createPaystackProvider, getPaystackReadiness, meshPaystackReference, readPaystackConfig, verifiedPaystackCollection, verifyPaystackSignature, type PaystackTransaction } from "../lib/payments/paystack";
import { BlinkReceiveClient, readBlinkConfig } from "../lib/payments/blink";
import { commissionPaystackLive } from "../scripts/mesh/commission-paystack-live";

const config = { mode: "live" as const, secretKey: "sk_live_fixture", receiptEmail: "payer@example.org" };
function transaction(paymentId: string): PaystackTransaction {
  return { reference: meshPaystackReference(paymentId), status: "success", amount: 1000, currency: "KES", domain: "live", channel: "mobile_money",
    metadata: { tag: "mesh", source: "mesh", meshPaymentId: paymentId } };
}

test("Paystack validates environment and collection cannot enable customer checkout before BTC settlement", () => {
  assert.throws(() => readPaystackConfig({ PAYSTACK_MODE: "test", PAYSTACK_SECRET_KEY: "sk_live_fixture" }));
  assert.throws(() => readPaystackConfig({ PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_fixture", PAYSTACK_PUBLIC_KEY: "pk_test_fixture" }));
  assert.equal(getPaystackReadiness({}).configured, false);
  const readiness = getPaystackReadiness({ PAYSTACK_ENABLED: "true", PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: config.secretKey, PAYSTACK_RECEIPT_EMAIL: config.receiptEmail });
  assert.equal(readiness.configured, true);
  assert.equal(readiness.checkoutReady, false);
});

test("M-Pesa charge uses KES subunits, a stable Mesh reference and tag, with no automatic retry", async () => {
  const id = randomUUID();
  let attempts = 0;
  const client = new PaystackClient(config, async (url, init) => {
    attempts++;
    assert.equal(url, "https://api.paystack.co/charge");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer sk_live_fixture");
    assert.equal(init?.redirect, "error");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.amount, 1000);
    assert.equal(body.currency, "KES");
    assert.equal(body.reference, meshPaystackReference(id));
    assert.deepEqual(body.mobile_money, { phone: "+254712345678", provider: "mpesa" });
    assert.equal(body.metadata.tag, "mesh");
    assert.equal(body.metadata.meshPaymentId, id);
    throw new Error("timeout after provider acceptance; private key and phone");
  });
  await assert.rejects(client.collect({ paymentId: id, amountKes: 10, phone: "0712345678", email: config.receiptEmail }), error => error instanceof Error && /don’t pay again/.test(error.message) && !/private key/.test(error.message));
  assert.equal(attempts, 1);
});

test("Collection verification binds currency, subunits, mode, channel, reference and Mesh metadata", () => {
  const id = randomUUID();
  const value = transaction(id);
  const expected = { paymentId: id, amountKes: 10, mode: "live" as const };
  assert.equal(verifiedPaystackCollection(value, expected).collectionConfirmed, true);
  assert.equal(verifiedPaystackCollection({ ...value, metadata: JSON.stringify(value.metadata) }, expected).collectionConfirmed, true);
  for (const wrong of [{ ...value, amount: 10 }, { ...value, currency: "NGN" }, { ...value, domain: "test" as const }, { ...value, reference: meshPaystackReference(randomUUID()) }, { ...value, channel: "card" }, { ...value, metadata: { tag: "other" } }, { ...value, metadata: { tag: "mesh", source: "mesh", meshPaymentId: randomUUID() } }]) assert.throws(() => verifiedPaystackCollection(wrong, expected));
  assert.equal(verifiedPaystackCollection({ ...value, status: "pending" }, expected).collectionConfirmed, false);
});

test("Successful fiat collection never becomes a settled Bitcoin snapshot or access grant", async () => {
  const id = randomUUID();
  const provider = createPaystackProvider(new PaystackClient(config, async () => Response.json({ status: true, data: transaction(id) })));
  const snapshot = await provider.getSnapshot(meshPaystackReference(id), { paystack: { paymentId: id, amountKes: 10, mode: "live" } });
  assert.equal(snapshot.status, "processing");
  assert.equal(snapshot.collectionConfirmed, true);
  assert.equal(snapshot.amountSats, undefined);
  assert.equal(snapshot.paymentHash, undefined);
});

test("Paystack raw-body HMAC rejects tampering, malformed headers and test credentials", () => {
  const body = '{"event":"charge.success"}';
  const signature = createHmac("sha512", config.secretKey).update(body).digest("hex");
  assert.equal(verifyPaystackSignature(body, signature, config.secretKey), true);
  assert.equal(verifyPaystackSignature(body + " ", signature, config.secretKey), false);
  for (const invalid of [null, "abc", "x".repeat(128)]) assert.equal(verifyPaystackSignature(body, invalid, config.secretKey), false);
  assert.equal(verifyPaystackSignature(body, signature, "sk_test_fixture"), false);
});

test("Restart after ambiguous collection or provider failure only queries the preserved reference", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-paystack-fixture-"));
  let posts = 0;
  const fetcher: typeof fetch = async (url, init) => {
    if (init?.method === "POST") { posts++; throw new Error("ambiguous timeout"); }
    const reference = String(url).split("/").pop()!;
    return Response.json({ status: true, data: transaction(reference.slice(5)) });
  };
  try {
    await assert.rejects(commissionPaystackLive("collect", config, "0712345678", directory, fetcher));
    const before = JSON.parse(await readFile(join(directory, "purchase.json"), "utf8"));
    const result = await commissionPaystackLive("collect", config, "0712345678", directory, fetcher);
    assert.equal(result.reference, before.reference);
    assert.equal(posts, 1);
    assert.equal(result.collectionConfirmed, true);
    assert.equal(result.verifiedBitcoinDelivery, false);
    assert.equal(result.routerAccessGranted, false);
    assert.equal(result.walletSend, false);
    await assert.rejects(commissionPaystackLive("collect", config, "0799999999", directory, fetcher));
    assert.equal(posts, 1);
  } finally {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("mesh-paystack-fixture-")) throw new Error("Unsafe fixture cleanup target");
    await rm(target, { recursive: true, force: true });
  }
});

test("Blink receiving operations enforce BTC wallet and exact invoice amount/hash/status without sending", async () => {
  const walletId = randomUUID();
  const config = readBlinkConfig({ BLINK_API_KEY: "blink_fixture", BLINK_BTC_WALLET_ID: walletId });
  const paymentId = randomUUID();
  const invoice = { paymentRequest: "lnbcfixture", paymentHash: "ab".repeat(32), satoshis: 90 };
  let status = "PENDING";
  const queries: string[] = [];
  const client = new BlinkReceiveClient(config, async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    queries.push(body.query);
    assert.equal(new Headers(init?.headers).get("X-API-KEY"), "blink_fixture");
    if (body.query.includes("MeshWalletCheck")) return Response.json({ data: { me: { defaultAccount: { wallets: [{ id: walletId, walletCurrency: "BTC" }] } } } });
    if (body.query.includes("MeshInvoiceCreate")) {
      assert.equal(body.variables.input.walletId, walletId);
      assert.equal(body.variables.input.amount, 90);
      return Response.json({ data: { lnInvoiceCreate: { errors: [], invoice } } });
    }
    return Response.json({ data: { lnInvoicePaymentStatusByPaymentRequest: { status, paymentHash: invoice.paymentHash, paymentRequest: invoice.paymentRequest } } });
  });
  const owned = await client.createReceiveInvoice(paymentId, 90);
  assert.equal((await client.getReceiveStatus(owned)).verifiedBitcoinDelivery, false);
  status = "PAID";
  assert.equal((await client.getReceiveStatus(owned)).verifiedBitcoinDelivery, true);
  await assert.rejects(client.getReceiveStatus({ ...owned, walletId: randomUUID() }));
  assert.equal(queries.some(query => /PaymentSend|conversion/i.test(query)), false);
  const wrongWallet = new BlinkReceiveClient(config, async () => Response.json({ data: { me: { defaultAccount: { wallets: [{ id: walletId, walletCurrency: "USD" }] } } } }));
  await assert.rejects(wrongWallet.verifyWallet());
});
