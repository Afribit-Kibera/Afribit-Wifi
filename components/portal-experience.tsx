"use client";

import { useEffect, useRef, useState } from "react";
import { createScope, animate, stagger } from "animejs";
import { ArrowLeft, Check, Loader2, Ticket, Zap } from "lucide-react";
import Image from "next/image";
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

function planAccent(durationMinutes: number) {
  if (durationMinutes <= 240) return "green";
  if (durationMinutes <= 4320) return "gold";
  return "red";
}

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
      animate("[data-reveal]", { opacity: [0, 1], translateY: [12, 0], delay: stagger(70), duration: 460, ease: "out(3)" });
      animate("[data-plan-card]", { opacity: [0, 1], translateY: [10, 0], delay: stagger(42, { start: 120 }), duration: 420, ease: "out(3)" });
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
    <div ref={root} className="pass-portal">
      <header className="pass-header">
        <div className="pass-header-inner">
          <BrandMark />
          <span className="network-pill">
            <span className="network-dot" aria-hidden="true" />
            <span className="network-label-long">Network available</span>
            <span className="network-label-short">Online</span>
          </span>
        </div>
      </header>

      <main className="pass-main">
        <section className="pass-hero" data-reveal>
          <Image
            src="/images/rooftop-wifi-hero.png"
            alt="A rooftop wireless antenna serving a neighborhood"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 1180px"
            className="pass-hero-image"
          />
          <h1>Get connected</h1>
        </section>

        <section className="pass-content">
          {!voucherMode ? (
            <>
              <div className="pass-heading-row">
                <div>
                  <h2>Choose a pass</h2>
                  <p>Prices in KES, paid securely over Lightning.</p>
                </div>
                <button type="button" className="voucher-link" onClick={() => setVoucherMode(true)}>
                  <Ticket size={17} /> Have a voucher?
                </button>
              </div>
              {packages.length > 0 ? (
                <div className="pass-grid" role="radiogroup" aria-label="WiFi access passes">
                  {packages.map((item) => {
                    const selected = selectedId === item.id;
                    const featured = item.durationMinutes === 10080;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className="voucher-card"
                        data-plan-card
                        data-selected={selected}
                        data-accent={planAccent(item.durationMinutes)}
                        data-long-duration={item.durationMinutes === 80}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="pass-card-top">
                          <strong className="pass-duration">{formatDuration(item.durationMinutes)}</strong>
                          <span className="pass-card-check" aria-hidden="true"><Check size={17} strokeWidth={3} /></span>
                        </span>
                        <span className="pass-price">{formatKes(item.priceKes)}</span>
                        <span className="pass-sats">{formatSats(item.priceSats)}</span>
                        {featured ? <span className="pass-value-label">Best value</span> : null}
                        <span className="pass-description">{item.description ?? item.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="pass-empty">No passes are available right now.</div>
              )}
              <div className="pass-checkout" aria-live="polite">
                <div className="pass-checkout-summary">
                  <span>Selected pass</span>
                  <strong>{selectedPackage ? `${formatDuration(selectedPackage.durationMinutes)} - ${formatKes(selectedPackage.priceKes)}` : "Choose a pass"}</strong>
                  {selectedPackage ? <small>{formatSats(selectedPackage.priceSats)}</small> : null}
                </div>
                <Button className="pass-checkout-button" disabled={loading || !selectedId} onClick={startPayment}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />} Continue
                </Button>
              </div>
            </>
          ) : (
            <form className="pass-voucher-panel" onSubmit={redeemVoucher}>
              <div className="pass-voucher-heading">
                <span className="pass-voucher-icon" aria-hidden="true"><Ticket size={22} /></span>
                <div>
                  <p>Voucher access</p>
                  <h2>Enter your code</h2>
                </div>
              </div>
              <label className="pass-field-label" htmlFor="voucher">Voucher code</label>
              <Input
                id="voucher"
                className="pass-voucher-input"
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                placeholder="3W-XXXX-XXXX-XXXX"
                autoComplete="off"
                required
              />
              <div className="pass-voucher-actions">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <Zap size={17} />} Connect
                </Button>
                <Button type="button" variant="secondary" className="pass-secondary-button" onClick={() => setVoucherMode(false)}>
                  <ArrowLeft size={17} /> Back
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
