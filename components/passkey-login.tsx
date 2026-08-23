"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function PasskeyLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setLoading(true);
    setError("");
    try {
      const optionsResponse = await fetch("/api/admin/passkeys/authentication/options", { cache: "no-store" });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(options.error ?? "Unable to start device verification");
      const credential = await startAuthentication({ optionsJSON: options });
      const verifyResponse = await fetch("/api/admin/passkeys/authentication/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok || !result.verified) throw new Error(result.error ?? "Device verification failed");
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Device verification failed");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      {error && <p role="alert" className="mb-4 rounded-md bg-[var(--red-soft)] p-3 text-sm text-[var(--red)]">{error}</p>}
      <Button className="h-12 w-full" disabled={loading} onClick={signIn}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={19} />}
        Verify this device
      </Button>
    </div>
  );
}
