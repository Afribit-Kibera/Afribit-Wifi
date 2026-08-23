"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="panel max-w-md p-7 text-center">
        <p className="text-sm font-bold text-[var(--orange)]">Connection interrupted</p>
        <h1 className="mt-3 text-2xl font-bold">That request did not complete.</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Your payment state is preserved. Try the request again.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}

