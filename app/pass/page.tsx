import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { PassPanel } from "@/components/pass-panel";

export const metadata: Metadata = { title: "My pass" };

export default function PassPage() {
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <h1 className="flow-heading">My pass</h1>
        <PassPanel />
        <p className="flow-note"><Link href="/?view=internet">Back to internet passes</Link></p>
      </section>
    </main>
  );
}
