"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { endsAt } from "@/lib/saved-passes";

export type Code = { code: string; expiresAt: string; qrSvg: string };

// This device's short code, as a QR the payer scans with their camera and as
// digits they can type. Either one lets them pay for, or add, this device.
// It then waits, and says so on screen once the router has switched it on.
export function DeviceCode({ initial = null, initialOnlineUntil = null, tv = false }: { initial?: Code | null; initialOnlineUntil?: string | null; tv?: boolean }) {
  const [value, setValue] = useState<Code | null>(initial);
  const [onlineUntil, setOnlineUntil] = useState<string | null>(initialOnlineUntil);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(!initial && !initialOnlineUntil);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/mesh/pass/device-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || typeof body.code !== "string") throw new Error(body.error ?? "Couldn’t make a code. Try again.");
      setValue(body); setError("");
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Couldn’t make a code. Try again."); }
    finally { setBusy(false); }
  }, []);
  // The server already made the first code for a TV; otherwise make one now.
  useEffect(() => {
    if (initial || initialOnlineUntil) return;
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load, initial, initialOnlineUntil]);
  // Wait for the payer. A code that is about to run out is replaced.
  useEffect(() => {
    if (!value || onlineUntil) return;
    const timer = window.setInterval(async () => {
      if (Date.parse(value.expiresAt) - Date.now() < 60_000) { void load(); return; }
      try {
        const body = await (await fetch("/api/mesh/pass/device-code", { cache: "no-store" })).json();
        if (body?.online === true && typeof body.expiresAt === "string") setOnlineUntil(body.expiresAt);
      } catch { /* Try again on the next tick. */ }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [value, onlineUntil, load]);

  if (onlineUntil) return <div className="flow-device-code" role="status">
    <strong className="flow-big-code">You’re online</strong>
    <p className="flow-copy">{tv ? "This TV" : "This device"} has internet until {endsAt(onlineUntil)}. Open your apps.</p>
  </div>;
  if (!value) return busy ? <p className="flow-copy"><Loader2 className="flow-loading" size={16} aria-hidden="true" /> Making a code…</p>
    : <><p className="flow-error" role="alert">{error}</p><button type="button" className="flow-action" onClick={load}>Try again</button></>;
  return <div className="flow-device-code">
    <div className="flow-device-qr" role="img" aria-label={`QR for device code ${value.code}`} dangerouslySetInnerHTML={{ __html: value.qrSvg }} />
    <strong className="flow-big-code" aria-live="polite">{value.code.slice(0, 3)} {value.code.slice(3)}</strong>
    <p className="flow-note">{tv ? "Or type this code on the phone. A new code appears every 30 minutes." : "The payer scans this with their camera, or types the code. It works for 30 minutes."}</p>
    {error ? <p className="flow-error" role="alert">{error}</p> : null}
    {tv ? null : <button type="button" className="flow-stay" onClick={load} disabled={busy}>New code</button>}
  </div>;
}
