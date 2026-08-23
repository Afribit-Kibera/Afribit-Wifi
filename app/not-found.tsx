import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="text-center">
        <p className="font-mono text-sm text-[var(--orange)]">404</p>
        <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
        <Button asChild className="mt-6"><Link href="/">Return to WiFi</Link></Button>
      </div>
    </main>
  );
}

