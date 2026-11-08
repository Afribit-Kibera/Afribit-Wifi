import { sql } from "drizzle-orm";
import { db } from "../db";
import { readMeshAccessConfig } from "./config";
import type { RouterStats } from "./telemetry-schema";
export { routerStatsSchema, type RouterStats } from "./telemetry-schema";

export type StoredTelemetry = RouterStats & { reportedAt: string; rates?: Record<string, { rxBps: number; txBps: number }> };

export async function recordRouterTelemetry(stats: RouterStats) {
  const config = readMeshAccessConfig();
  const [previous] = (await db.execute(sql`SELECT payload,updated_at FROM mesh_router_telemetry WHERE router_id=${config.routerId}`)).rows as
    { payload: StoredTelemetry; updated_at: string | Date }[];
  // Interface throughput from the counter change since the last report.
  const rates: Record<string, { rxBps: number; txBps: number }> = {};
  const seconds = previous ? (Date.now() - new Date(previous.updated_at).getTime()) / 1000 : 0;
  if (previous && seconds >= 10 && seconds <= 600) {
    for (const item of stats.interfaces) {
      const old = previous.payload.interfaces?.find(entry => entry.name === item.name);
      if (old && item.rxBytes >= old.rxBytes && item.txBytes >= old.txBytes) {
        rates[item.name] = { rxBps: Math.round((item.rxBytes - old.rxBytes) * 8 / seconds), txBps: Math.round((item.txBytes - old.txBytes) * 8 / seconds) };
      }
    }
  }
  const payload: StoredTelemetry = { ...stats, reportedAt: new Date().toISOString(), rates };
  await db.execute(sql`INSERT INTO mesh_router_telemetry(router_id,payload,updated_at) VALUES(${config.routerId},${JSON.stringify(payload)}::jsonb,now())
    ON CONFLICT(router_id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=now()`);
}

export async function readRouterTelemetry() {
  const config = readMeshAccessConfig();
  const [row] = (await db.execute(sql`SELECT t.payload,t.updated_at,h.last_seen_at FROM (SELECT ${config.routerId}::text AS router_id) r
    LEFT JOIN mesh_router_telemetry t ON t.router_id=r.router_id LEFT JOIN mesh_agent_heartbeat h ON h.router_id=r.router_id`)).rows as
    { payload: StoredTelemetry | null; updated_at: string | Date | null; last_seen_at: string | Date | null }[];
  return { routerId: config.routerId, telemetry: row?.payload ?? null, reportedAt: row?.updated_at ? new Date(row.updated_at) : null,
    controllerSeenAt: row?.last_seen_at ? new Date(row.last_seen_at) : null };
}
