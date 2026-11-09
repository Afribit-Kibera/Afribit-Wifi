"use client";

import { useEffect, useRef, useState } from "react";
import { MeshNoticeBanner } from "./mesh-notice-banner";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, Smartphone, Tv, Users, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { DeviceCode, type Code } from "@/components/device-code";
import { FreeOnMesh } from "@/components/free-on-mesh";
import { formatDuration, formatKes } from "@/lib/utils";
import type { PaymentMethod, PaymentProviderId } from "@/lib/payments/types";
import { customerPaymentMethods } from "@/lib/payments/customer-methods";
import { bitcoinPriceKes } from "@/lib/payments/bitcoin-price";

type WifiPackage = {
  id: string;
  name: string;
  description: string | null;
  priceKes: number;
  priceSats: number;
  durationMinutes: number;
  speedLimitKbps: number | null;
  kind?: string;
  deviceLimit?: number;
};

type PortalContext = {
  macAddress: string;
  ipAddress?: string;
  routerId?: string;
  loginUrl?: string;
  originalUrl?: string;
};

type PortalProps = {
  packages: WifiPackage[];
  portalContext: PortalContext;
  packagesUnavailable?: boolean;
  initialView?: "internet" | "voucher" | "free";
  initialDevice?: string;
  paymentMethods?: PaymentMethod[];
  notice?: { message: string; tone: "info" | "warning" } | null;
  // Set when this device's pass ran out in the last day.
  endedPass?: { name: string; endedAt: string; early: boolean } | null;
  // Set when a smart TV opened Mesh: it starts on its own code screen.
  tv?: { code: Code | null; onlineUntil: string | null } | null;
  initialCode?: string;
};

// One screen at a time: pick a pass, pick how to pay, pay.
type Step = "pass" | "method" | "mpesa" | "code" | "device" | "device-pay" | "device-show" | "free" | "tv";
const deviceKey = "mesh:for-device";

// One short line under each pass, so the list reads like tickets, not a price table.
function passCaption(minutes: number) {
  if (minutes < 1440) return "A little time online";
  if (minutes < 10080) return "Make the most of your day";
  if (minutes < 43200) return "Room for the whole week";
  return "Stay connected for longer";
}

// Price sets the ticket's printed material (see "Internet passes" in mesh-flow.css).
function passTier(priceKes: number) {
  return priceKes < 50 ? 1 : priceKes < 100 ? 2 : priceKes < 300 ? 3 : 4;
}

const meshMark = <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;

function TicketFace({ item }: { item: WifiPackage }) {
  return <>
    <span className="flow-ticket-body"><span className="flow-ticket-chip">{meshMark}</span><strong>{formatDuration(item.durationMinutes)}</strong>
      {item.kind === "household" ? <small><Users size={13} aria-hidden="true" /> Up to {item.deviceLimit ?? 2} devices</small> : item.kind === "tv" ? <small><Tv size={13} aria-hidden="true" /> For a TV</small> : <small>{passCaption(item.durationMinutes)}</small>}</span>
    <span className="flow-ticket-stub"><small>KES</small><b>{item.priceKes.toLocaleString("en-KE")}</b></span>
  </>;
}

function Screen({ title, back, children }: { title: string; back?: () => void; children: ReactNode }) {
  return <>
    {back ? <button type="button" className="flow-back" onClick={back}><ArrowLeft size={18} aria-hidden="true" /> Back</button> : null}
    <h1 className="flow-heading">{title}</h1>
    {children}
  </>;
}

