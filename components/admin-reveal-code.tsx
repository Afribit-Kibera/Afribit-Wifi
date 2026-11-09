"use client";

import { useState, useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { revealPassCodeAction } from "@/app/admin/(protected)/passes/actions";

// Shows one pass code on request. The server logs each look.
export function AdminRevealCode({ passId }: { passId: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  if (code) return <strong className="font-mono text-base tracking-wider">{code}</strong>;
  const reveal = () => start(async () => {
    const result = await revealPassCodeAction(passId);
    if ("code" in result) setCode(result.code); else setError(result.error);
  });
  return <span className="inline-flex items-center gap-2">
    <button type="button" disabled={pending} onClick={reveal}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1 text-xs font-semibold hover:border-[var(--orange)]">
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Show code
    </button>
    {error ? <span className="text-xs text-[var(--red)]">{error}</span> : null}
  </span>;
}
