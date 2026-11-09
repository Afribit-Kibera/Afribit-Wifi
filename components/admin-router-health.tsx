import { sql } from "drizzle-orm";
import { Activity, Cpu, MemoryStick, Router, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminConfirmAction } from "@/components/admin-confirm-action";
import { disconnectDeviceAction } from "@/app/admin/(protected)/network/actions";
import { db } from "@/lib/db";
import { readRouterTelemetry, WAN_INTERFACE } from "@/lib/mesh-access/telemetry";

function duration(seconds: number) {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
function bytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"]; let index = 0, amount = value;
  while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index++; }
  return `${amount.toFixed(index ? 1 : 0)} ${units[index]}`;
}
// True when the timestamp is within the last `ms` milliseconds.
const recent = (date: Date | null, ms: number) => Boolean(date && date.getTime() > Date.now() - ms);
const mbps = (bps: number) => `${(bps / 1_000_000).toFixed(2)} Mbps`;
const orderId = (user: string) => /^ma-[a-f0-9]{32}$/.test(user)
  ? user.slice(3).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5") : null;

// Live MikroTik health from the Mesh controller (read-only, about once a minute).
export async function AdminRouterHealth() {
  let health: Awaited<ReturnType<typeof readRouterTelemetry>>;
  try { health = await readRouterTelemetry(); }
  catch { return <section className="panel p-5"><p className="text-sm text-[var(--muted)]">Router health is unavailable until the device-pass migration is applied.</p></section>; }
  const { telemetry, reportedAt, controllerSeenAt } = health;
  const controllerOnline = recent(controllerSeenAt, 90_000);
  const fresh = recent(reportedAt, 180_000);
  const ids = (telemetry?.sessions ?? []).map(session => orderId(session.user)).filter((id): id is string => Boolean(id));
  const plans = new Map<string, { kind: string; label: string; expiresAt: string }>();
  if (ids.length) {
    const rows = await db.execute(sql`SELECT o.id,COALESCE(p.kind,'personal') AS kind,COALESCE(d.label,'Device 1') AS label,o.expires_at FROM mesh_access_orders o
      LEFT JOIN mesh_pass_devices d ON d.id=o.pass_device_id LEFT JOIN mesh_passes p ON p.id=d.pass_id
      WHERE o.id IN (${sql.join(ids.map(id => sql`${id}::uuid`), sql`,`)})`);
    for (const row of rows.rows) plans.set(String(row.id), { kind: String(row.kind), label: String(row.label), expiresAt: new Date(String(row.expires_at)).toLocaleString("en-KE") });
  }
  const resource = telemetry?.resource;
  const memoryUsed = resource && resource.totalMemory ? Math.round(100 * (1 - resource.freeMemory / resource.totalMemory)) : null;
  const wan = telemetry?.interfaces.find(item => item.name === WAN_INTERFACE);
  const wanRate = wan ? telemetry?.rates?.[wan.name] : undefined;
  return (
    <section className="panel mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Router size={16} /> Mesh gateway {health.routerId}</h2>
        <div className="flex gap-2">
          <Badge tone={controllerOnline ? "success" : "danger"}>{controllerOnline ? "Controller connected" : "Controller offline"}</Badge>
          <Badge tone={fresh ? "success" : "warning"}>{reportedAt ? `Router report ${reportedAt.toLocaleTimeString("en-KE")}` : "No router report yet"}</Badge>
        </div>
      </div>
      {resource ? <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="panel metric p-4"><span className="flex items-center gap-1 text-xs text-[var(--muted)]"><Cpu size={13} /> CPU</span><strong className="mt-3 block text-2xl">{resource.cpuLoad}%</strong></div>
        <div className="panel metric p-4"><span className="flex items-center gap-1 text-xs text-[var(--muted)]"><MemoryStick size={13} /> Memory used</span><strong className="mt-3 block text-2xl">{memoryUsed ?? "—"}%</strong><span className="text-xs text-[var(--muted)]">{bytes(resource.freeMemory)} free</span></div>
        <div className="panel metric green p-4"><span className="flex items-center gap-1 text-xs text-[var(--muted)]"><Users size={13} /> Online / on Wi-Fi</span><strong className="mt-3 block text-2xl">{telemetry.hotspot.active} / {telemetry.hotspot.hosts}</strong><span className="text-xs text-[var(--muted)]">{Math.max(0, telemetry.hotspot.hosts - telemetry.hotspot.active)} without a pass</span></div>
        <div className="panel metric p-4"><span className="flex items-center gap-1 text-xs text-[var(--muted)]"><Activity size={13} /> Internet link now</span><strong className="mt-3 block text-lg">{wanRate ? `↓ ${mbps(wanRate.rxBps)}` : "—"}</strong><span className="text-xs text-[var(--muted)]">{wanRate ? `↑ ${mbps(wanRate.txBps)}` : "Needs two reports"}</span></div>
        <div className="panel metric p-4"><span className="text-xs text-[var(--muted)]">Uptime · RouterOS</span><strong className="mt-3 block text-lg">{duration(resource.uptimeSeconds)}</strong><span className="text-xs text-[var(--muted)]">{resource.version} · {resource.board}</span></div>
      </div> : <p className="p-5 text-sm text-[var(--muted)]">Waiting for the controller’s first router report.</p>}
      {telemetry?.sessions.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Device</th><th>Address</th><th>Plan</th><th>Online for</th><th>Down / up</th><th>Ends</th><th></th></tr></thead><tbody>
        {telemetry.sessions.map(session => {
          const plan = plans.get(orderId(session.user) ?? "");
          return <tr key={`${session.user}-${session.macAddress}`}><td className="font-mono text-xs">{session.macAddress}</td><td className="font-mono text-xs">{session.ipAddress}</td>
            <td>{plan ? `${plan.kind} · ${plan.label}` : <span className="text-[var(--muted)]">{session.user.startsWith("ma-") ? "Automatic" : session.user}</span>}</td>
            <td>{duration(session.uptimeSeconds)}{session.idleSeconds > 300 ? <span className="text-xs text-[var(--muted)]"> · idle {duration(session.idleSeconds)}</span> : null}</td>
            <td className="text-xs">{bytes(session.bytesOut)} / {bytes(session.bytesIn)}</td><td className="text-xs">{plan?.expiresAt ?? "—"}</td>
            <td>{orderId(session.user) ? <AdminConfirmAction action={disconnectDeviceAction} name="orderId" value={orderId(session.user)!} label="Disconnect"
              confirm="Takes this device off the internet within a minute. Its pass stays, so it can rejoin from the Mesh page." /> : null}</td></tr>;
        })}
      </tbody></table></div> : null}
    </section>
  );
}
