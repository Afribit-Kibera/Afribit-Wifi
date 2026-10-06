import { z } from "zod";
import { PaymentProviderError } from "./types";

const walletIdSchema = z.string().uuid();
const satsSchema = z.number().int().positive().max(2_147_483_647);
const invoiceSchema = z.object({ paymentRequest: z.string().regex(/^lnbc[0-9a-z]+$/i), paymentHash: z.string().regex(/^[a-f0-9]{64}$/i), satoshis: satsSchema });
export type BlinkConfig = { apiKey: string; walletId: string };
export type BlinkReceiveInvoice = z.infer<typeof invoiceSchema> & { walletId: string };

export function readBlinkConfig(env: Record<string, string | undefined> = process.env): BlinkConfig {
  const wallet = walletIdSchema.safeParse(env.BLINK_BTC_WALLET_ID);
  if (!env.BLINK_API_KEY?.startsWith("blink_") || !wallet.success || (env.BLINK_API_URL && env.BLINK_API_URL !== "https://api.blink.sv/graphql")) throw new PaymentProviderError("Bitcoin settlement is not configured");
  return { apiKey: env.BLINK_API_KEY, walletId: wallet.data };
}

export class BlinkReceiveClient {
  constructor(readonly config: BlinkConfig, private readonly fetcher: typeof fetch = fetch) {}
  private async query(query: string, variables: Record<string, unknown> = {}) {
    let response: Response;
    try {
      response = await this.fetcher("https://api.blink.sv/graphql", { method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": this.config.apiKey }, body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(12_000), redirect: "error", cache: "no-store" });
    } catch { throw new PaymentProviderError("Bitcoin settlement could not be confirmed"); }
    if (!response.ok) throw new PaymentProviderError("Bitcoin settlement is temporarily unavailable");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PaymentProviderError("Bitcoin settlement returned an unexpected response"); }
    const parsed = z.object({ data: z.record(z.string(), z.unknown()).optional(), errors: z.array(z.unknown()).optional() }).safeParse(payload);
    if (!parsed.success || parsed.data.errors?.length || !parsed.data.data) throw new PaymentProviderError("Bitcoin settlement could not be confirmed");
    return parsed.data.data;
  }
  async verifyWallet() {
    const data = await this.query("query MeshWalletCheck { me { defaultAccount { wallets { id walletCurrency } } } }");
    const parsed = z.object({ defaultAccount: z.object({ wallets: z.array(z.object({ id: z.string(), walletCurrency: z.string() })) }) }).safeParse(data.me);
    if (!parsed.success || !parsed.data.defaultAccount.wallets.some(wallet => wallet.id === this.config.walletId && wallet.walletCurrency === "BTC")) throw new PaymentProviderError("The receiving Bitcoin wallet could not be verified");
    return { walletId: this.config.walletId, walletCurrency: "BTC" as const };
  }
  // Receiving only. This client has no wallet-send or fiat-conversion method.
  async createReceiveInvoice(paymentId: string, amountSats: number): Promise<BlinkReceiveInvoice> {
    if (!z.string().uuid().safeParse(paymentId).success || !satsSchema.safeParse(amountSats).success) throw new PaymentProviderError("Invalid Bitcoin settlement amount or reference", 400);
    await this.verifyWallet();
    const data = await this.query("mutation MeshInvoiceCreate($input: LnInvoiceCreateInput!) { lnInvoiceCreate(input: $input) { invoice { paymentRequest paymentHash satoshis } errors { code } } }",
      { input: { walletId: this.config.walletId, amount: amountSats, externalId: `mesh-${paymentId}`, memo: `Mesh ${paymentId}` } });
    const parsed = z.object({ invoice: invoiceSchema, errors: z.array(z.unknown()) }).safeParse(data.lnInvoiceCreate);
    if (!parsed.success || parsed.data.errors.length || parsed.data.invoice.satoshis !== amountSats) throw new PaymentProviderError("The receiving Bitcoin invoice could not be confirmed");
    return { ...parsed.data.invoice, walletId: this.config.walletId };
  }
  async getReceiveStatus(invoice: BlinkReceiveInvoice) {
    if (invoice.walletId !== this.config.walletId || !invoiceSchema.safeParse(invoice).success) throw new PaymentProviderError("The Bitcoin invoice does not match the receiving wallet");
    const data = await this.query("query MeshInvoiceStatus($input: LnInvoicePaymentStatusByPaymentRequestInput!) { lnInvoicePaymentStatusByPaymentRequest(input: $input) { status paymentHash paymentRequest } }", { input: { paymentRequest: invoice.paymentRequest } });
    const parsed = z.object({ status: z.enum(["PAID", "PENDING", "EXPIRED"]), paymentHash: z.string(), paymentRequest: z.string() }).safeParse(data.lnInvoicePaymentStatusByPaymentRequest);
    if (!parsed.success || parsed.data.paymentHash !== invoice.paymentHash || parsed.data.paymentRequest !== invoice.paymentRequest) throw new PaymentProviderError("The Bitcoin receipt does not match the stored invoice");
    return { status: parsed.data.status, verifiedBitcoinDelivery: parsed.data.status === "PAID", amountSats: invoice.satoshis, paymentHash: invoice.paymentHash };
  }
}
