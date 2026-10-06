"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, CheckCircle2, Wifi } from "lucide-react";
import { internetHandoff } from "@/lib/payments/customer-progress";

const subscribeToUserAgent = () => () => {};
const userAgentSnapshot = () => navigator.userAgent;
const serverUserAgentSnapshot = () => "";

// Render only after an authenticated status request has confirmed active access.
// Visiting an OS connectivity probe helps its captive window recheck the Wi-Fi;
// websites cannot force that window to close or change the phone's Wi-Fi state.
export function MeshOnlineSuccess({ expiresAt }: { expiresAt?: string | null }) {
  const userAgent = useSyncExternalStore(subscribeToUserAgent, userAgentSnapshot, serverUserAgentSnapshot);
  const handoff = internetHandoff(userAgent);
  const [stayHere, setStayHere] = useState(false);

  useEffect(() => {
    if (!handoff.automatic || stayHere) return;
    const timer = window.setTimeout(() => {
      if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) return;
      window.location.assign(handoff.url);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [handoff.automatic, handoff.url, stayHere, expiresAt]);

  return <section className="flow-success" aria-labelledby="mesh-online-heading" role="status">
    <div className="flow-success-mark"><Wifi size={32} aria-hidden="true" /><CheckCircle2 size={21} aria-hidden="true" /></div>
    <p className="flow-success-eyebrow">Internet is ready</p>
    <h1 id="mesh-online-heading" className="flow-heading">You’re online.</h1>
    <p className="flow-copy">Your pass is active on this device. Stay connected to Mesh and open your favourite apps.</p>
    <a className="flow-action" href={handoff.url}>Start browsing <ArrowUpRight size={17} aria-hidden="true" /></a>
    {handoff.automatic && !stayHere ? <><p className="flow-note">We’re finishing the Wi-Fi sign-in. This window may close in a moment.</p><button className="flow-stay" type="button" onClick={() => setStayHere(true)}>Stay on this page</button></> : <p className="flow-note">If the Wi-Fi window stays open, tap Done or close it, then open your browser. You don’t need to reconnect or pay again.</p>}
  </section>;
}
