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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <BrandMark />
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><span className="size-2 rounded-full bg-[var(--green-bright)]" /> Network available</span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-8 md:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:pt-14">
        <section className="self-start" data-reveal>
          <div className="portal-accent py-2 pl-5">
            <p className="text-xs font-bold uppercase text-[var(--orange)]">Bitcoin-powered access</p>
            <h1 className="mt-4 max-w-lg text-4xl font-bold leading-[1.05] md:text-5xl">Connect to Bitcoin Valley.</h1>
          </div>
          <p className="mt-7 max-w-md text-base leading-7 text-[var(--muted)]">Choose your time, pay over Lightning, and get online in seconds.</p>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-3 text-xs text-[var(--muted)]">
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
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {packages.map((item) => (
                  <button key={item.id} className="package-option p-5 text-left" data-selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
                    <span className="flex items-center justify-between gap-2"><strong className="text-sm">{item.name}</strong>{selectedId === item.id && <Check size={17} className="text-[var(--orange)]" />}</span>
                    <span className="mt-7 block text-2xl font-bold text-[var(--orange)]">{formatSats(item.priceSats)}</span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]"><Clock3 size={14} /> {formatDuration(item.durationMinutes)}</span>
                    <span className="mt-5 block text-xs leading-5 text-[var(--muted)]">{item.description}</span>
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
