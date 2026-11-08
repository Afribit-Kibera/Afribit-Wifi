"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Wallet } from "lucide-react";
import { formatKes } from "@/lib/utils";

export type LightningInvoiceView = {
  paymentRequest: string;
  amountSats: number;
  amountKes: number | null;
  savedKes: number;
  discountPercent: number;
  expiresAt: string;
  qrSvg: string;
};

function left(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// A Lightning invoice the customer pays from any Bitcoin wallet, on this
// phone or by scanning it with another one.
export function LightningInvoice({ invoice, pollError }: { invoice: LightningInvoiceView; pollError: boolean }) {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, []);
  const remaining = now === null ? null : Date.parse(invoice.expiresAt) - now;

  async function copy() {
    try { await navigator.clipboard.writeText(invoice.paymentRequest); setCopied(true); } catch { setCopied(false); }
  }

  return <div className="flow-lightning">
    <h1 className="flow-heading">Pay with Bitcoin.</h1>
    <p className="flow-lightning-amount"><strong>{invoice.amountSats.toLocaleString("en-KE")} sats</strong>
      {invoice.amountKes ? <span>{formatKes(invoice.amountKes)}{invoice.savedKes > 0 ? ` · you save ${formatKes(invoice.savedKes)} (${invoice.discountPercent}%)` : ""}</span> : null}</p>
    <div className="flow-lightning-qr" role="img" aria-label="Lightning invoice QR code" dangerouslySetInnerHTML={{ __html: invoice.qrSvg }} />
    <a className="flow-action" href={`lightning:${invoice.paymentRequest}`}><Wallet size={17} aria-hidden="true" /> Open wallet</a>
    <button type="button" className="flow-stay" onClick={copy}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? "Invoice copied" : "Copy invoice"}</button>
    <p className="flow-copy">Your internet starts by itself once the payment arrives. Keep this page open.</p>
    <p className="flow-help">No internet for your wallet? Scan the code with another phone, or switch this phone to mobile data to pay.</p>
    <p className="flow-note" role="timer">{remaining === null ? "" : remaining > 0 ? `This invoice expires in ${left(remaining)}.` : "This invoice has expired. Don’t pay it."}</p>
    {pollError ? <p className="flow-inline-status" role="status">We’ll keep checking. If you already paid, don’t pay again.</p> : null}
  </div>;
}
