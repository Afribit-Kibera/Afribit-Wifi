import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { clearAdminSession, requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  async function logout() { "use server"; await clearAdminSession(); }
  return (
    <div className="admin-grid">
      <aside className="admin-sidebar">
        <div className="hidden h-20 items-center border-b border-[var(--line)] px-5 lg:flex"><BrandMark /></div>
        <div className="flex items-center justify-between border-b border-[var(--line)] p-3 lg:hidden"><BrandMark /><span className="text-xs text-[var(--muted)]">Admin</span></div>
        <AdminNav />
        <div className="hidden border-t border-[var(--line)] p-4 lg:block">
          <p className="truncate px-3 text-xs text-[var(--muted)]">{session.email}</p>
          <form action={logout}><Button type="submit" variant="ghost" className="mt-2 w-full justify-start"><LogOut size={16} /> Sign out</Button></form>
        </div>
      </aside>
      <div className="admin-main">
        <header className="flex h-20 items-center justify-between border-b border-[var(--line)] px-5 md:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><span className="size-2 rounded-full bg-[var(--green-bright)]" /> System online</div>
          <span className="hidden text-xs text-[var(--muted)] md:block">wifi.afribit.africa</span>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

