"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, CheckCircle2, Wifi } from "lucide-react";
import { internetHandoff } from "@/lib/payments/customer-progress";
import { endsAt, savePass, timeLeft } from "@/lib/saved-passes";

const subscribeToUserAgent = () => () => {};
const userAgentSnapshot = () => navigator.userAgent;
const serverUserAgentSnapshot = () => "";

const onlineStamp = <svg className="flow-success-stamp" viewBox="0 0 100 100" aria-hidden="true">
  <defs><path id="mesh-stamp-ring" d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0" /></defs>
  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" />
  <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1.5" />
  <text fill="currentColor" fontSize="10.5" fontWeight="800"><textPath href="#mesh-stamp-ring" textLength="222" lengthAdjust="spacing">MESH · ONLINE · PAID · KIBERA · </textPath></text>
  <path d="M38 51l8 8 16-18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
</svg>;

// Render only after an authenticated status request has confirmed active access.
// Visiting an OS connectivity probe helps its captive window recheck the Wi-Fi;
// websites cannot force that window to close or change the phone's Wi-Fi state.
export function MeshOnlineSuccess({ expiresAt }: { expiresAt?: string | null }) {
  const userAgent = useSyncExternalStore(subscribeToUserAgent, userAgentSnapshot, serverUserAgentSnapshot);
  const handoff = internetHandoff(userAgent);
  const [stayHere, setStayHere] = useState(false);
  const [passCode, setPassCode] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Time left, refreshed every half minute. Starts after mount so server and phone agree.
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0), timer = window.setInterval(tick, 30_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    // The code that restores this pass after a phone change or lost connection.
    let cancelled = false;
    fetch("/api/mesh/pass", { cache: "no-store" }).then(response => response.ok ? response.json() : null)
      .then(body => {
        const pass = body?.passes?.[0];
        if (cancelled || typeof pass?.code !== "string") return;
        setPassCode(pass.code);
        savePass({ code: pass.code, kind: String(pass.kind), expiresAt: String(pass.expiresAt) });
      }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!handoff.automatic || stayHere) return;
    const timer = window.setTimeout(() => {
      if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) return;
      window.location.assign(handoff.url);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [handoff.automatic, handoff.url, stayHere, expiresAt]);

  return <section className="flow-success" aria-labelledby="mesh-online-heading" role="status">
    {onlineStamp}
    <div className="flow-success-mark"><Wifi size={32} aria-hidden="true" /><CheckCircle2 size={21} aria-hidden="true" /></div>
    <p className="flow-success-eyebrow">Internet is ready</p>
    <h1 id="mesh-online-heading" className="flow-heading">You’re online.</h1>
    <p className="flow-copy">Your pass is on. Open your apps.</p>
    {expiresAt && Number.isFinite(Date.parse(expiresAt)) ? <p className="flow-ends">Ends {endsAt(expiresAt)}{now ? <> · <strong>{timeLeft(expiresAt, now)}</strong></> : null}</p> : null}
    {passCode ? <div className="pass-code"><span>Your pass code</span><strong>{passCode}</strong><small>Saved on this phone. Write it down too: you’ll need it on a new phone.</small></div> : null}
    <a className="flow-action" href={handoff.url}>Start browsing <ArrowUpRight size={17} aria-hidden="true" /></a>
    {handoff.automatic && !stayHere ? <><p className="flow-note">This window closes by itself in a moment.</p><button className="flow-stay" type="button" onClick={() => setStayHere(true)}>Stay on this page</button></> : <p className="flow-note"><a href="/app">Get the Mesh app</a> · <a href="/pass">My pass</a></p>}
  </section>;
}
