"use client";

import { useActionState, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { generateDevicePairingCodeAction } from "@/app/admin/(protected)/security/actions";
import { Button } from "./ui/button";

const initialState = { code: "", expiresAt: "" };

export function DevicePairingCode() {
  const [state, action, pending] = useActionState(generateDevicePairingCodeAction, initialState);
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
  }
  return (
    <div>
      <h3 className="text-sm font-bold">Pair another device</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Generate a single-use code, then open <span className="font-mono">/admin/enroll</span> on the new device.</p>
      {state.code ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--orange)] bg-[var(--orange-soft)] p-3"><code className="min-w-0 flex-1 break-all text-sm font-bold text-[var(--orange-bright)]">{state.code}</code><Button type="button" variant="ghost" size="icon" onClick={copyCode} title="Copy pairing code"><Copy size={16} /></Button><span className="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span></div>
      ) : (
        <form action={action} className="mt-4"><Button type="submit" variant="secondary" className="w-full" disabled={pending}><KeyRound size={16} />{pending ? "Generating..." : "Generate pairing code"}</Button></form>
      )}
    </div>
  );
}
