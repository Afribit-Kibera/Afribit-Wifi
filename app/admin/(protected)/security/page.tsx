import { desc, isNull } from "drizzle-orm";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAX_ADMIN_DEVICES } from "@/lib/admin-devices";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminPasskeys } from "@/lib/db/schema";
import { revokePasskeyAction } from "./actions";

export default async function SecurityPage() {
  const session = await requireAdmin();
  const devices = await db.select().from(adminPasskeys).where(isNull(adminPasskeys.revokedAt)).orderBy(desc(adminPasskeys.createdAt));
  return (
    <>
      <PageHeading eyebrow="Access control" title="Approved devices" description="Platform passkeys authorized for 3 West Satenet WiFi operations." />
      <section className="panel">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div><h2 className="text-sm font-bold">Active passkeys</h2><p className="mt-1 text-xs text-[var(--muted)]">Device slots are provisioned outside the admin portal.</p></div>
          <Badge tone={devices.length === MAX_ADMIN_DEVICES ? "success" : "neutral"}>{devices.length} / {MAX_ADMIN_DEVICES}</Badge>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {devices.map((device) => {
            const current = device.id === session.passkeyId;
            return (
              <div key={device.id} className="flex items-center gap-4 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--muted)]">{device.deviceType === "singleDevice" ? <KeyRound size={17} /> : <ShieldCheck size={17} />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{device.deviceName}</strong><Badge>Slot {device.slot}</Badge>{current && <Badge tone="success">Current</Badge>}{device.backedUp && <Badge>Synced</Badge>}</div>
                  <p className="mt-1 text-xs text-[var(--muted)]">Added {device.createdAt.toLocaleString("en-KE")} | {device.lastUsedAt ? `Last used ${device.lastUsedAt.toLocaleString("en-KE")}` : "Not used yet"}</p>
                </div>
                <form action={revokePasskeyAction}><input type="hidden" name="id" value={device.id} /><Button type="submit" variant="danger" size="icon" disabled={current} title={current ? "Current device cannot revoke itself" : "Revoke device"}><Trash2 size={16} /></Button></form>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
