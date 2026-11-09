import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { BrandMark } from "@/components/brand-mark";
import { MeshNoticeBanner } from "@/components/mesh-notice-banner";
import { readMeshNotice } from "@/lib/mesh-notice";
import { PassPanel } from "@/components/pass-panel";

export const metadata: Metadata = { title: "My pass" };

export default async function PassPage() {
  await connection(); // The notice is read per request, never at build time.
  const notice = await readMeshNotice();
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <MeshNoticeBanner notice={notice} />
        <h1 className="flow-heading">My pass</h1>
        <PassPanel />
        <p className="flow-note"><Link href="/?view=internet">Back to internet passes</Link></p>
      </section>
    </main>
  );
}
