import { Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="brand-symbol" aria-hidden="true"><Wifi size={21} strokeWidth={2.5} /></span>
      {!compact && (
        <span className="brand-lockup leading-none">
          <strong className="brand-name block text-sm font-bold text-[var(--text)]">3 West Satenet</strong>
          <span className="brand-kicker mt-1 block text-[10px] font-bold uppercase text-[var(--orange)]">WiFi</span>
        </span>
      )}
    </div>
  );
}
