import { redirect } from "next/navigation";
import Link from "next/link";
import { count, isNull } from "drizzle-orm";
import { BrandMark } from "@/components/brand-mark";
import { PasskeyEnrollment } from "@/components/passkey-enrollment";
import { PasskeyLogin } from "@/components/passkey-login";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys } from "@/lib/db/schema";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  const [result] = await db.select({ value: count() }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  const hasPasskeys = result.value > 0;
  return (
    <main className="portal-shell grid min-h-screen place-items-center p-5">
      <section className="panel w-full max-w-md p-7">
        <BrandMark />
        <p className="mt-10 text-xs font-bold uppercase text-[var(--orange)]">Secure operations</p>
        <h1 className="mt-3 text-3xl font-bold">{hasPasskeys ? "Admin access" : "Register first device"}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{hasPasskeys ? "Continue with the fingerprint, face scan, or PIN configured on an approved device." : "Use the private enrollment code to approve the first operations device."}</p>
        {hasPasskeys ? <><PasskeyLogin /><Link href="/admin/enroll" className="mt-4 block text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--orange)]">Enroll a new approved device</Link></> : <PasskeyEnrollment mode="bootstrap" />}
      </section>
    </main>
  );
}
