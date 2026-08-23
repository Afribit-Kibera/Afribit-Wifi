import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { getAdminSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="portal-shell grid min-h-screen place-items-center p-5">
      <section className="panel w-full max-w-md p-7">
        <BrandMark />
        <p className="mt-10 text-xs font-bold uppercase text-[var(--orange)]">Operations</p>
        <h1 className="mt-3 text-3xl font-bold">Admin sign in</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Manage access, vouchers, payments and network policy.</p>
        <LoginForm />
      </section>
    </main>
  );
}

