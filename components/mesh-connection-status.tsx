"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowUpRight } from "lucide-react";
import { MeshOnlineSuccess } from "@/components/mesh-online-success";
import { hasActiveInternetAccess } from "@/lib/payments/customer-progress";

export type MeshConnectionState = "active" | "pending" | "inactive" | "unknown";

export function MeshConnectionStatus({ state: initialState, paymentId, grantId }: { state: MeshConnectionState; paymentId?: string; grantId?: string }) {
  const [state, setState] = useState(initialState);
  const [checkError, setCheckError] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  useEffect(() => {
    const identifier = paymentId ? `payment=${encodeURIComponent(paymentId)}` : grantId ? `grant=${encodeURIComponent(grantId)}` : null;
    if (!identifier) return;
    let cancelled = false;
    let inFlight = false;
    const check = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const response = await fetch(`/api/mesh/access/status?${identifier}`, { cache: "no-store" });
        const result = response.ok ? await response.json() : null;
        if (cancelled) return;
        if (!response.ok) { setCheckError(true); setState("unknown"); return; }
        const access = result.nativeAccess ?? result;
        const expiry = access.expiresAt ? Date.parse(access.expiresAt) : null;
        const expired = expiry !== null && Number.isFinite(expiry) && expiry <= Date.now();
        setState(expired ? "inactive" : hasActiveInternetAccess(access) ? "active" : access.status === "pending" ? "pending" : ["expired", "failed", "revoked"].includes(access.status) ? "inactive" : "unknown");
        setExpiresAt(access.expiresAt ?? null);
        setCheckError(false);
      } catch {
        if (!cancelled) { setCheckError(true); setState("unknown"); }
      } finally {
        inFlight = false;
      }
    };
    void check();
    const timer = window.setInterval(check, 4000);
    document.addEventListener("visibilitychange", check);
    return () => { cancelled = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [paymentId, grantId]);

  if (state === "active") return <MeshOnlineSuccess expiresAt={expiresAt} />;
  return <>
    {state === "pending" ? <Loader2 className="flow-status-symbol flow-loading" size={40} /> : null}
    <h1 className="flow-heading">{state === "pending" ? "Turning on your internet." : state === "inactive" ? "Your pass isn’t active." : "Welcome back to Mesh."}</h1>
    <p className="flow-copy">{state === "pending" ? "Stay connected to Mesh. We’ll switch on your internet automatically and let you know when it’s ready." : state === "inactive" ? "Your internet pass has ended. If you just paid, ask Afribit for help before paying again. Free Mesh services are still available." : checkError ? "We can’t check your pass just now. Stay on Mesh while we try again. If you already paid, don’t pay again." : "Choose an internet pass or explore the free services on Mesh."}</p>
    {state !== "pending" ? <Link className="flow-action secondary" href="/?view=internet">Back to Mesh <ArrowUpRight size={17} aria-hidden="true" /></Link> : null}
    {state === "pending" ? <p className="flow-note">Already paid? Keep this page open. You don’t need to pay again.</p> : null}
  </>;
}
