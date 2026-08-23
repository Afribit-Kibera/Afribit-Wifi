"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function PaymentStatus({ paymentId, initialStatus, checkoutUrl }: { paymentId: string; initialStatus: string; checkoutUrl: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (["settled", "expired", "invalid"].includes(status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setStatus(data.status);
      if (data.status === "settled") router.push(`/connected?payment=${paymentId}`);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [paymentId, router, status]);

  if (status === "settled") return <div className="text-center"><CheckCircle2 className="mx-auto text-[var(--green-bright)]" size={44} /><h1 className="mt-4 text-2xl font-bold">Payment confirmed</h1></div>;
  if (["expired", "invalid"].includes(status)) return <div className="text-center"><XCircle className="mx-auto text-[var(--red)]" size={44} /><h1 className="mt-4 text-2xl font-bold">Invoice {status}</h1><Button asChild className="mt-6"><Link href="/">Choose another pass</Link></Button></div>;
  return <div className="text-center"><Loader2 className="mx-auto animate-spin text-[var(--orange)]" size={42} /><h1 className="mt-5 text-2xl font-bold">Waiting for payment</h1><p className="mt-3 flex items-center justify-center gap-2 text-sm text-[var(--muted)]"><Clock3 size={15} /> This page updates automatically</p>{checkoutUrl && <Button asChild className="mt-7"><a href={checkoutUrl}>Open Lightning invoice</a></Button>}</div>;
}
