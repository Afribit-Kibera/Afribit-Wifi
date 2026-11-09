import { sql } from "drizzle-orm";
import { db } from "../db";

const num = (value: unknown) => Number(value ?? 0);
// A session the controller stopped reporting (controller or router offline) ends where it was last seen.
const sessionEnd = sql.raw(`COALESCE(d.ended_at, CASE WHEN d.last_seen_at < now()-interval '5 minutes' THEN d.last_seen_at END)`);
const sessionStop = sql.raw(`COALESCE(d.ended_at, d.last_seen_at)`);
const localDay = sql.raw(`(d.started_at AT TIME ZONE 'Africa/Nairobi')::date`);

export type ConnectionHour = { hour: string; peakOnline: number; averageOnline: number; peakOnWifi: number; devices: number };

// The last 24 hours, one row per hour, newest first.
export async function connectionHours(routerId: string): Promise<ConnectionHour[]> {
  const { rows } = await db.execute(sql`SELECT h AS hour,
    (SELECT max(online) FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at >= h AND sampled_at < h + interval '1 hour') AS peak_online,
    (SELECT avg(online) FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at >= h AND sampled_at < h + interval '1 hour') AS average_online,
    (SELECT max(on_wifi) FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at >= h AND sampled_at < h + interval '1 hour') AS peak_on_wifi,
    (SELECT count(DISTINCT d.mac_address) FROM mesh_device_sessions d WHERE d.router_id=${routerId}
      AND d.started_at < h + interval '1 hour' AND ${sessionStop} >= h) AS devices
    FROM generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') AS h
    ORDER BY h DESC`);
  return rows.map(row => ({ hour: new Date(String(row.hour)).toISOString(), peakOnline: num(row.peak_online),
    averageOnline: Math.round(num(row.average_online) * 10) / 10, peakOnWifi: num(row.peak_on_wifi), devices: num(row.devices) }));
}

export type ConnectionDay = { day: string; devices: number; sessions: number; peakOnline: number; bytesDown: number; bytesUp: number; averageMinutes: number };

// The last 30 days in Nairobi time, newest first. Data counts toward the day a session started.
export async function connectionDays(routerId: string): Promise<ConnectionDay[]> {
  const { rows } = await db.execute(sql`SELECT day::date::text AS day,
    (SELECT count(DISTINCT d.mac_address) FROM mesh_device_sessions d WHERE d.router_id=${routerId} AND ${localDay}=day::date) AS devices,
    (SELECT count(*) FROM mesh_device_sessions d WHERE d.router_id=${routerId} AND ${localDay}=day::date) AS sessions,
    (SELECT COALESCE(sum(d.bytes_down),0) FROM mesh_device_sessions d WHERE d.router_id=${routerId} AND ${localDay}=day::date) AS bytes_down,
    (SELECT COALESCE(sum(d.bytes_up),0) FROM mesh_device_sessions d WHERE d.router_id=${routerId} AND ${localDay}=day::date) AS bytes_up,
    (SELECT COALESCE(avg(extract(epoch FROM ${sessionStop} - d.started_at)),0)/60 FROM mesh_device_sessions d WHERE d.router_id=${routerId} AND ${localDay}=day::date) AS average_minutes,
    (SELECT COALESCE(max(online),0) FROM mesh_connection_samples WHERE router_id=${routerId} AND (sampled_at AT TIME ZONE 'Africa/Nairobi')::date=day::date) AS peak_online
    FROM generate_series((now() AT TIME ZONE 'Africa/Nairobi')::date - 29, (now() AT TIME ZONE 'Africa/Nairobi')::date, interval '1 day') AS day
    ORDER BY day DESC`);
  return rows.map(row => ({ day: String(row.day), devices: num(row.devices), sessions: num(row.sessions), peakOnline: num(row.peak_online),
    bytesDown: num(row.bytes_down), bytesUp: num(row.bytes_up), averageMinutes: Math.round(num(row.average_minutes)) }));
}

export type ConnectionTotals = { devices30: number; returning30: number; sessions30: number; bytes30: number; peakOnline30: number; peakAt: Date | null; since: Date | null };

