"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function PasskeyEnrollment() {
  const router = useRouter();
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enroll(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const optionsResponse = await fetch("/api/admin/passkeys/registration/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentCode }),
      });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(options.error ?? "Unable to register this device");
      const credential = await startRegistration({ optionsJSON: options });
      const verifyResponse = await fetch("/api/admin/passkeys/registration/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok || !result.verified) throw new Error(result.error ?? "Device registration failed");
      router.push(result.redirectTo ?? "/admin/security");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Device registration failed");
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={enroll}>
      <div>
        <label className="field-label" htmlFor="enrollmentCode">Pairing code</label>
        <Input id="enrollmentCode" type="password" value={enrollmentCode} onChange={(event) => setEnrollmentCode(event.target.value)} autoComplete="one-time-code" required />
      </div>
      {error && <p role="alert" className="rounded-md bg-[var(--red-soft)] p-3 text-sm text-[var(--red)]">{error}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Fingerprint size={17} />}
        Approve this device
      </Button>
    </form>
  );
}
