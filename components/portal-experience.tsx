"use client";

import { useEffect, useRef, useState } from "react";
import { createScope, animate, stagger } from "animejs";
import { Check, Clock3, Gauge, Loader2, Ticket, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandMark } from "./brand-mark";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatDuration, formatSats } from "@/lib/utils";

type WifiPackage = {
  id: string;
  name: string;
  description: string | null;
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
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><span className="size-2 rounded-full bg-[var(--green-bright)]" /> Network available</span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-7 px-4 pb-10 pt-2 md:gap-12 md:px-8 md:pb-16 md:pt-8 lg:grid-cols-[0.76fr_1.24fr] lg:pt-14">
        <section className="self-start" data-reveal>
          <div className="portal-accent py-1 pl-4 md:py-2 md:pl-5">
            <p className="text-xs font-bold uppercase text-[var(--orange)]">Bitcoin-powered access</p>
            <h1 className="mt-3 max-w-lg text-3xl font-bold leading-[1.1] md:mt-4 md:text-5xl">Connect to Bitcoin Valley.</h1>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)] md:mt-7 md:text-base md:leading-7">Choose your time, pay over Lightning, and get online in seconds.</p>
          <div className="mt-5 hidden max-w-md grid-cols-3 gap-3 text-xs text-[var(--muted)] sm:grid md:mt-9">
            <span className="flex items-center gap-2"><Zap size={16} className="text-[var(--orange)]" /> Instant</span>
            <span className="flex items-center gap-2"><Check size={16} className="text-[var(--green-bright)]" /> Private</span>
            <span className="flex items-center gap-2"><Gauge size={16} className="text-[var(--gold)]" /> Fast</span>
          </div>
        </section>

        <section data-reveal>
          {!voucherMode ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase text-[var(--muted)]">Access passes</p><h2 className="mt-2 text-2xl font-bold">Select a plan</h2></div>
                <Button variant="ghost" size="sm" onClick={() => setVoucherMode(true)}><Ticket size={15} /> Use voucher</Button>
              </div>
              <div className="mt-4 grid gap-2.5 md:mt-5 md:grid-cols-3 md:gap-3">
                {packages.map((item) => (
                  <button key={item.id} className="package-option p-4 text-left md:p-5" data-selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
                    <span className="flex items-center justify-between gap-2"><strong className="text-sm">{item.name}</strong>{selectedId === item.id && <Check size={17} className="text-[var(--orange)]" />}</span>
                    <span className="package-price mt-3 block text-xl font-bold text-[var(--orange)] md:mt-7 md:text-2xl">{formatSats(item.priceSats)}</span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]"><Clock3 size={14} /> {formatDuration(item.durationMinutes)}</span>
                    <span className="package-description mt-2 hidden text-xs leading-5 text-[var(--muted)] md:mt-5 md:block">{item.description}</span>
                  </button>
                ))}
              </div>
              <Button className="mt-5 w-full" disabled={loading || !selectedId} onClick={startPayment}>
                {loading ? <Loader2 className="animate-spin" size={17} /> : <Zap size={17} />} Pay with Lightning
              </Button>
            </>
          ) : (
            <form className="panel p-6" onSubmit={redeemVoucher}>
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[var(--orange)]">Voucher access</p><h2 className="mt-2 text-2xl font-bold">Enter your code</h2></div><Ticket className="text-[var(--orange)]" /></div>
              <label className="field-label mt-7" htmlFor="voucher">Voucher code</label>
              <Input id="voucher" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} placeholder="BV-XXXX-XXXX-XXXX" autoComplete="off" required />
              <div className="mt-5 flex gap-3"><Button type="submit" className="flex-1" disabled={loading}>{loading && <Loader2 className="animate-spin" size={17} />} Connect</Button><Button type="button" variant="secondary" onClick={() => setVoucherMode(false)}>Back</Button></div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
