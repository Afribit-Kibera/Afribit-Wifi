import { count, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { PasskeyEnrollment } from "@/components/passkey-enrollment";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys } from "@/lib/db/schema";
import { MAX_ADMIN_DEVICES } from "@/lib/admin-devices";

export default async function EnrollAdminDevicePage() {
  if (await getAdminSession()) redirect("/admin/security");
  const [result] = await db.select({ value: count() }).from(adminPasskeys).where(isNull(adminPasskeys.revokedAt));
  if (result.value >= MAX_ADMIN_DEVICES) redirect("/admin/login");
  return (
    <main className="portal-shell grid min-h-screen place-items-center p-5">
      <section className="panel w-full max-w-md p-7">
        <BrandMark />
        <p className="mt-10 text-xs font-bold uppercase text-[var(--orange)]">Device pairing</p>
        <h1 className="mt-3 text-3xl font-bold">Approve this device</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Enter the operator-issued pairing code assigned to this device.</p>
        <PasskeyEnrollment />
      </section>
    </main>
  );
}
