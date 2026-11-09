"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, MonitorSmartphone, Plus, Trash2, Tv, Users } from "lucide-react";
import { DeviceCode } from "@/components/device-code";
import { endsAt, readSavedPasses, savePass, timeLeft, type SavedPass } from "@/lib/saved-passes";

type PassDevice = { id: string; slot: number; label: string; lastBoundAt: string; current: boolean };
type Pass = { id: string; kind: "personal" | "household" | "tv"; deviceLimit: number; expiresAt: string; code: string; speedLimitKbps: number; devices: PassDevice[] };

const kindLabel = { personal: "Personal pass", household: "Household pass", tv: "TV pass" } as const;

async function call(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error ?? "Mesh is busy. Please try again."), { devices: body.devices as PassDevice[] | undefined });
  return body;
}

// Passes this device uses or paid for, the code to reuse them, and the
// household device list. A device without a pass can show its own code.
export function PassPanel() {
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [showCode, setShowCode] = useState(false);
  // A code from a scanned device QR (/pass?device=123456) fills every add box.
  const [scanned, setScanned] = useState("");
  const [addCode, setAddCode] = useState<Record<string, string>>({});
  const [replace, setReplace] = useState<{ passId: string; devices: PassDevice[] } | null>(null);

  const [saved, setSaved] = useState<SavedPass[]>([]);
  // Keep every pass this phone sees, and show saved ones when the server can't
  // tell who this phone is (another browser, or off the Mesh Wi-Fi).
  const keep = useCallback((list: Pass[]) => {
    for (const pass of list) savePass({ code: pass.code, kind: pass.kind, expiresAt: pass.expiresAt });
    setSaved(readSavedPasses());
  }, []);
  const load = useCallback(async () => {
    try { const list = (await call("/api/mesh/pass")).passes; setPasses(list); keep(list); setError(""); }
    catch (loadError) { setPasses([]); setSaved(readSavedPasses()); setError(loadError instanceof Error ? loadError.message : "Could not load your pass"); }
  }, [keep]);
  useEffect(() => {
    let cancelled = false;
    const device = new URLSearchParams(location.search).get("device") ?? "";
    call("/api/mesh/pass").then(body => { if (!cancelled) { setPasses(body.passes); keep(body.passes); setError(""); if (/^\d{6}$/.test(device)) setScanned(device); } },
      loadError => { if (!cancelled) { setPasses([]); setSaved(readSavedPasses()); setError(loadError instanceof Error ? loadError.message : "Could not load your pass"); } });
    return () => { cancelled = true; };
  }, [keep]);

  async function addDevice(event: FormEvent, passId: string, replaceDeviceId?: string) {
    event.preventDefault();
    setBusy(`add-${passId}`);
    try {
      await call(`/api/mesh/pass/${passId}/devices`, { method: "POST", body: JSON.stringify({ deviceCode: addCode[passId] ?? scanned, ...(replaceDeviceId ? { replaceDeviceId } : {}) }) });
      setAddCode({ ...addCode, [passId]: "" }); setScanned(""); setReplace(null); await load();
    } catch (addError) {
      const devices = (addError as { devices?: PassDevice[] }).devices;
      if (devices?.length) setReplace({ passId, devices });
      setError(addError instanceof Error ? addError.message : "Could not add that device");
    } finally { setBusy(""); }
  }
  async function remove(passId: string, device: PassDevice) {
    if (!window.confirm(`Remove ${device.label}? It goes offline within a minute and its place becomes free.`)) return;
    setBusy(`remove-${device.id}`);
    try { await call(`/api/mesh/pass/${passId}/devices`, { method: "DELETE", body: JSON.stringify({ deviceId: device.id }) }); await load(); }
    catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Could not remove that device"); }
    finally { setBusy(""); }
  }

  if (passes === null) return <p className="flow-copy"><Loader2 className="flow-loading" size={16} aria-hidden="true" /> Loading your pass…</p>;
  return <div className="pass-panel">
    {passes.map(pass => <article key={pass.id} className="pass-card">
      <div className="pass-ticket"><header><span className="pass-kind">{pass.kind === "tv" ? <Tv size={16} aria-hidden="true" /> : pass.kind === "household" ? <Users size={16} aria-hidden="true" /> : <MonitorSmartphone size={16} aria-hidden="true" />}{kindLabel[pass.kind]}</span><strong>{timeLeft(pass.expiresAt)}</strong></header>
      <p className="pass-ends">Ends {endsAt(pass.expiresAt)}</p>
      <div className="pass-code"><span>Pass code</span><strong>{pass.code}</strong><small>Keep it. On a new phone, enter it under “Have a code?”.</small></div></div>
      <div className="pass-devices">
        <span>Devices · {pass.devices.length} of {pass.deviceLimit}</span>
        <ul>{pass.devices.map(device => <li key={device.id}><span>{device.label}{device.current ? " (this device)" : ""}</span>
          {pass.deviceLimit > 1 ? <button type="button" className="pass-icon-button" aria-label={`Remove ${device.label}`} disabled={Boolean(busy)} onClick={() => remove(pass.id, device)}>{busy === `remove-${device.id}` ? <Loader2 className="flow-loading" size={16} /> : <Trash2 size={16} />}</button> : null}</li>)}</ul>
      </div>
      {pass.deviceLimit > 1 || pass.kind === "tv" ? <form className="pass-add" onSubmit={event => addDevice(event, pass.id)}>
        <label htmlFor={`add-${pass.id}`}>{pass.kind === "tv" ? "Move this pass to another TV" : "Add a device"}</label>
        <p>On the other device, open Mesh, tap Another device, then Someone else pays. Scan its QR with your camera, or type its code.</p>
        <div><input id={`add-${pass.id}`} className="flow-input" inputMode="numeric" placeholder="000000" maxLength={6} value={addCode[pass.id] ?? scanned}
          onChange={event => setAddCode({ ...addCode, [pass.id]: event.target.value.replace(/\D/g, "").slice(0, 6) })} disabled={Boolean(busy)} />
          <button type="submit" className="flow-action" disabled={Boolean(busy) || (addCode[pass.id] ?? scanned).length !== 6}>{busy === `add-${pass.id}` ? <Loader2 className="flow-loading" size={16} /> : <Plus size={16} aria-hidden="true" />} Add</button></div>
        {replace?.passId === pass.id ? <div className="pass-replace"><p>All places are in use. Choose a device to replace:</p>
          {replace.devices.map(device => <button key={device.id} type="button" className="flow-stay" disabled={Boolean(busy)} onClick={event => addDevice(event as unknown as FormEvent, pass.id, device.id)}>Replace {device.label}</button>)}</div> : null}
      </form> : null}
    </article>)}
    {!passes.length ? <SavedCodes saved={saved} /> : null}
    {showCode ? <section className="pass-card"><h2 className="flow-label">Show this to the payer</h2><DeviceCode /></section>
      : <button type="button" className="flow-action secondary" onClick={() => setShowCode(true)}>Someone else pays for this device</button>}
    {error ? <p className="flow-error" role="alert">{error}</p> : null}
  </div>;
}

// Codes this phone kept from earlier. Tapping one opens Mesh with the code filled in.
export function SavedCodes({ saved }: { saved: SavedPass[] }) {
  if (!saved.length) return <p className="flow-copy">No pass on this device yet.</p>;
  return <section className="pass-card">
    <h2 className="flow-label">Saved on this phone</h2>
    <ul className="pass-saved">{saved.map(item => <li key={item.code}>
      <span><strong>{item.code}</strong><small>{kindLabel[item.kind as keyof typeof kindLabel] ?? "Pass"} · ends {endsAt(item.expiresAt)}</small></span>
      <a className="flow-action secondary" href={`/?view=voucher&code=${item.code.replace(/\D/g, "")}`}>Use</a></li>)}</ul>
    <p className="flow-note">Connect to Mesh Wi-Fi, then tap Use to get this phone back online.</p>
  </section>;
}
