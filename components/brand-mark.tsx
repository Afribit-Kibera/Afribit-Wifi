import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="brand-symbol mesh-brand-symbol" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-lockup leading-none">
          <strong className="brand-name block text-xl font-bold text-[var(--text)]">Mesh</strong>
        </span>
      )}
    </div>
  );
}
