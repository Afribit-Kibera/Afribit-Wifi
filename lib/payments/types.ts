export const paymentProviderIds = ["btcpay", "bitika", "paystack"] as const;
export type PaymentProviderId = (typeof paymentProviderIds)[number];
export type PaymentState = "new" | "processing" | "settled" | "expired" | "invalid" | "refunded";

export type PaymentMethod = { id: PaymentProviderId; label: string; currency: "BTC" | "KES" };
export type CheckoutInput = {
  paymentId: string;
  amountSats: number;
  amountKes: number;
  packageName: string;
  phone?: string;
};
export type ProviderCheckout = { id: string; checkoutUrl: string; metadata: Record<string, unknown> };
export type ProviderSnapshot = {
  status: PaymentState;
  providerStatus: string;
  amountSats?: number;
  paymentHash?: string;
  resolutionRequired?: boolean;
  collectionConfirmed?: boolean;
  verifiedBitcoinDelivery?: boolean;
  settlementStatus?: string;
  sourceTransactionId?: string;
};
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createCheckout(input: CheckoutInput): Promise<ProviderCheckout>;
  getSnapshot(invoiceId: string, metadata: Record<string, unknown>): Promise<ProviderSnapshot>;
}

export class PaymentProviderError extends Error {
  constructor(message: string, readonly httpStatus = 503) { super(message); }
}
