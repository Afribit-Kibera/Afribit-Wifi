"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Compass, Globe, Link2, Loader2, MapPin, MessageCircle, Radio, ShieldCheck, Ticket, X, Zap } from "lucide-react";
import { formatDuration, formatKes, formatSats } from "@/lib/utils";
import type { PaymentMethod, PaymentProviderId } from "@/lib/payments/types";
import { customerPaymentMethods } from "@/lib/payments/customer-methods";

type WifiPackage = {
  id: string;
  name: string;
  description: string | null;
  priceKes: number;
  priceSats: number;
  durationMinutes: number;
  speedLimitKbps: number | null;
};

type PortalContext = {
  macAddress: string;
  ipAddress?: string;
  routerId?: string;
  loginUrl?: string;
  originalUrl?: string;
};

export type MeshPortalService = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "local" | "internet";
  label?: string;
};

type PortalProps = {
  packages: WifiPackage[];
  portalContext: PortalContext;
  services?: MeshPortalService[];
  blinkAccess?: "pending" | "enabled";
  packagesUnavailable?: boolean;
  initialView?: "welcome" | "internet" | "voucher";
  paymentMethods?: PaymentMethod[];
};

const views = [
  { id: "explore", label: "Explore mesh", shortLabel: "Explore", icon: Compass },
  { id: "apps", label: "Free apps", shortLabel: "Free apps", icon: BookOpen },
  { id: "internet", label: "Get internet", shortLabel: "Internet", icon: Globe },
] as const;

type View = (typeof views)[number]["id"];

