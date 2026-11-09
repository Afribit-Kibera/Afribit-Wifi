import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CheckCircle2, Wifi } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { MeshNoticeBanner } from "@/components/mesh-notice-banner";
import { customerNotice } from "@/lib/mesh-notice";

export const metadata: Metadata = { title: "You’re online" };

// Where the sign-in window lands after a purchase. Loading any page makes the
// phone check the Wi-Fi again, so its Cancel button turns into Done.
export default async function OnlinePage() {
  await connection(); // The notice is read per request, never at build time.
  const notice = await customerNotice();
  return (
    <main className="mesh-flow">
      <section className="mesh-flow-card">
        <Link href="/" aria-label="Return to Mesh"><BrandMark /></Link>
        <div className="flow-rule" />
        <MeshNoticeBanner notice={notice} />
        <section className="flow-success" aria-labelledby="mesh-online-heading" role="status">
          <div className="flow-success-mark"><Wifi size={32} aria-hidden="true" /><CheckCircle2 size={21} aria-hidden="true" /></div>
          <p className="flow-success-eyebrow">Internet is ready</p>
          <h1 id="mesh-online-heading" className="flow-heading">You’re online.</h1>
          <p className="flow-copy">Tap <strong>Done</strong> at the top of this window to close it, then open any app.</p>
          <p className="flow-note">On Android, tap the tick or the back arrow. <Link href="/pass">My pass</Link> · <Link href="/app">Get the Mesh app</Link></p>
        </section>
      </section>
    </main>
  );
}
