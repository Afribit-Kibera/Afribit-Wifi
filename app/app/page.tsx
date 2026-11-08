import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, KeyRound, Wifi } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { InstallMesh, MeshServiceWorker } from "@/components/install-mesh";

export const metadata: Metadata = { title: "Get the Mesh app" };

export default function AppPage() {
  return (
    <main className="mesh-flow">
      <MeshServiceWorker />
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <h1 className="flow-heading">Mesh on your home screen.</h1>
        <p className="flow-copy">One tap to your pass, free learning and local services. No app store, nothing to download over data.</p>
        <ul className="install-benefits">
          <li><KeyRound size={18} aria-hidden="true" /><span><strong>Your pass</strong> Time left, your pass code and your household devices.</span></li>
          <li><BookOpen size={18} aria-hidden="true" /><span><strong>Free on Mesh</strong> Learning and apps that don’t need a pass.</span></li>
          <li><Wifi size={18} aria-hidden="true" /><span><strong>Back online fast</strong> Buy or reconnect without hunting for the sign-in page.</span></li>
        </ul>
        <InstallMesh />
        <p className="flow-note"><Link href="/">Continue in the browser</Link></p>
      </section>
    </main>
  );
}
