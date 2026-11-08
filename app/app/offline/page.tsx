import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = { title: "Not connected" };
export const dynamic = "force-static";

// Shown by the home-screen app when the phone cannot reach Mesh.
export default function OfflinePage() {
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <BrandMark />
        <div className="flow-rule" />
        <h1 className="flow-heading">You’re not on Mesh right now.</h1>
        <p className="flow-copy">Connect to the Mesh Wi-Fi network, then open this app again. If you already have a pass, it reconnects when you open Mesh.</p>
        <Link className="flow-action" href="/">Try again</Link>
      </section>
    </main>
  );
}
