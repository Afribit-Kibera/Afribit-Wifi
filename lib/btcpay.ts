type CreateInvoiceInput = {
  paymentId: string;
  amountSats: number;
  packageName: string;
};

type BtcpayInvoice = {
  id: string;
  checkoutLink: string;
  status: string;
  additionalStatus?: string;
};

function config() {
  const serverUrl = process.env.BTCPAY_SERVER_URL?.replace(/\/$/, "");
  const storeId = process.env.BTCPAY_STORE_ID;
  const apiKey = process.env.BTCPAY_API_KEY;
  if (!serverUrl || !storeId || !apiKey || apiKey.startsWith("UNCONFIGURED_")) {
    throw new Error("BTCPay is not fully configured");
  }
  return { serverUrl, storeId, apiKey };
}

async function btcpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { serverUrl, apiKey } = config();
  const response = await fetch(`${serverUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `token ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`BTCPay request failed (${response.status}): ${message.slice(0, 300)}`);
  }
  return response.json() as Promise<T>;
}

export async function createBtcpayInvoice(input: CreateInvoiceInput) {
  const { storeId } = config();
  return btcpayFetch<BtcpayInvoice>(`/api/v1/stores/${storeId}/invoices`, {
    method: "POST",
    body: JSON.stringify({
      amount: (input.amountSats / 100_000_000).toFixed(8),
      currency: "BTC",
      metadata: {
        orderId: input.paymentId,
        itemDesc: input.packageName,
      },
      checkout: {
        redirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${input.paymentId}`,
        redirectAutomatically: false,
        defaultPaymentMethod: "BTC-LN",
      },
    }),
  });
}

export async function getBtcpayInvoice(invoiceId: string) {
  const { storeId } = config();
  return btcpayFetch<BtcpayInvoice>(`/api/v1/stores/${storeId}/invoices/${invoiceId}`);
}

export function mapBtcpayStatus(status: string) {
  switch (status.toLowerCase()) {
    case "settled":
      return "settled" as const;
    case "processing":
      return "processing" as const;
    case "expired":
      return "expired" as const;
    case "invalid":
      return "invalid" as const;
    default:
      return "new" as const;
  }
}
