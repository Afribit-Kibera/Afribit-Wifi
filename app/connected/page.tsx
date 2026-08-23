import Link from "next/link";
import { CheckCircle2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export default function ConnectedPage() {
  return (
    <main className="portal-shell grid min-h-screen place-items-center p-5">
      <section className="panel w-full max-w-md p-7 text-center">
        <BrandMark className="justify-center" />
        <CheckCircle2 className="mx-auto mt-10 text-[var(--green-bright)]" size={46} />
        <h1 className="mt-5 text-3xl font-bold">You are connected.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your access pass is active on this device.</p>
        <Button asChild className="mt-7 w-full"><Link href="https://google.com"><Wifi size={17} /> Start browsing</Link></Button>
      </section>
    </main>
  );
}