function MeshSymbol({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function passCaption(minutes: number) {
  if (minutes < 1440) return "A little time online";
  if (minutes < 10080) return "Make the most of your day";
  if (minutes < 43200) return "Room for the whole week";
  return "Stay connected for longer";
}

function ServiceRows({ services }: { services: MeshPortalService[] }) {
  return (
    <div className="mesh-service-list">
      {services.map((service, index) => (
        <a className="mesh-service-row" key={service.id} href={service.href} target="_blank" rel="noopener noreferrer">
          <span className="mesh-service-icon" aria-hidden="true">{service.category === "internet" ? <Globe size={22} /> : index % 2 === 0 ? <MessageCircle size={22} /> : <BookOpen size={22} />}</span>
          <span className="mesh-service-copy"><strong>{service.title}</strong><span>{service.description}</span><small>{service.label ?? (service.category === "local" ? "On the local network" : "Free on Mesh")}</small></span>
          <ArrowUpRight className="mesh-service-arrow" size={23} aria-hidden="true" />
          <span className="mesh-sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

export function PortalExperience({ packages, portalContext, services = [], blinkAccess = "pending", packagesUnavailable = false, initialView = "welcome", paymentMethods = [{ id: "btcpay", label: "Bitcoin · Lightning", currency: "BTC" }] }: PortalProps) {
  const router = useRouter();
  const section = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const checkout = useRef<HTMLDivElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>(initialView === "welcome" ? "explore" : "internet");
  const [selectedId, setSelectedId] = useState(packages[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [voucherMode, setVoucherMode] = useState(initialView === "voucher");
  const [voucherCode, setVoucherCode] = useState("");
  const [showAllPasses, setShowAllPasses] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"about" | "blink" | null>(null);
  const customerMethods = customerPaymentMethods(paymentMethods);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderId>(customerMethods[0]?.id ?? "btcpay");
  const [phone, setPhone] = useState("");
  const paymentRequest = useRef<{ identity: string; id: string } | null>(null);
  const mpesaAvailable = paymentMethods.some(method => method.currency === "KES");
  const isMpesa = paymentProvider !== "btcpay";
  const selectedPackage = packages.find((item) => item.id === selectedId);
  const featuredPasses = Array.from(new Map([
    packages[0],
    packages.find((item) => item.durationMinutes === 1440),
    packages.find((item) => item.durationMinutes === 10080),
    ...packages.slice(0, 3),
  ].filter((item): item is WifiPackage => Boolean(item)).map((item) => [item.id, item])).values()).slice(0, 3);
  const compactCheckout = view === "internet";
  const visiblePasses = compactCheckout || showAllPasses ? packages : featuredPasses;
  const localServices = services.filter((service) => service.category === "local");
  const internetServices = services.filter((service) => service.category === "internet");
  const hasDevice = /^(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(portalContext.macAddress);
  const checkoutUnavailable = paymentMethods.length === 0;
  const validMpesaPhone = /^(?:0|\+?254)?[17]\d{8}$/.test(phone.replace(/[\s()-]/g, ""));

  function continueToCheckout() {
    checkout.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    if (isMpesa) phoneInput.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (modal && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);

  function chooseView(next: View, scroll = false) {
    setView(next);
    setError("");
    if (scroll) section.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex = event.key === "ArrowRight" ? (index + 1) % views.length : event.key === "ArrowLeft" ? (index + views.length - 1) % views.length : event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : null;
    if (nextIndex === null) return;
    event.preventDefault();
    chooseView(views[nextIndex].id);
    document.getElementById(`mesh-tab-${views[nextIndex].id}`)?.focus();
  }

  async function startPayment() {
    if (!selectedId || !hasDevice || loading || checkoutUnavailable) return;
    if (isMpesa && !validMpesaPhone) {
      setError("Enter your M-Pesa phone number, for example 0712 345 678.");
      phoneInput.current?.focus();
      return;
    }
    setError("");
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const details = JSON.stringify([selectedId, portalContext, paymentProvider, isMpesa ? phone.replace(/[\s()-]/g, "") : ""]);
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
        body: JSON.stringify({ packageId: selectedId, ...portalContext, provider: paymentProvider, requestId: paymentRequest.current.id, ...(isMpesa ? { phone } : {}) }),
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
      if (!response.ok) throw new Error(result.error ?? "We couldn’t start your payment. Please try again.");
      if (typeof result.checkoutUrl !== "string") throw new Error("The payment link is unavailable. Please try again.");
      const checkoutUrl = new URL(result.checkoutUrl, window.location.origin);
      if (!["https:", "http:"].includes(checkoutUrl.protocol)) throw new Error("The payment link is unavailable. Please try again.");
      try { sessionStorage.removeItem("mesh:payment-request"); } catch { /* Checkout now has a concrete payment URL. */ }
      paymentRequest.current = null;
      window.location.assign(checkoutUrl.href);
    } catch (paymentError) {
      setError(controller.signal.aborted ? "We are still waiting for a payment response. If an M-Pesa prompt appeared, do not pay again. Stay connected to Mesh." : paymentError instanceof TypeError ? "We lost the connection to checkout. If you approved an M-Pesa prompt, do not pay again while it is being confirmed." : paymentError instanceof SyntaxError ? "We could not confirm the payment response. If you approved an M-Pesa prompt, do not pay again." : paymentError instanceof Error ? paymentError.message : "We could not confirm your payment request. Do not pay again if you already approved a prompt.");
      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function redeemVoucher(event: FormEvent) {
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
        body: JSON.stringify({ code: voucherCode.trim(), ...portalContext }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "We couldn’t redeem that voucher. Check the code and try again.");
      if (typeof result.accessGrantId !== "string") throw new Error("Your connection could not be confirmed. Please try again.");
      router.push(`/connected?grant=${encodeURIComponent(result.accessGrantId)}`);
    } catch (voucherError) {
      setError(controller.signal.aborted ? "Your voucher check took too long. Check your connection before trying again." : voucherError instanceof TypeError ? "We couldn’t reach the voucher service. Check your connection and try again." : voucherError instanceof SyntaxError ? "The voucher service returned an unexpected response. Please try again shortly." : voucherError instanceof Error ? voucherError.message : "We couldn’t redeem that voucher. Please try again.");
      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <div className={`mesh-portal${compactCheckout ? " mesh-catalogue" : ""}`}>
      <a className="mesh-skip-link" href="#mesh-options">Skip to connection options</a>
      <header className="mesh-header">
        <button className="mesh-brand" type="button" onClick={() => { chooseView("internet"); setVoucherMode(false); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }} aria-label="Mesh home"><MeshSymbol /><span>Mesh</span></button>
        <div className="mesh-header-place"><MapPin size={14} aria-hidden="true" /><span>Kibera, Nairobi</span></div>
        <button className="mesh-header-about" type="button" onClick={() => setModal("about")}>What is Mesh? <ArrowUpRight size={16} aria-hidden="true" /></button>
      </header>

      <main className="mesh-main">
        {!compactCheckout ? <section className="mesh-hero" aria-labelledby="mesh-welcome">
          <div className="mesh-hero-copy">
            <span className="mesh-eyebrow mesh-hero-eyebrow"><span aria-hidden="true" /> A neighborhood network</span>
            <h1 id="mesh-welcome">Good things<br /><span>connect.</span></h1>
            <p>Connect to Mesh for free learning and selected apps. Choose an internet pass for everything else.</p>
            <div className="mesh-hero-actions">
              <button type="button" className="mesh-button mesh-button-citron" onClick={() => chooseView("explore", true)}>Explore the mesh <ArrowRight size={18} aria-hidden="true" /></button>
              <button type="button" className="mesh-button mesh-button-hero-secondary" onClick={() => chooseView("internet", true)}>Get internet <ArrowUpRight size={18} aria-hidden="true" /></button>
            </div>
            <div className="mesh-hero-note"><Link2 size={15} aria-hidden="true" /><span>Community Wi-Fi by Afribit.</span></div>
          </div>
          <div className="mesh-hero-art">
            <Image src="/images/mesh-neighborhood.webp" alt="Illustrative rooftop gathering in Nairobi" fill preload sizes="(max-width: 699px) calc(100vw - 76px), (max-width: 1199px) 46vw, 540px" className="mesh-hero-image" />
            <div className="mesh-art-caption"><span>Closer to home.</span><MeshSymbol /></div>
          </div>
        </section> : null}

        <section ref={section} className="mesh-options" id="mesh-options" aria-label="Your Mesh connection options">
          {!compactCheckout ? <><div className="mesh-option-heading"><span className="mesh-eyebrow">Your connection, your choice</span><span className="mesh-option-index" aria-hidden="true">01 — 03</span></div>
          <div className="mesh-tabs" role="tablist" aria-label="Connection options">
            {views.map((item, index) => (
              <button id={`mesh-tab-${item.id}`} key={item.id} type="button" role="tab" aria-selected={view === item.id} aria-controls={view === item.id ? `mesh-panel-${item.id}` : undefined} tabIndex={view === item.id ? 0 : -1} className="mesh-tab" onClick={() => chooseView(item.id)} onKeyDown={(event) => moveTab(event, index)}>
                <item.icon size={19} aria-hidden="true" /><span className="mesh-tab-long">{item.label}</span><span className="mesh-tab-short">{item.shortLabel}</span><ArrowUpRight size={17} className="mesh-tab-arrow" aria-hidden="true" />
              </button>
            ))}
          </div></> : null}

          <div className="mesh-panel" id={`mesh-panel-${view}`} role={compactCheckout ? "region" : "tabpanel"} aria-label={compactCheckout ? "Internet passes" : undefined} aria-labelledby={compactCheckout ? undefined : `mesh-tab-${view}`} tabIndex={0}>
            {view === "explore" ? (
              <div className="mesh-directory-layout">
                <div className="mesh-section-intro"><span className="mesh-eyebrow">The local side of Mesh</span><h2>Near you.<br />Here for you.</h2><p>Use services hosted on Mesh without buying an internet pass.</p><button type="button" className="mesh-text-button" onClick={() => setModal("about")}>Get to know Mesh <ArrowUpRight size={17} aria-hidden="true" /></button></div>
                <div className="mesh-directory-content">
                  <div className="mesh-section-rule"><span>Neighborhood spaces</span><span>{String(localServices.length).padStart(2, "0")}</span></div>
                  {localServices.length ? <ServiceRows services={localServices} /> : <div className="mesh-directory-empty"><Radio size={30} strokeWidth={1.5} aria-hidden="true" /><h3>No local services available yet.</h3><p>See free apps and learning resources, or choose an internet pass for browsing.</p></div>}
                  <div className="mesh-directory-footnote"><ShieldCheck size={16} aria-hidden="true" /><p>Free services do not need a pass. Other browsing does.</p></div>
                </div>
              </div>
            ) : view === "apps" ? (
              <div className="mesh-directory-layout">
                <div className="mesh-section-intro"><span className="mesh-eyebrow">Included on Mesh</span><h2>Use your apps.<br />No pass needed.</h2><p>Open these apps while connected to Mesh. You do not need to buy an internet pass.</p><span className="mesh-small-note">These apps need a working internet connection at Mesh.</span></div>
                <div className="mesh-directory-content">
                  <div className="mesh-section-rule"><span>Featured app</span><span>Bitcoin, made simple</span></div>
                  <button type="button" className="mesh-blink-card" onClick={() => setModal("blink")}>
                    <span className="mesh-blink-icon" aria-hidden="true"><Image src="/images/apps/blink.svg" width={36} height={36} alt="" unoptimized /></span>
                    <span className="mesh-blink-copy"><span className="mesh-eyebrow">Everyday bitcoin</span><strong>Blink</strong><span>Send, receive and discover bitcoin with a Lightning wallet.</span></span>
                    <ArrowUpRight className="mesh-blink-arrow" size={24} aria-hidden="true" />
                    <span className="mesh-blink-status">{blinkAccess === "enabled" ? "Free on Mesh" : "Free access is not available yet"}</span>
                  </button>
                  {internetServices.length ? <><div className="mesh-section-rule mesh-rule-secondary"><span>More free services</span><span>{String(internetServices.length).padStart(2, "0")}</span></div><ServiceRows services={internetServices} /></> : null}
                  <div className="mesh-directory-footnote"><Globe size={16} aria-hidden="true" /><p>These apps need a working internet connection at Mesh. Other browsing and app downloads need a pass.</p></div>
                </div>
              </div>
            ) : (
              <div className="mesh-directory-layout mesh-internet-layout">
                <div className="mesh-section-intro"><span className="mesh-eyebrow">Afribit · Powered by Bitcoin</span><h1>{voucherMode ? "Use your voucher." : "Get online."}</h1><p>{voucherMode ? "One code. Internet on this device." : checkoutUnavailable ? "Internet passes are temporarily unavailable." : `Choose a pass. ${mpesaAvailable ? "Pay with M-Pesa." : "Pay with Bitcoin."} Connect automatically.`}</p><div className="mesh-catalogue-actions"><button type="button" className="mesh-text-button" onClick={() => { setVoucherMode(!voucherMode); setError(""); }}><Ticket size={17} aria-hidden="true" />{voucherMode ? "Choose an internet pass" : "Have a voucher?"}<ArrowRight size={16} aria-hidden="true" /></button></div></div>
                <div className="mesh-directory-content">
                  {!hasDevice ? <div className="mesh-session-note"><Radio size={20} aria-hidden="true" /><p><strong>Buying for this device?</strong><span>Connect to Mesh Wi-Fi and open its sign-in page first. That lets us apply your pass to the right device.</span><a href="http://10.30.0.1/login">Reconnect to Mesh checkout <ArrowRight size={14} aria-hidden="true" /></a></p></div> : null}
                  {!voucherMode ? (
                    <>
                      <div className="mesh-section-rule"><span>Choose your internet pass</span><span>No subscription</span></div>
                      {packages.length ? <div className="mesh-plans">
                        {visiblePasses.map((item) => (
                          <label key={item.id} className="mesh-plan" data-selected={selectedId === item.id}>
                            <input type="radio" name="mesh-pass" value={item.id} checked={selectedId === item.id} onChange={() => { setSelectedId(item.id); setError(""); }} disabled={loading} />
                            <span className="mesh-plan-radio" aria-hidden="true">{selectedId === item.id ? <Check size={13} strokeWidth={3} /> : null}</span>
                            <span className="mesh-plan-copy"><strong>{formatDuration(item.durationMinutes)}</strong><span>{compactCheckout ? passCaption(item.durationMinutes) : item.description ?? item.name}</span>{item.speedLimitKbps ? <small>Up to {Number((item.speedLimitKbps / 1000).toFixed(1))} Mbps</small> : null}</span>
                            <span className="mesh-plan-price"><strong>{compactCheckout ? <><small>KES</small><span>{item.priceKes.toLocaleString("en-KE")}</span></> : formatKes(item.priceKes)}</strong>{!compactCheckout ? <span>{formatSats(item.priceSats)}</span> : null}</span>
                          </label>
                        ))}
                        {!compactCheckout && packages.length > featuredPasses.length ? <button type="button" className="mesh-text-button mesh-all-passes" aria-expanded={showAllPasses} disabled={loading} onClick={() => { if (showAllPasses && !featuredPasses.some((item) => item.id === selectedId)) setSelectedId(featuredPasses[0]?.id ?? ""); setShowAllPasses(!showAllPasses); }}>{showAllPasses ? "Show fewer passes" : `See all ${packages.length} passes`}<ArrowRight size={16} aria-hidden="true" /></button> : null}
                      </div> : <div className="mesh-package-empty"><Globe size={26} aria-hidden="true" /><h3>{packagesUnavailable ? "Internet passes could not load." : "No internet passes are available yet."}</h3><p>{packagesUnavailable ? "Refresh this page in a moment. Free apps and learning are still available when the network is connected." : "Please check again later. You can still use available free services."}</p></div>}
                      {packages.length ? <div ref={checkout} className="mesh-checkout">
                        <div className="mesh-checkout-summary"><span>Your internet pass</span><strong>{selectedPackage ? `${formatDuration(selectedPackage.durationMinutes)} · ${formatKes(selectedPackage.priceKes)}` : "Choose a pass"}</strong></div>
                        {mpesaAvailable && customerMethods.length > 1 ? <fieldset className="mesh-payment-methods" disabled={loading}><legend>How would you like to pay?</legend><div>{customerMethods.map(method => <label key={method.id} data-selected={paymentProvider === method.id}><input type="radio" name="payment-method" value={method.id} checked={paymentProvider === method.id} onChange={() => { setPaymentProvider(method.id); setError(""); }} /><span>{method.label}</span></label>)}</div></fieldset> : null}
                        {isMpesa ? <div className="mesh-mpesa-phone"><div className="mesh-payment-brand"><Image src="/images/payments/mpesa.svg" alt="M-PESA" width={107} height={31} unoptimized /><span>Pay on your phone</span></div><label htmlFor="mesh-mpesa-phone">M-Pesa phone number</label><input ref={phoneInput} id="mesh-mpesa-phone" className="mesh-voucher-input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="0712 345 678" maxLength={32} disabled={loading} aria-describedby="mesh-phone-help" /><p id="mesh-phone-help" className="mesh-checkout-note">Tap Pay, then wait for the M-Pesa prompt on this number. Approve with your PIN in that prompt. Your internet starts automatically after confirmation.</p></div> : null}
                        <button type="button" className="mesh-button mesh-button-forest" onClick={startPayment} disabled={loading || !selectedPackage || !hasDevice || checkoutUnavailable || (isMpesa && (!mpesaAvailable || selectedPackage.priceKes < 10 || selectedPackage.priceKes > 10_000))}>{loading ? <Loader2 className="mesh-spin" size={18} aria-hidden="true" /> : <Zap size={18} aria-hidden="true" />}{loading ? (isMpesa ? "Requesting M-Pesa prompt…" : "Opening Lightning checkout…") : checkoutUnavailable ? "Payments temporarily unavailable" : !hasDevice ? "Reconnect to Mesh to pay" : isMpesa ? `Pay ${formatKes(selectedPackage?.priceKes ?? 0)} with M-Pesa` : "Pay with bitcoin"}<ArrowUpRight size={17} aria-hidden="true" /></button>
                        <p className="mesh-checkout-note" role={checkoutUnavailable ? "status" : undefined}>{checkoutUnavailable ? "No payment methods are available just now. No money has been requested. Please try again shortly." : isMpesa ? "Stay on Mesh while we confirm your payment and turn on your internet." : "Pay the Lightning invoice, then return here while we turn on your internet."}</p>
                      </div> : null}
                    </>
                  ) : (
                    <form className="mesh-voucher-form" onSubmit={redeemVoucher}>
                      <div className="mesh-section-rule"><span>Voucher access</span><Ticket size={16} aria-hidden="true" /></div>
                      <h3>Your code. Your connection.</h3><p>Scratch your ticket and enter its six-digit code. Your pass applies to this device.</p>
                      <label htmlFor="mesh-voucher">Voucher code</label><input id="mesh-voucher" className="mesh-voucher-input" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} minLength={6} maxLength={6} required disabled={loading} />
                      <button type="submit" className="mesh-button mesh-button-forest" disabled={loading || !hasDevice || !/^\d{6}$/.test(voucherCode)}>{loading ? <Loader2 className="mesh-spin" size={18} aria-hidden="true" /> : <Ticket size={18} aria-hidden="true" />}{loading ? "Checking your voucher…" : "Use voucher"}<ArrowRight size={17} aria-hidden="true" /></button>
                      <button type="button" className="mesh-text-button" disabled={loading} onClick={() => { setVoucherMode(false); setError(""); }}><ArrowLeft size={16} aria-hidden="true" /> Back to internet passes</button>
                    </form>
                  )}
                  {error ? <p className="mesh-form-error" role="alert">{error}</p> : null}
                </div>
              </div>
            )}
          </div>
        </section>

        {!compactCheckout ? <section className="mesh-community-note" aria-label="About the network"><MeshSymbol /><div><h2>More than a connection.</h2><p>Community Wi-Fi by Afribit. Free learning and selected apps, with internet passes when you need more.</p></div><button type="button" className="mesh-round-button" aria-label="Learn about Mesh" onClick={() => setModal("about")}><ArrowUpRight size={23} aria-hidden="true" /></button></section> : null}
      </main>
      {compactCheckout && !voucherMode && selectedPackage && hasDevice && !checkoutUnavailable ? <div className="mesh-checkout-dock"><div aria-live="polite"><span>Your internet pass</span><strong>{formatDuration(selectedPackage.durationMinutes)} &middot; {formatKes(selectedPackage.priceKes)}</strong></div><button type="button" className="mesh-button" onClick={continueToCheckout} disabled={loading}>Continue <ArrowRight size={17} aria-hidden="true" /></button></div> : null}

      <footer className="mesh-footer"><span>Mesh</span><span>Community Wi-Fi by Afribit.</span><button type="button" onClick={() => setModal("about")}>About this network <ArrowUpRight size={13} aria-hidden="true" /></button></footer>

      <dialog ref={dialog} className="mesh-dialog" onCancel={() => setModal(null)} onClose={() => setModal(null)} aria-labelledby="mesh-dialog-title">
        <div className="mesh-dialog-top"><span className="mesh-eyebrow">{modal === "blink" ? "The app directory" : "Welcome to the neighborhood"}</span><button type="button" className="mesh-dialog-close" aria-label="Close" onClick={() => setModal(null)}><X size={22} aria-hidden="true" /></button></div>
        {modal === "blink" ? <><div className="mesh-dialog-app-icon"><Image src="/images/apps/blink.svg" width={38} height={38} alt="Blink" unoptimized /></div><h2 id="mesh-dialog-title">Meet Blink.</h2><p>A bitcoin wallet for everyday use, with Lightning payments and a simple way to send and receive.</p><div className="mesh-dialog-access"><strong>{blinkAccess === "enabled" ? "Approved for free access" : "Free access is not available yet"}</strong><p>{blinkAccess === "enabled" ? "Open Blink while connected to Mesh. Its wallet service is free to access; other browsing needs a pass." : "Blink is featured here, but free wallet access is not available on this network yet."}</p></div><p className="mesh-dialog-small">Blink requires internet and its own account. Mesh provides connectivity; it does not operate the wallet or hold your funds.</p><a className="mesh-button mesh-button-forest" href="https://www.blink.sv/" target="_blank" rel="noopener noreferrer">Explore Blink <ArrowUpRight size={18} aria-hidden="true" /><span className="mesh-sr-only"> (opens in a new tab)</span></a></> : <><h2 id="mesh-dialog-title">A network.<br />A neighborhood.</h2><p>Mesh connects nearby places through a shared local network. It makes space for community services, approved free apps and paid internet.</p><div className="mesh-about-steps"><div><span>01</span><p><strong>Stay local</strong>Use available neighborhood services without buying an internet pass.</p></div><div><span>02</span><p><strong>Discover free apps</strong>Use the apps and learning websites listed as free on Mesh.</p></div><div><span>03</span><p><strong>Go further</strong>Choose an internet pass for other websites and apps. Pay using the available methods or redeem a voucher.</p></div></div><p className="mesh-dialog-small">A local service can stay available when internet is down. Online apps need a working internet connection.</p><button type="button" className="mesh-button mesh-button-forest" onClick={() => setModal(null)}>Let’s explore <ArrowRight size={18} aria-hidden="true" /></button></>}
      </dialog>
    </div>
  );
}
