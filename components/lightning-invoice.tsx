"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { blinkPayLink } from "@/lib/payments/wallet-links";
import { copyText, isSignInWindow } from "@/lib/browser";
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

const noop = () => () => {};

function left(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// A Lightning invoice. Tap the code to copy it; in Chrome or Safari, Blink can
// open straight to it. The Wi-Fi sign-in window cannot open other apps.
export function LightningInvoice({ invoice, pollError }: { invoice: LightningInvoiceView; pollError: boolean }) {
  const signInWindow = useSyncExternalStore(noop, () => isSignInWindow(navigator.userAgent), () => true);
  const [copied, setCopied] = useState<boolean | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, []);
  const remaining = now === null ? null : Date.parse(invoice.expiresAt) - now;
  const expired = remaining !== null && remaining <= 0;

  return <div className="flow-lightning">
    <div className="flow-lightning-head"><Image src="/images/payments/bitcoin.svg" alt="" width={34} height={34} unoptimized /><span>Bitcoin · Lightning</span></div>
    <h1 className="flow-heading">Pay with Bitcoin.</h1>
    <p className="flow-lightning-amount"><strong>{invoice.amountSats.toLocaleString("en-KE")} sats</strong>
      {invoice.amountKes ? <span>{formatKes(invoice.amountKes)}{invoice.savedKes > 0 ? <> · you save {formatKes(invoice.savedKes)}{invoice.discountPercent ? <span className="flow-save-stamp">SAVE {invoice.discountPercent}%</span> : null}</> : null}</span> : null}</p>
    <button type="button" className="flow-lightning-qr" data-copied={copied === true} disabled={expired}
      aria-label="Lightning invoice. Tap to copy." onClick={async () => setCopied(await copyText(invoice.paymentRequest))}>
      <span className="flow-lightning-code" dangerouslySetInnerHTML={{ __html: invoice.qrSvg }} />
      <span className="flow-lightning-tap">{copied ? <><Check size={15} aria-hidden="true" /> Copied</> : "Tap to copy"}</span>
    </button>
    <p className="flow-copy" role="status">{expired ? "This invoice has expired. Don’t pay it."
      : copied === false ? "Couldn’t copy. Scan the code with another phone instead."
      : copied ? "Now open Blink, tap Send, then Paste."
      : signInWindow ? "Tap the code to copy it. Then open Blink, tap Send, and Paste." : "Open Blink to pay, or tap the code to copy it."}</p>
    {!signInWindow && !expired ? <a className="flow-action" href={blinkPayLink(invoice.paymentRequest)}>Open Blink</a> : null}
    <p className="flow-note" role="timer">{remaining !== null && !expired ? `Your internet starts by itself once you pay. Expires in ${left(remaining)}.` : ""}</p>
    {pollError ? <p className="flow-inline-status" role="status">We’ll keep checking. If you already paid, don’t pay again.</p> : null}
    <Link className="flow-stay" href="/?view=internet">Pay with M-Pesa instead</Link>
  </div>;
}
