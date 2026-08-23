import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-2)] focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange-soft)]",
        className,
      )}
      {...props}
    />
  );
}

