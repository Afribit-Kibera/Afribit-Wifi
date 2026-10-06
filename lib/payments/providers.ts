import { createBtcpayInvoice, getBtcpayInvoice, mapBtcpayStatus } from "../btcpay";
import { createBitikaProvider, getBitikaReadiness } from "./bitika";
import { createPaystackProvider, getPaystackReadiness } from "./paystack";
import { PaymentProviderError, type PaymentMethod, type PaymentProvider, type PaymentProviderId } from "./types";
import { meshAutomaticAccessEnabled } from "../mesh-access/config";

const btcpay: PaymentProvider = {
  id: "btcpay",
  async createCheckout(input) {
    const invoice = await createBtcpayInvoice(input);
    return { id: invoice.id, checkoutUrl: invoice.checkoutLink, metadata: {} };
  },
  async getSnapshot(invoiceId) {
    const invoice = await getBtcpayInvoice(invoiceId);
    return { status: mapBtcpayStatus(invoice.status), providerStatus: invoice.status };
  },
};

// Only construction of the selected provider reads its credentials. Bitika's
// availability cannot make BTCPay, vouchers, welcome or the mesh depend on it.
export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  if (id === "btcpay") {
    if (meshAutomaticAccessEnabled()) throw new PaymentProviderError("Direct Lightning checkout is being prepared. Choose M-Pesa or use a voucher.");
    return btcpay;
  }
  if (id === "paystack") {
    if (!getPaystackReadiness().checkoutReady) throw new PaymentProviderError("M-Pesa checkout is not available yet");
    return createPaystackProvider();
  }
  if (!getBitikaReadiness().checkoutReady) throw new PaymentProviderError("M-Pesa checkout is not available yet");
  return createBitikaProvider();
}

export function getPaymentMethods(): PaymentMethod[] {
  const mpesa: PaymentProviderId | null = getBitikaReadiness().checkoutReady ? "bitika" : getPaystackReadiness().checkoutReady ? "paystack" : null;
  return [
    ...(!meshAutomaticAccessEnabled() ? [{ id: "btcpay" as const, label: "Bitcoin · Lightning", currency: "BTC" as const }] : []),
    ...(mpesa ? [{ id: mpesa, label: "M-Pesa", currency: "KES" as const }] : []),
  ];
}
