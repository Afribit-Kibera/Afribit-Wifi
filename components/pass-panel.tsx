"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, MonitorSmartphone, Plus, Trash2, Tv, Users } from "lucide-react";

type PassDevice = { id: string; slot: number; label: string; lastBoundAt: string; current: boolean };
type Pass = { id: string; kind: "personal" | "household" | "tv"; deviceLimit: number; expiresAt: string; code: string; speedLimitKbps: number; devices: PassDevice[] };

function timeLeft(expiresAt: string) {
  const minutes = Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 60_000));
  if (minutes >= 2880) return `${Math.floor(minutes / 1440)} days left`;
  if (minutes >= 120) return `${Math.floor(minutes / 60)} hours left`;
  return `${minutes} minutes left`;
}
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
  const [deviceCode, setDeviceCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [addCode, setAddCode] = useState<Record<string, string>>({});
  const [replace, setReplace] = useState<{ passId: string; devices: PassDevice[] } | null>(null);

  const load = useCallback(async () => {
    try { setPasses((await call("/api/mesh/pass")).passes); setError(""); }
    catch (loadError) { setPasses([]); setError(loadError instanceof Error ? loadError.message : "Could not load your pass"); }
  }, []);
  useEffect(() => {
    let cancelled = false;
    call("/api/mesh/pass").then(body => { if (!cancelled) { setPasses(body.passes); setError(""); } },
      loadError => { if (!cancelled) { setPasses([]); setError(loadError instanceof Error ? loadError.message : "Could not load your pass"); } });
    return () => { cancelled = true; };
  }, []);

  async function showDeviceCode() {
    setBusy("device-code");
    try { setDeviceCode(await call("/api/mesh/pass/device-code", { method: "POST", body: "{}" })); setError(""); }
    catch (codeError) { setError(codeError instanceof Error ? codeError.message : "Could not create a code"); }
    finally { setBusy(""); }
  }
  async function addDevice(event: FormEvent, passId: string, replaceDeviceId?: string) {
    event.preventDefault();
    setBusy(`add-${passId}`);
    try {
      await call(`/api/mesh/pass/${passId}/devices`, { method: "POST", body: JSON.stringify({ deviceCode: addCode[passId] ?? "", ...(replaceDeviceId ? { replaceDeviceId } : {}) }) });
      setAddCode({ ...addCode, [passId]: "" }); setReplace(null); await load();
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

  if (passes === null) return <p className="flow-copy"><Loader2 className="mesh-spin" size={16} aria-hidden="true" /> Loading your pass…</p>;
  return <div className="pass-panel">
    {passes.map(pass => <article key={pass.id} className="pass-card">
      <header><span className="pass-kind">{pass.kind === "tv" ? <Tv size={16} aria-hidden="true" /> : pass.kind === "household" ? <Users size={16} aria-hidden="true" /> : <MonitorSmartphone size={16} aria-hidden="true" />}{kindLabel[pass.kind]}</span><strong>{timeLeft(pass.expiresAt)}</strong></header>
      <div className="pass-code"><span>Pass code</span><strong>{pass.code}</strong><small>Keep this code. If this phone loses its connection, or you change phones, enter it under “Have a code?”.</small></div>
      <div className="pass-devices">
        <span>Devices · {pass.devices.length} of {pass.deviceLimit}</span>
        <ul>{pass.devices.map(device => <li key={device.id}><span>{device.label}{device.current ? " (this device)" : ""}</span>
          {pass.deviceLimit > 1 ? <button type="button" className="pass-icon-button" aria-label={`Remove ${device.label}`} disabled={Boolean(busy)} onClick={() => remove(pass.id, device)}>{busy === `remove-${device.id}` ? <Loader2 className="mesh-spin" size={16} /> : <Trash2 size={16} />}</button> : null}</li>)}</ul>
      </div>
      {pass.deviceLimit > 1 || pass.kind === "tv" ? <form className="pass-add" onSubmit={event => addDevice(event, pass.id)}>
        <label htmlFor={`add-${pass.id}`}>{pass.kind === "tv" ? "Move this pass to another TV" : "Add a device"}</label>
        <p>On the other device or TV, open Mesh and tap “Show this device’s code”. Type that code here.</p>
        <div><input id={`add-${pass.id}`} className="mesh-voucher-input" inputMode="numeric" placeholder="000000" maxLength={6} value={addCode[pass.id] ?? ""}
          onChange={event => setAddCode({ ...addCode, [pass.id]: event.target.value.replace(/\D/g, "").slice(0, 6) })} disabled={Boolean(busy)} />
          <button type="submit" className="flow-action" disabled={Boolean(busy) || (addCode[pass.id] ?? "").length !== 6}>{busy === `add-${pass.id}` ? <Loader2 className="mesh-spin" size={16} /> : <Plus size={16} aria-hidden="true" />} Add</button></div>
        {replace?.passId === pass.id ? <div className="pass-replace"><p>All places are in use. Choose a device to replace:</p>
          {replace.devices.map(device => <button key={device.id} type="button" className="flow-stay" disabled={Boolean(busy)} onClick={event => addDevice(event as unknown as FormEvent, pass.id, device.id)}>Replace {device.label}</button>)}</div> : null}
      </form> : null}
    </article>)}
    {!passes.length ? <p className="flow-copy">This device has no active pass. Buy one, or use a code from a pass you already have.</p> : null}
    <section className="pass-card pass-device-code">
      <h2>Someone else paying for this device?</h2>
      <p>Show this code to the person paying, or adding this device to their household pass. It works for 30 minutes.</p>
      {deviceCode ? <strong className="pass-big-code" aria-live="polite">{deviceCode.code.slice(0, 3)} {deviceCode.code.slice(3)}</strong> : null}
      <button type="button" className="flow-action" onClick={showDeviceCode} disabled={Boolean(busy)}>{busy === "device-code" ? <Loader2 className="mesh-spin" size={16} /> : null}{deviceCode ? "Show a new code" : "Show this device’s code"}</button>
    </section>
    {error ? <p className="mesh-form-error" role="alert">{error}</p> : null}
  </div>;
}
