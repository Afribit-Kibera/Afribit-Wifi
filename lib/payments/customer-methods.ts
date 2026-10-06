import type { PaymentMethod } from "./types";

// The customer chooses a payment method, never our collection provider.
// Choosing an available provider happens before a request is made; this does
// not retry or fail over an in-flight M-Pesa collection.
export function customerPaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  const mpesa = methods.find(method => method.id === "bitika" && method.currency === "KES")
    ?? methods.find(method => method.id === "paystack" && method.currency === "KES");
  const bitcoin = methods.find(method => method.id === "btcpay" && method.currency === "BTC");
  return [
    ...(mpesa ? [{ ...mpesa, label: "M-Pesa" }] : []),
    ...(bitcoin ? [{ ...bitcoin, label: "Bitcoin · Lightning" }] : []),
  ];
}
