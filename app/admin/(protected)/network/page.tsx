import { requireAdmin } from "@/lib/auth";
import { connection } from "next/server";
import { Activity, CalendarDays, Clock3, Repeat, Smartphone, Wifi } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { AdminRouterHealth } from "@/components/admin-router-health";
import { connectionDays, connectionHours, connectionTotals, recentSessions } from "@/lib/admin/connections";
import { readMeshAccessConfig } from "@/lib/mesh-access/config";

const nairobi = { timeZone: "Africa/Nairobi" } as const;
const time = (date: Date) => date.toLocaleString("en-KE", { ...nairobi, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-KE", { ...nairobi, hour: "2-digit", minute: "2-digit" });
const dayLabel = (day: string) => new Date(`${day}T12:00:00+03:00`).toLocaleDateString("en-KE", { ...nairobi, weekday: "short", day: "numeric", month: "short" });
function bytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"]; let index = 0, amount = value;
  while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index++; }
  return `${amount.toFixed(index ? 1 : 0)} ${units[index]}`;
}
const minutes = (value: number) => value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value}m`;
// A thin bar so busy hours stand out at a glance.
const bar = (value: number, max: number) => <span className="ml-2 inline-block h-2 rounded-full bg-[var(--green)] align-middle" style={{ width: `${max ? Math.max(2, Math.round(80 * value / max)) : 0}px` }} aria-hidden="true" />;

export default async function NetworkPage() {
  await requireAdmin(); // The layout's check doesn't stop this page rendering; check here too.
  await connection(); // Admin data is per request; never read the database at build time.
  const routerId = readMeshAccessConfig().routerId;
  let history;
  try { history = await Promise.all([connectionTotals(routerId), connectionHours(routerId), connectionDays(routerId), recentSessions(routerId)]); }
  catch { history = null; }
  return (
    <>
      <PageHeading eyebrow="Mesh" title="Connections" description="Who is on the Mesh right now, and how busy it has been. Times follow Nairobi." />
      <AdminRouterHealth />
      {history ? <ConnectionHistory data={history} /> : <section className="panel p-5"><p className="text-sm text-[var(--muted)]">Connection history starts once the connection-history migration is applied.</p></section>}
    </>
  );
}

function ConnectionHistory({ data: [totals, hours, days, sessions] }: { data: [Awaited<ReturnType<typeof connectionTotals>>, Awaited<ReturnType<typeof connectionHours>>, Awaited<ReturnType<typeof connectionDays>>, Awaited<ReturnType<typeof recentSessions>>] }) {
  const peakHour = Math.max(0, ...hours.map(hour => hour.peakOnline));
  const peakDay = Math.max(0, ...days.map(day => day.devices));
  const metrics = [
    { label: "Devices (30 days)", value: String(totals.devices30), note: `${totals.returning30} came back on another day`, icon: Smartphone, tone: "green" },
    { label: "Sessions (30 days)", value: String(totals.sessions30), note: "times a device came online", icon: Repeat, tone: "" },
    { label: "Busiest moment", value: String(totals.peakOnline30), note: totals.peakAt ? `online at once · ${time(totals.peakAt)}` : "online at once", icon: Activity, tone: "orange" },
    { label: "Data used (30 days)", value: bytes(totals.bytes30), note: totals.since ? `recording since ${time(totals.since)}` : "recording starts with the next report", icon: Wifi, tone: "gold" },
  ];
  return <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, note, icon: Icon, tone }) => <div key={label} className={`panel metric ${tone} p-5`}>
        <div className="flex items-center justify-between text-[var(--muted)]"><span className="text-xs font-semibold">{label}</span><Icon size={17} /></div>
        <strong className="mt-4 block text-2xl">{value}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{note}</span>
      </div>)}
    </div>
    <section className="panel mt-6">
      <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold"><Clock3 size={16} /> Last 24 hours</h2></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Hour</th><th>Most online at once</th><th>Average online</th><th>Most on Wi-Fi</th><th>Different devices</th></tr></thead>
        <tbody>{hours.map(hour => <tr key={hour.hour}><td>{hourLabel(hour.hour)}</td><td>{hour.peakOnline}{bar(hour.peakOnline, peakHour)}</td><td>{hour.averageOnline}</td><td>{hour.peakOnWifi}</td><td>{hour.devices}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel mt-6">
      <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} /> Last 30 days</h2></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Day</th><th>Devices</th><th>Sessions</th><th>Most online at once</th><th>Average session</th><th>Down / up</th></tr></thead>
        <tbody>{days.map(day => <tr key={day.day}><td>{dayLabel(day.day)}</td><td>{day.devices}{bar(day.devices, peakDay)}</td><td>{day.sessions}</td><td>{day.peakOnline}</td><td>{day.sessions ? minutes(day.averageMinutes) : "—"}</td><td className="text-xs">{day.sessions ? `${bytes(day.bytesDown)} / ${bytes(day.bytesUp)}` : "—"}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel mt-6">
      <div className="border-b border-[var(--line)] px-5 py-4"><h2 className="text-sm font-bold">Recent sessions</h2></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Device</th><th>Plan</th><th>Came online</th><th>Left</th><th>Time online</th><th>Down / up</th></tr></thead>
        <tbody>{sessions.map(session => <tr key={session.id}><td className="font-mono text-xs">{session.macAddress}<span className="block text-[var(--muted)]">{session.ipAddress}</span></td>
          <td>{session.plan ?? <span className="text-[var(--muted)]">—</span>}</td><td>{time(session.startedAt)}</td>
          <td>{session.endedAt ? time(session.endedAt) : <span className="font-semibold text-[var(--green)]">Online now</span>}</td>
          <td>{minutes(session.minutes)}</td><td className="text-xs">{bytes(session.bytesDown)} / {bytes(session.bytesUp)}</td></tr>)}
          {sessions.length === 0 && <tr><td colSpan={6} className="h-28 text-center text-[var(--muted)]">No sessions recorded yet.</td></tr>}</tbody></table></div>
    </section>
  </>;
}
