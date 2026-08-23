"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Package, Router, ShieldCheck, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/vouchers", label: "Vouchers", icon: Ticket },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/whitelist", label: "Free sites", icon: ShieldCheck },
  { href: "/admin/network", label: "Network", icon: Router },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1 lg:p-4">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]", active && "bg-[var(--orange-soft)] text-[var(--orange)]")}>
            <Icon size={17} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
