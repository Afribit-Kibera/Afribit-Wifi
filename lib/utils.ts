import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSats(value: number | null | undefined) {
  return `${new Intl.NumberFormat("en-KE").format(value ?? 0)} sats`;
}

export function formatKes(value: number | null | undefined) {
  return `KES ${new Intl.NumberFormat("en-KE").format(value ?? 0)}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

export function normalizeHostname(input: string) {
  const candidate = input.includes("://") ? input : `https://${input}`;
  return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
}
