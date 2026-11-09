import { sql } from "drizzle-orm";
import { db } from "../db";
import type { RouterStats } from "./telemetry-schema";

// The router helper lists at most this many sessions per report.
export const SESSION_REPORT_LIMIT = 60;
// A session whose router-reported start moves later by more than this is a new session.
const RESTART_SLACK_SECONDS = 120;
const KEEP_DAYS = 180;

// Saves one report into the connection history: a count sample, and a row
// per device session that is opened, updated or closed.
export async function recordConnectionHistory(routerId: string, stats: RouterStats, wan?: { rxBps: number; txBps: number }) {
  await db.execute(sql`INSERT INTO mesh_connection_samples(router_id,sampled_at,on_wifi,online,wan_down_bps,wan_up_bps)
    VALUES(${routerId},now(),${stats.hotspot.hosts},${stats.hotspot.active},${wan?.rxBps ?? null},${wan?.txBps ?? null})
    ON CONFLICT DO NOTHING`);

  const sessions = JSON.stringify(stats.sessions.map(item => ({ user: item.user, mac: item.macAddress.toUpperCase(), ip: item.ipAddress,
    uptime: item.uptimeSeconds, down: item.bytesOut, up: item.bytesIn })));
  const reported = sql`jsonb_to_recordset(${sessions}::jsonb) AS s("user" text, mac text, ip text, uptime bigint, down bigint, up bigint)`;

  // The router restarted the session (its start moved later): close the old row.
  await db.execute(sql`UPDATE mesh_device_sessions d SET ended_at=d.last_seen_at FROM ${reported}
    WHERE d.router_id=${routerId} AND d.ended_at IS NULL AND d.mac_address=s.mac AND d.hotspot_user=s."user"
      AND now() - make_interval(secs => s.uptime) > d.started_at + make_interval(secs => ${RESTART_SLACK_SECONDS})`);
  // Devices no longer online. A full report may have left some out, so only a short one closes sessions.
  if (stats.sessions.length < SESSION_REPORT_LIMIT) {
    await db.execute(sql`UPDATE mesh_device_sessions d SET ended_at=d.last_seen_at
      WHERE d.router_id=${routerId} AND d.ended_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM ${reported} WHERE s.mac=d.mac_address AND s."user"=d.hotspot_user)`);
  }
  if (stats.sessions.length) {
    await db.execute(sql`INSERT INTO mesh_device_sessions(router_id,mac_address,hotspot_user,ip_address,started_at,last_seen_at,bytes_down,bytes_up)
      SELECT ${routerId},s.mac,s."user",s.ip,now() - make_interval(secs => s.uptime),now(),s.down,s.up FROM ${reported}
      ON CONFLICT (router_id,mac_address,hotspot_user) WHERE ended_at IS NULL
      DO UPDATE SET last_seen_at=now(),ip_address=EXCLUDED.ip_address,
        bytes_down=GREATEST(mesh_device_sessions.bytes_down,EXCLUDED.bytes_down),bytes_up=GREATEST(mesh_device_sessions.bytes_up,EXCLUDED.bytes_up)`);
  }

  await db.execute(sql`DELETE FROM mesh_connection_samples WHERE router_id=${routerId} AND sampled_at < now() - make_interval(days => ${KEEP_DAYS})`);
  await db.execute(sql`DELETE FROM mesh_device_sessions WHERE router_id=${routerId} AND last_seen_at < now() - make_interval(days => ${KEEP_DAYS})`);
}