export function PortalExperience({ packages, portalContext, packagesUnavailable = false, initialView = "internet", initialDevice = "", paymentMethods = [], notice = null, endedPass = null, initialCode = "", tv = null }: PortalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialView === "voucher" ? "code" : initialView === "free" ? "free" : tv ? "tv" : "pass");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  // Paying for another device (a TV, a child's phone) by the code it shows.
  const [forDevice, setForDevice] = useState(/^\d{6}$/.test(initialDevice) ? initialDevice : "");
  const [deviceInput, setDeviceInput] = useState("");
  const paymentRequest = useRef<{ identity: string; id: string } | null>(null);
  const methods = customerPaymentMethods(paymentMethods);
  const mpesa = methods.find(method => method.currency === "KES");
  const bitcoin = methods.find(method => method.currency === "BTC");
  const selected = packages.find(item => item.id === selectedId);
  const discount = bitcoin?.id === "lightning" ? bitcoin.discountPercent ?? 0 : 0;
  const hasDevice = /^(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(portalContext.macAddress);
  const validPhone = /^(?:0|\+?254)?[17]\d{8}$/.test(phone.replace(/[\s()-]/g, ""));

  // A device code from a scanned QR survives the trip through the router's
  // sign-in page in this tab, so the payer doesn't have to scan again.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (/^\d{6}$/.test(initialDevice)) { sessionStorage.setItem(deviceKey, JSON.stringify({ code: initialDevice, until: Date.now() + 30 * 60_000 })); return; }
        const saved = JSON.parse(sessionStorage.getItem(deviceKey) ?? "null");
        if (saved && /^\d{6}$/.test(saved.code) && saved.until > Date.now()) setForDevice(saved.code);
      } catch { /* Storage may be disabled. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDevice]);

  function go(next: Step) { setStep(next); setError(""); window.scrollTo({ top: 0 }); }
  function chooseDevice(value: string) {
    setForDevice(value);
    try { if (value) sessionStorage.setItem(deviceKey, JSON.stringify({ code: value, until: Date.now() + 30 * 60_000 })); else sessionStorage.removeItem(deviceKey); } catch { /* Storage may be disabled. */ }
  }
  function choosePass(id: string) {
    setSelectedId(id);
    if (methods.length > 1) go("method");
    else if (mpesa) go("mpesa");
    else if (bitcoin) void pay(bitcoin.id, id);
  }

  async function pay(provider: PaymentProviderId, packageId = selectedId, retried = false): Promise<void> {
    if (!packageId || !hasDevice || loading) return;
    const isMpesa = provider === mpesa?.id;
    if (isMpesa && !validPhone) { setError("Enter your M-Pesa number, for example 0712 345 678."); return; }
    setError("");
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const details = JSON.stringify([packageId, portalContext, provider, isMpesa ? phone.replace(/[\s()-]/g, "") : "", forDevice]);
      const identity = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(details)))).map(byte => byte.toString(16).padStart(2, "0")).join("");
      if (paymentRequest.current?.identity !== identity) {
        let retained: { identity?: string; id?: string } | null = null;
        try { retained = JSON.parse(sessionStorage.getItem("mesh:payment-request") ?? "null"); } catch { /* Memory reference remains usable when storage is unavailable. */ }
        paymentRequest.current = { identity, id: retained?.identity === identity && /^[0-9a-f-]{36}$/i.test(retained.id ?? "") ? retained.id! : crypto.randomUUID() };
        // Keep the logical reference across reloads without storing the phone
        // or network context in browser storage.
        try { sessionStorage.setItem("mesh:payment-request", JSON.stringify(paymentRequest.current)); } catch { /* Storage may be disabled. */ }
      }
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, ...portalContext, provider, requestId: paymentRequest.current.id, ...(isMpesa ? { phone } : {}), ...(forDevice ? { forDeviceCode: forDevice } : {}) }),
        signal: controller.signal,
      });
      const result = await response.json();
      // An accepted M-Pesa request can outlive a provider response error. Only
      // recover this exact browser-generated purchase, never an unrelated ID
      // or a provider-supplied destination. A status check cannot charge again.
      if (!response.ok && response.status >= 500 && isMpesa && result.paymentId === paymentRequest.current.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.paymentId)) {
        router.push(`/pay/${encodeURIComponent(result.paymentId)}`);
        return;
      }
      if (!response.ok && response.status < 500) {
        // Refused before any prompt was sent, so this reference is spent. The
        // next tap starts a new one instead of hitting the same refusal again.
        paymentRequest.current = null;
        try { sessionStorage.removeItem("mesh:payment-request"); } catch { /* Storage may be disabled. */ }
        if (result.code === "earlier_payment" && typeof result.paymentId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.paymentId)) {
          router.push(`/pay/${encodeURIComponent(result.paymentId)}`);
          return;
        }
        if (result.code === "reference_closed" && !retried) {
          window.clearTimeout(timeout);
          setLoading(false);
          return pay(provider, packageId, true);
        }
      }
      if (!response.ok) throw new Error(result.error ?? "We couldn’t start your payment. Please try again.");
      if (typeof result.checkoutUrl !== "string") throw new Error("The payment link is unavailable. Please try again.");
      const checkoutUrl = new URL(result.checkoutUrl, window.location.origin);
      if (!["https:", "http:"].includes(checkoutUrl.protocol)) throw new Error("The payment link is unavailable. Please try again.");
      try { sessionStorage.removeItem("mesh:payment-request"); sessionStorage.removeItem(deviceKey); } catch { /* Checkout now has a concrete payment URL. */ }
      paymentRequest.current = null;
      window.location.assign(checkoutUrl.href);
    } catch (paymentError) {
      if (!isMpesa) {
        // No money moves before a Bitcoin invoice exists; the next tap starts a fresh request.
        paymentRequest.current = null;
        try { sessionStorage.removeItem("mesh:payment-request"); } catch { /* Storage may be disabled. */ }
      }
      setError(controller.signal.aborted ? "Still waiting for an answer. If an M-Pesa prompt appeared, don’t pay again." : paymentError instanceof TypeError ? "We lost the connection. If you approved an M-Pesa prompt, don’t pay again." : paymentError instanceof SyntaxError ? "We couldn’t confirm the payment. If you approved an M-Pesa prompt, don’t pay again." : paymentError instanceof Error ? paymentError.message : "We couldn’t confirm your payment. Don’t pay again if you approved a prompt.");
      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function redeem(event: FormEvent) {
    event.preventDefault();
    if (!hasDevice || loading) return;
    setError("");
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), ...portalContext }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "That code didn’t work. Check it and try again.");
      if (typeof result.accessGrantId !== "string") throw new Error("Your connection could not be confirmed. Please try again.");
      router.push(`/connected?grant=${encodeURIComponent(result.accessGrantId)}`);
    } catch (codeError) {
      setError(controller.signal.aborted ? "That took too long. Check your connection and try again." : codeError instanceof TypeError ? "We couldn’t reach Mesh. Check your connection and try again." : codeError instanceof SyntaxError ? "Something went wrong. Please try again shortly." : codeError instanceof Error ? codeError.message : "That code didn’t work. Please try again.");
      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const chosen = selected ? <div className="flow-ticket is-mini" data-tier={passTier(selected.priceKes)} role="note" aria-label={`Your pass: ${formatDuration(selected.durationMinutes)}, ${formatKes(selected.priceKes)}`}><TicketFace item={selected} /></div> : null;
  const reconnect = !hasDevice && ["pass", "code"].includes(step)
    ? <p className="flow-help">Connect to Mesh Wi-Fi first, then <a href="http://10.30.0.1/login">open the Mesh page</a>.</p> : null;

  return (
    <main className="mesh-flow">
      <section className={`mesh-flow-card mesh-portal-card${step === "tv" ? " is-tv" : ""}`}>
        <header className="flow-top">
          <Link href="/" aria-label="Mesh home" onClick={() => go("pass")}><BrandMark /></Link>
          <Link className="flow-top-link" href="/pass">My pass</Link>
        </header>
        <MeshNoticeBanner notice={notice} />

        {step === "pass" ? <Screen title="Choose a pass.">
          {reconnect}
          {endedPass ? <p className="flow-notice is-warning" role="status"><span><strong>Your {endedPass.name} pass {endedPass.early ? "was ended" : "ended"} at {endedPass.endedAt}.</strong> Choose a new pass to get back online.</span></p> : null}
          {forDevice ? <p className="flow-chip"><Tv size={16} aria-hidden="true" /><span>For another device · {forDevice.slice(0, 3)} {forDevice.slice(3)}</span>
            <button type="button" aria-label="Pay for this device instead" onClick={() => chooseDevice("")}><X size={16} aria-hidden="true" /></button></p> : null}
          {packages.length ? <ul className="flow-tickets" aria-label="Internet passes">
            {packages.map(item => <li key={item.id}><button type="button" className="flow-ticket" data-tier={passTier(item.priceKes)} disabled={loading || !hasDevice || !methods.length} onClick={() => choosePass(item.id)}>
              <TicketFace item={item} />
            </button></li>)}
          </ul> : <p className="flow-copy">{packagesUnavailable ? "Passes couldn’t load. Refresh in a moment." : "No passes are on sale right now. Please check again later."}</p>}
          {!methods.length && packages.length ? <p className="flow-help" role="status">Payments are paused for a moment. No money has been requested.</p> : null}
          {loading ? <p className="flow-copy" role="status"><Loader2 className="flow-loading" size={16} aria-hidden="true" /> Creating your invoice…</p> : null}
          <nav className="flow-links" aria-label="More options">
            <button type="button" onClick={() => go("code")}>Have a code?</button>
            <button type="button" onClick={() => go("device")}>Another device</button>
            <button type="button" onClick={() => go("free")}>Free on Mesh</button>
          </nav>
        </Screen> : null}

        {step === "method" && selected ? <Screen title="How will you pay?" back={() => go("pass")}>
          {chosen}
          <div className="flow-pay-options">
            {mpesa ? <button type="button" className="flow-pay is-mpesa" disabled={loading} onClick={() => go("mpesa")}>
              <Image src="/images/payments/mpesa.svg" alt="" width={88} height={26} unoptimized />
              <span><strong>M-Pesa</strong><small>A prompt on your phone</small></span>
              <span className="flow-pay-price">{formatKes(selected.priceKes)}</span>
            </button> : null}
            {bitcoin ? <button type="button" className="flow-pay is-bitcoin" disabled={loading} onClick={() => pay(bitcoin.id)}>
              {discount ? <span className="flow-stamp-badge" aria-hidden="true">SAVE {discount}%</span> : null}
              <Image src="/images/payments/bitcoin.svg" alt="" width={44} height={44} unoptimized />
              <span><strong>Bitcoin</strong><small>{discount ? `Lightning · Save ${discount}%` : "Lightning, with Blink"}</small></span>
              <span className="flow-pay-price">{loading ? <Loader2 className="flow-loading" size={18} aria-label="Creating your invoice" /> : discount ? <>{formatKes(bitcoinPriceKes(selected.priceKes, discount).amountKes)}<s>{formatKes(selected.priceKes)}</s></> : formatKes(selected.priceKes)}</span>
            </button> : null}
          </div>
        </Screen> : null}

        {step === "mpesa" && selected ? <Screen title="Pay with M-Pesa." back={() => go(methods.length > 1 ? "method" : "pass")}>
          {chosen}
          <form onSubmit={event => { event.preventDefault(); if (mpesa) void pay(mpesa.id); }}>
            <div className="flow-mpesa-head"><label className="flow-label" htmlFor="mesh-mpesa-phone">M-Pesa number</label><Image src="/images/payments/mpesa.svg" alt="M-PESA" width={96} height={28} unoptimized /></div>
            <div className="flow-phone"><span aria-hidden="true"><Smartphone size={18} /></span><input id="mesh-mpesa-phone" className="flow-input" type="tel" inputMode="tel" autoComplete="tel" autoFocus value={phone} onChange={event => setPhone(event.target.value)} placeholder="0712 345 678" maxLength={32} disabled={loading} /></div>
            <button type="submit" className="flow-action is-mpesa" disabled={loading || !mpesa || selected.priceKes < 10 || selected.priceKes > 10_000}>{loading ? <><Loader2 className="flow-loading" size={18} aria-hidden="true" /> Sending the prompt…</> : `Pay ${formatKes(selected.priceKes)}`}</button>
          </form>
          <p className="flow-note">Approve the prompt on your phone with your PIN. Your internet starts by itself.</p>
        </Screen> : null}

        {step === "code" ? <Screen title="Enter your code." back={() => go("pass")}>
          {reconnect}
          <form onSubmit={redeem}>
            <div className="flow-scratch"><div className="flow-scratch-head"><label htmlFor="mesh-voucher">Voucher or pass code</label><span aria-hidden="true">Mesh</span></div>
            <input id="mesh-voucher" className="flow-input" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="000000" inputMode="numeric" pattern="[0-9]{6}|[0-9]{10}" autoComplete="one-time-code" autoFocus spellCheck={false} minLength={6} maxLength={10} required disabled={loading} /></div>
            <button type="submit" className="flow-action" disabled={loading || !hasDevice || !/^(?:\d{6}|\d{10})$/.test(code)}>{loading ? <><Loader2 className="flow-loading" size={18} aria-hidden="true" /> Checking…</> : "Connect"}</button>
          </form>
          <p className="flow-note">6 digits from a ticket, or the 10-digit code of a pass you bought.</p>
        </Screen> : null}

        {step === "device" ? <Screen title="Another device." back={() => go("pass")}>
          <div className="flow-options">
            <button type="button" className="flow-option" onClick={() => go("device-pay")}><Tv size={22} aria-hidden="true" /><span><strong>Pay for a TV or another phone</strong><small>Scan or type the code it shows</small></span><ChevronRight size={18} aria-hidden="true" /></button>
            <button type="button" className="flow-option" onClick={() => go("device-show")}><Smartphone size={22} aria-hidden="true" /><span><strong>Someone else pays for this one</strong><small>Show them this device’s code</small></span><ChevronRight size={18} aria-hidden="true" /></button>
          </div>
        </Screen> : null}

        {step === "device-pay" ? <Screen title="Scan the other device." back={() => go("device")}>
          <p className="flow-copy">On the TV or phone, open Mesh and tap <strong>Another device</strong>, then <strong>Someone else pays</strong>. Scan its QR with your camera, or type its code.</p>
          <form onSubmit={event => { event.preventDefault(); if (deviceInput.length === 6) { chooseDevice(deviceInput); go("pass"); } }}>
            <label className="flow-label" htmlFor="mesh-device-code">Code on the other device</label>
            <input id="mesh-device-code" className="flow-input" inputMode="numeric" placeholder="000 000" maxLength={6} value={deviceInput} onChange={event => setDeviceInput(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            <button type="submit" className="flow-action" disabled={deviceInput.length !== 6}>Choose a pass for it</button>
          </form>
          <p className="flow-note">Have a household pass? <Link href={deviceInput.length === 6 ? `/pass?device=${deviceInput}` : "/pass"}>Add it to your pass</Link> instead.</p>
        </Screen> : null}

        {step === "device-show" ? <Screen title="Show this to the payer." back={() => go("device")}>
          <DeviceCode />
        </Screen> : null}

        {step === "tv" && tv ? <Screen title="Pay from your phone.">
          {endedPass ? <p className="flow-notice is-warning" role="status"><span><strong>This TV’s {endedPass.name} pass {endedPass.early ? "was ended" : "ended"} at {endedPass.endedAt}.</strong></span></p> : null}
          <div className="flow-tv">
            <ol className="flow-tv-steps">
              <li>Connect your phone to <strong>Mesh</strong> Wi-Fi.</li>
              <li>Open the phone’s camera and scan this code.</li>
              <li>Choose a TV pass and pay. This TV comes online by itself.</li>
            </ol>
            <DeviceCode tv initial={tv.code} initialOnlineUntil={tv.onlineUntil} />
          </div>
          <p className="flow-note">Already have a household pass? Scan the code and choose <strong>Add it to your pass</strong>.</p>
          <button type="button" className="flow-stay" onClick={() => go("pass")}>Buy on this TV instead</button>
          <button type="button" className="flow-stay" onClick={() => go("code")}>Enter a voucher or pass code</button>
        </Screen> : null}

        {step === "free" ? <Screen title="Free on Mesh." back={() => go("pass")}>
          <FreeOnMesh />
        </Screen> : null}

        {error ? <p className="flow-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}
