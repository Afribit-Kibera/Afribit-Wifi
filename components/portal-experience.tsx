"use client";

import { useEffect, useRef, useState } from "react";
import { createScope, animate, stagger } from "animejs";
import { Check, Loader2, ShieldCheck, SignalHigh, Ticket, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandMark } from "./brand-mark";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatDuration, formatKes, formatSats } from "@/lib/utils";

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

export function PortalExperience({ packages, portalContext }: { packages: WifiPackage[]; portalContext: PortalContext }) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(packages[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [voucherMode, setVoucherMode] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const selectedPackage = packages.find((item) => item.id === selectedId);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = createScope({ root }).add(() => {
      animate("[data-reveal]", { opacity: [0, 1], translateY: [14, 0], delay: stagger(70), duration: 520, ease: "out(3)" });
    });
    return () => scope.revert();
  }, []);

  async function startPayment() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedId, ...portalContext }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to start payment");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment");
      setLoading(false);
    }
  }

  async function redeemVoucher(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, ...portalContext }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Voucher could not be redeemed");
      router.push(`/connected?grant=${result.accessGrantId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voucher could not be redeemed");
      setLoading(false);
    }
  }

  return (
    <div ref={root} className="portal-shell">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8 md:py-5">
        <BrandMark />
        <span className="network-pill"><span className="size-2 rounded-full bg-[var(--green-bright)]" /> Network available</span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-10 pt-1 md:gap-8 md:px-8 md:pb-16 md:pt-6 lg:grid-cols-[0.72fr_1.28fr] lg:pt-10">
        <section className="portal-hero self-start" data-reveal>
          <div className="signal-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase text-[var(--orange)]">Prepaid neighborhood access</p>
            <h1 className="mt-3 max-w-lg text-4xl font-black leading-[1.02] md:text-6xl">3 West Satenet</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)] md:text-base md:leading-7">Pick a pass, pay in seconds, and stay online without needing mobile data first.</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] font-semibold text-[var(--muted)]">
            <span className="hero-chip"><Zap size={14} className="text-[var(--orange)]" /> Instant</span>
            <span className="hero-chip"><ShieldCheck size={14} className="text-[var(--green-bright)]" /> Secure</span>
            <span className="hero-chip"><SignalHigh size={14} className="text-[var(--gold)]" /> WiFi</span>
          </div>
        </section>

        <section className="voucher-board" data-reveal>
          {!voucherMode ? (
            <>
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--muted)]">Access vouchers</p>
                  <h2 className="mt-1 text-2xl font-black">Choose time</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setVoucherMode(true)}><Ticket size={15} /> Voucher</Button>
              </div>
              <div className="voucher-grid mt-4">
                {packages.map((item, index) => (
                  <button key={item.id} className="voucher-card text-left" data-selected={selectedId === item.id} data-featured={index === 6} onClick={() => setSelectedId(item.id)}>
                    <span className="voucher-card-glow" aria-hidden="true" />
                    <span className="flex items-start justify-between gap-2">
                      <span>
                        <strong className="voucher-duration">{formatDuration(item.durationMinutes)}</strong>
                        <span className="mt-1 block text-[11px] font-semibold uppercase text-[var(--muted)]">{item.name}</span>
                      </span>
                      <span className="voucher-check">{selectedId === item.id ? <Check size={15} /> : null}</span>
                    </span>
                    <span className="mt-5 block">
                      <span className="voucher-kes">{formatKes(item.priceKes)}</span>
                      <span className="mt-1 block text-xs font-bold text-[var(--orange)]">{formatSats(item.priceSats)}</span>
                    </span>
                    <span className="voucher-description">{item.description}</span>
                  </button>
                ))}
              </div>
              <div className="checkout-bar mt-4">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase text-[var(--muted)]">Selected pass</span>
                  <strong className="block truncate text-sm">{selectedPackage ? `${formatDuration(selectedPackage.durationMinutes)} - ${formatKes(selectedPackage.priceKes)}` : "Choose a pass"}</strong>
                </div>
                <Button disabled={loading || !selectedId} onClick={startPayment}>
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <Zap size={17} />} Pay
                </Button>
              </div>
            </>
          ) : (
            <form className="panel p-6" onSubmit={redeemVoucher}>
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[var(--orange)]">Voucher access</p><h2 className="mt-2 text-2xl font-bold">Enter your code</h2></div><Ticket className="text-[var(--orange)]" /></div>
              <label className="field-label mt-7" htmlFor="voucher">Voucher code</label>
              <Input id="voucher" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} placeholder="3W-XXXX-XXXX-XXXX" autoComplete="off" required />
              <div className="mt-5 flex gap-3"><Button type="submit" className="flex-1" disabled={loading}>{loading && <Loader2 className="animate-spin" size={17} />} Connect</Button><Button type="button" variant="secondary" onClick={() => setVoucherMode(false)}>Back</Button></div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
