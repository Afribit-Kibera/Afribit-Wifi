import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { InstallMesh, MeshServiceWorker } from "@/components/install-mesh";
import { SavedPassesCard } from "@/components/saved-passes-card";

export const metadata: Metadata = { title: "Get the Mesh app" };

export default function AppPage() {
  return (
    <main className="mesh-flow">
      <MeshServiceWorker />
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <h1 className="flow-heading">Get the Mesh app.</h1>
        <p className="flow-copy">Your pass, free apps and Bitcoin lessons, one tap from your home screen. Nothing to download from a store.</p>
        <SavedPassesCard />
        <InstallMesh />
        <p className="flow-note"><Link href="/">Not now</Link></p>
      </section>
    </main>
  );
}
