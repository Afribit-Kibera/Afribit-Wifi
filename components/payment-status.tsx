"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import Link from "next/link";
import type { MeshNativeStatus } from "@/lib/mesh-access/status-types";
import { customerPaymentState } from "@/lib/payments/customer-progress";
import { MeshOnlineSuccess } from "@/components/mesh-online-success";

export function PaymentStatus({ paymentId, initialStatus, checkoutUrl, provider = "btcpay", initialResolutionRequired = false, initialNativeAccess = null, initialProviderStatus, initialCollectionConfirmed = false, initialSettlementStatus }: {
  paymentId: string; initialStatus: string; checkoutUrl: string | null; provider?: string;
  initialResolutionRequired?: boolean; initialNativeAccess?: MeshNativeStatus | null;
  initialProviderStatus?: string; initialCollectionConfirmed?: boolean; initialSettlementStatus?: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pollError, setPollError] = useState(false);
  const [resolutionRequired, setResolutionRequired] = useState(initialResolutionRequired);
  const [nativeAccess, setNativeAccess] = useState<MeshNativeStatus | null>(initialNativeAccess);
  const [providerStatus, setProviderStatus] = useState(initialProviderStatus);
  const [collectionConfirmed, setCollectionConfirmed] = useState(initialCollectionConfirmed);
  const [settlementStatus, setSettlementStatus] = useState(initialSettlementStatus);
  const state = customerPaymentState({ status, providerStatus, collectionConfirmed, resolutionRequired, settlementStatus, nativeAccess });

  useEffect(() => {
    if (nativeAccess?.status !== "active" || !nativeAccess.expiresAt) return;
    const deadline = Date.parse(nativeAccess.expiresAt);
    if (!Number.isFinite(deadline)) return;
    let timer: number;
    const expire = () => {
      const remaining = deadline - Date.now();
      if (remaining > 0) { timer = window.setTimeout(expire, Math.min(remaining, 3_600_000)); return; }
      setNativeAccess(previous => previous?.status === "active" && previous.expiresAt === nativeAccess.expiresAt ? { ...previous, status: "expired" } : previous);
    };
    timer = window.setTimeout(expire, Math.max(0, Math.min(deadline - Date.now(), 3_600_000)));
    return () => window.clearTimeout(timer);
  }, [nativeAccess?.status, nativeAccess?.expiresAt]);

  useEffect(() => {
    if (["expired", "invalid", "refunded"].includes(status) || ["active", "expired"].includes(nativeAccess?.status ?? "")) return;
    let cancelled = false, inFlight = false;
    const check = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
        if (cancelled) return;
        if (!response.ok) { setPollError(true); return; }
        const data = await response.json();
        if (cancelled) return;
        setPollError(Boolean(data.reconciliationUnavailable));
        setResolutionRequired(Boolean(data.resolutionRequired));
        setStatus(data.status);
        setProviderStatus(data.providerStatus);
        setCollectionConfirmed(Boolean(data.collectionConfirmed));
        setSettlementStatus(data.settlementStatus);
        setNativeAccess(data.nativeAccess ?? null);
      } catch { if (!cancelled) setPollError(true); }
      finally { inFlight = false; }
    };
    void check();
    const timer = window.setInterval(check, 2500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [paymentId, status, nativeAccess?.status]);

  if (state === "active") return <MeshOnlineSuccess expiresAt={nativeAccess?.expiresAt} />;
  if (state === "expired") return <div><h1 className="flow-heading">Your pass has ended.</h1><p className="flow-copy">Choose another pass when you’re ready to get back online.</p><Link className="flow-action" href="/?view=internet">Choose an internet pass</Link></div>;
  if (state === "failed") return <div><XCircle className="flow-status-symbol is-error" size={44} /><h1 className="flow-heading">Payment wasn’t completed.</h1><p className="flow-copy">If money left your M-Pesa account, don’t pay again. Keep this reference and ask Afribit for help.</p><p className="flow-note">Payment reference: {paymentId}</p><Link className="flow-action secondary" href="/?view=internet">Back to internet passes</Link></div>;
  if (state === "review") return <div><Smartphone className="flow-status-symbol" size={40} /><h1 className="flow-heading">We’re checking your purchase.</h1><p className="flow-copy">{collectionConfirmed || status === "settled" ? "Your payment was received. " : ""}Your pass is taking longer than expected. Don’t pay again. Keep this page open; if it stays here, share the reference below with Afribit.</p><p className="flow-note">Payment reference: {paymentId}</p>{pollError ? <p className="flow-inline-status" role="status">We’ll check again when the connection returns.</p> : null}</div>;
  if (provider === "paystack" || provider === "bitika") {
    const connecting = state === "connecting", confirming = state === "confirming";
    const step = connecting ? 2 : confirming ? 1 : 0;
    return <div className="flow-payment-progress">
      <Image className="flow-mpesa-logo" src="/images/payments/mpesa.svg" alt="M-PESA" width={107} height={31} unoptimized />
      <ol className="flow-steps" aria-label="Payment progress">{["Approve on phone", "Confirm payment", "Get connected"].map((label, index) => <li key={label} data-state={index < step ? "done" : index === step ? "current" : "next"} aria-current={index === step ? "step" : undefined}><span>{index < step ? <CheckCircle2 size={16} aria-hidden="true" /> : index + 1}</span>{label}</li>)}</ol>
      <Loader2 className="flow-status-symbol flow-loading" size={36} />
      <h1 className="flow-heading">{connecting ? "Turning on your internet." : confirming ? collectionConfirmed ? "Payment received." : "Confirming your payment." : state === "approve" ? "Approve the M-Pesa prompt." : "Sending your M-Pesa prompt."}</h1>
      <p className="flow-copy">{connecting ? "Your payment is confirmed. Stay connected to Mesh. We’ll switch on your internet automatically and let you know when it’s ready." : confirming ? collectionConfirmed ? "We’re preparing your internet pass. Keep this page open; you don’t need to pay again." : "M-Pesa is confirming your payment. This can take a moment. Keep this page open and don’t pay again." : "Wait for the M-Pesa prompt on the number you entered, then approve it with your PIN. Enter your PIN only in that prompt. We’ll update this page automatically."}</p>
      {!connecting && !confirming ? <p className="flow-help">Already approved? Leave this page open while M-Pesa confirms. No prompt yet? Wait a moment and check that phone. Don’t start another payment.</p> : null}
      {pollError ? <p className="flow-inline-status" role="status">The connection is taking a moment. We’ll keep checking. Don’t pay again.</p> : null}
      <details className="flow-reference"><summary>Payment reference</summary><p>{paymentId}</p></details>
    </div>;
  }
  return <div><Loader2 className="flow-status-symbol flow-loading" size={40} /><h1 className="flow-heading">Complete your payment.</h1><p className="flow-copy">Pay the Lightning invoice with your Bitcoin wallet. We’ll confirm your payment here automatically.</p>{checkoutUrl && <a className="flow-action" href={checkoutUrl}>Open Bitcoin checkout</a>}{pollError ? <p className="flow-inline-status" role="status">We’ll keep checking. If you already paid, don’t pay again.</p> : null}</div>;
}