export async function connectionTotals(routerId: string): Promise<ConnectionTotals> {
  const { rows: [row] } = await db.execute(sql`SELECT
    (SELECT count(DISTINCT mac_address) FROM mesh_device_sessions WHERE router_id=${routerId} AND started_at >= now()-interval '30 days') AS devices,
    (SELECT count(*) FROM (SELECT mac_address FROM mesh_device_sessions WHERE router_id=${routerId} AND started_at >= now()-interval '30 days'
      GROUP BY mac_address HAVING count(DISTINCT (started_at AT TIME ZONE 'Africa/Nairobi')::date) > 1) r) AS returning,
    (SELECT count(*) FROM mesh_device_sessions WHERE router_id=${routerId} AND started_at >= now()-interval '30 days') AS sessions,
    (SELECT COALESCE(sum(bytes_down+bytes_up),0) FROM mesh_device_sessions WHERE router_id=${routerId} AND started_at >= now()-interval '30 days') AS bytes,
    (SELECT online FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at >= now()-interval '30 days' ORDER BY online DESC, sampled_at DESC LIMIT 1) AS peak,
    (SELECT sampled_at FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at >= now()-interval '30 days' ORDER BY online DESC, sampled_at DESC LIMIT 1) AS peak_at,
    (SELECT min(sampled_at) FROM mesh_connection_samples WHERE router_id=${routerId}) AS since`);
  return { devices30: num(row.devices), returning30: num(row.returning), sessions30: num(row.sessions), bytes30: num(row.bytes),
    peakOnline30: num(row.peak), peakAt: row.peak_at ? new Date(String(row.peak_at)) : null, since: row.since ? new Date(String(row.since)) : null };
}

export type DeviceSession = { id: string; macAddress: string; ipAddress: string; orderId: string | null; plan: string | null;
  startedAt: Date; endedAt: Date | null; minutes: number; bytesDown: number; bytesUp: number };

// The most recent sessions, live ones included.
export async function recentSessions(routerId: string, limit = 50): Promise<DeviceSession[]> {
  const { rows } = await db.execute(sql`SELECT d.id, d.mac_address, d.ip_address, d.hotspot_user, d.started_at, ${sessionEnd} AS ended_at,
    extract(epoch FROM ${sessionStop} - d.started_at)/60 AS minutes, d.bytes_down, d.bytes_up,
    CASE WHEN o.id IS NULL THEN NULL ELSE COALESCE(p.kind,'personal') || ' · ' || COALESCE(pd.label,'Device 1') END AS plan, o.id AS order_id
    FROM mesh_device_sessions d
    LEFT JOIN mesh_access_orders o ON o.id = CASE WHEN d.hotspot_user ~ '^ma-[0-9a-f]{32}$' THEN substr(d.hotspot_user,4)::uuid END
    LEFT JOIN mesh_pass_devices pd ON pd.id=o.pass_device_id LEFT JOIN mesh_passes p ON p.id=pd.pass_id
    WHERE d.router_id=${routerId} ORDER BY d.last_seen_at DESC LIMIT ${limit}`);
  return rows.map(row => ({ id: String(row.id), macAddress: String(row.mac_address), ipAddress: String(row.ip_address ?? ""),
    orderId: row.order_id ? String(row.order_id) : null, plan: row.plan ? String(row.plan) : null,
    startedAt: new Date(String(row.started_at)), endedAt: row.ended_at ? new Date(String(row.ended_at)) : null,
    minutes: Math.round(num(row.minutes)), bytesDown: num(row.bytes_down), bytesUp: num(row.bytes_up) }));
}

// Cuts one device off now. The controller removes it from the router within
// about a minute. The pass stays, so the device can rejoin with it.
export async function disconnectOrder(routerId: string, orderId: string) {
  const { rows } = await db.execute(sql`UPDATE mesh_access_orders SET status='revoking',updated_at=now()
    WHERE id=${orderId}::uuid AND router_id=${routerId} AND status IN ('queued','claimed','active') RETURNING id`);
  return rows.length === 1;
}

// Ends a whole pass: no device can use or restore it again, and every device
// on it is removed from the router.
export async function endPass(routerId: string, passId: string) {
  const { rows: [row] } = await db.execute(sql`WITH ended AS (
      UPDATE mesh_passes SET revoked_at=now() WHERE id=${passId}::uuid AND router_id=${routerId} AND revoked_at IS NULL RETURNING id, origin_order_id),
    cut AS (UPDATE mesh_access_orders o SET status='revoking',updated_at=now() FROM ended e
      WHERE o.status IN ('queued','claimed','active')
        AND (o.id=e.origin_order_id OR o.pass_device_id IN (SELECT pd.id FROM mesh_pass_devices pd WHERE pd.pass_id=e.id)) RETURNING o.id)
    SELECT (SELECT count(*) FROM ended) AS ended, (SELECT count(*) FROM cut) AS devices`);
  return { ended: num(row.ended) === 1, devices: num(row.devices) };
}
