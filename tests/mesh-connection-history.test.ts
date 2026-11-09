import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { RouterStats } from "../lib/mesh-access/telemetry-schema";

const router = "KM-LAB-001";
const report = (sessions: RouterStats["sessions"], active = sessions.length): RouterStats => ({
  resource: { cpuLoad: 5, freeMemory: 1, totalMemory: 2, uptimeSeconds: 100, version: "7", board: "hAP" },
  hotspot: { hosts: active + 1, active }, sessions, interfaces: [], wireguardHandshakeSeconds: [],
});
const session = (user: string, mac: string, uptimeSeconds: number, bytesOut = 1000) =>
  ({ user, ipAddress: "10.30.0.9", macAddress: mac, uptimeSeconds, bytesIn: 100, bytesOut, idleSeconds: 0 });

test("Connection history records sessions, and the admin can disconnect a device or end a pass", async () => {
  const env = { ...process.env };
  process.env.DATABASE_URL = "postgresql://fixture:fixture@unused.invalid/fixture";
  const pg = await PGlite.create();
  await pg.exec(`
    CREATE TYPE payment_status AS ENUM ('new','processing','settled','expired','invalid','refunded');
    CREATE TABLE payments(id uuid PRIMARY KEY,provider text NOT NULL DEFAULT 'bitika',metadata jsonb NOT NULL DEFAULT '{}');
    CREATE TABLE vouchers(id uuid PRIMARY KEY);
    CREATE TABLE access_grants(id uuid PRIMARY KEY,status text NOT NULL DEFAULT 'active',updated_at timestamptz);
    CREATE TABLE packages(id uuid PRIMARY KEY);
  `);
  for (const file of ["automatic-access-schema.sql", "device-passes-schema.sql", "connection-history-schema.sql"]) await pg.exec(await readFile(`scripts/mesh/${file}`, "utf8"));
  await pg.exec(await readFile("scripts/mesh/connection-history-schema.sql", "utf8")); // Safe to run twice.
  const { db } = await import("../lib/db");
  const saved = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  const { recordConnectionHistory, SESSION_REPORT_LIMIT } = await import("../lib/mesh-access/connection-history");
  const admin = await import("../lib/admin/connections");
  const open = async () => (await pg.query<{ mac_address: string; bytes_down: string }>(
    "SELECT mac_address, bytes_down FROM mesh_device_sessions WHERE ended_at IS NULL ORDER BY mac_address")).rows;
  try {
    const order = async (mac: string) => {
      const context = randomUUID(), id = randomUUID(), grant = randomUUID();
      await pg.query(`INSERT INTO mesh_access_contexts(id,router_id,server,mac_address,ip_address,join_token_hash,browser_token_hash,join_expires_at,expires_at,joined_at)
        VALUES($1,$2,'mesh',$3,'10.30.0.9',$4,'b',now(),now()+interval '1 day',now())`, [context, router, mac, randomUUID()]);
      await pg.query("INSERT INTO access_grants(id) VALUES($1)", [grant]);
      await pg.query(`INSERT INTO mesh_access_orders(id,context_id,router_id,grant_id,status,encrypted_order,expires_at) VALUES($1,$2,$3,$4,'active','x',now()+interval '1 hour')`, [id, context, router, grant]);
      return id;
    };
    const phone = await order("02:00:00:00:00:01");
    const user = `ma-${phone.replaceAll("-", "")}`;

    await recordConnectionHistory(router, report([session(user, "02:00:00:00:00:01", 600), session("guest", "02:00:00:00:00:02", 60)]), { rxBps: 5000, txBps: 1000 });
    assert.deepEqual((await open()).map(row => row.mac_address), ["02:00:00:00:00:01", "02:00:00:00:00:02"]);

    // The guest left; the phone is still on and has used more data.
    await recordConnectionHistory(router, report([session(user, "02:00:00:00:00:01", 660, 5000)]));
    assert.deepEqual((await open()).map(row => [row.mac_address, Number(row.bytes_down)]), [["02:00:00:00:00:01", 5000]]);

    // The phone reconnected: the router's session restarted, so a new row begins.
    await recordConnectionHistory(router, report([session(user, "02:00:00:00:00:01", 30, 200)]));
    assert.equal((await pg.query<{ n: number }>("SELECT count(*)::int AS n FROM mesh_device_sessions")).rows[0].n, 3);
    assert.deepEqual((await open()).map(row => Number(row.bytes_down)), [200]);

    const totals = await admin.connectionTotals(router);
    assert.equal(totals.devices30, 2);
    assert.equal(totals.sessions30, 3);
    assert.equal(totals.peakOnline30, 2);
    const hours = await admin.connectionHours(router);
    assert.equal(hours.length, 24);
    assert.deepEqual([hours[0].peakOnline, hours[0].peakOnWifi, hours[0].devices], [2, 3, 2]);
    const days = await admin.connectionDays(router);
    assert.equal(days.length, 30);
    assert.deepEqual([days[0].devices, days[0].sessions, days[0].peakOnline], [2, 3, 2]);
    const recent = await admin.recentSessions(router);
    assert.equal(recent.length, 3);
    assert.equal(recent.find(item => item.endedAt === null)?.orderId, phone, "A live session links to its order");
    assert.equal(recent.find(item => item.macAddress === "02:00:00:00:00:02")?.plan, null);

    // A full report may leave devices out, so it never closes sessions.
    const crowd = Array.from({ length: SESSION_REPORT_LIMIT }, (_, index) => session(`guest-${index}`, `02:00:00:00:01:${index.toString(16).padStart(2, "0").toUpperCase()}`, 60));
    await recordConnectionHistory(router, report(crowd));
    assert.equal((await open()).length, SESSION_REPORT_LIMIT + 1, "The phone stays open");

    // Disconnect: the order is handed to the controller for removal, once.
    assert.equal(await admin.disconnectOrder(router, phone), true);
    assert.equal(await admin.disconnectOrder(router, phone), false);
    assert.equal((await pg.query<{ status: string }>("SELECT status FROM mesh_access_orders WHERE id=$1", [phone])).rows[0].status, "revoking");
    assert.equal(await admin.disconnectOrder("OTHER-ROUTER", await order("02:00:00:00:00:05")), false, "Only this router's orders");

    // End pass: the pass is closed and every live device on it is removed.
    const first = await order("02:00:00:00:00:03"), second = await order("02:00:00:00:00:04");
    const pass = randomUUID(), slot = randomUUID();
    await pg.query(`INSERT INTO mesh_passes(id,router_id,kind,device_limit,origin_order_id,code_hash,code_ciphertext,expires_at,speed_limit_kbps)
      VALUES($1,$2,'household',3,$3,'h','c',now()+interval '1 hour',2000)`, [pass, router, first]);
    await pg.query("INSERT INTO mesh_pass_devices(id,pass_id,slot,label,mac_address) VALUES($1,$2,2,'TV','02:00:00:00:00:04')", [slot, pass]);
    await pg.query("UPDATE mesh_access_orders SET pass_device_id=$1 WHERE id=$2", [slot, second]);
    assert.deepEqual(await admin.endPass(router, pass), { ended: true, devices: 2 });
    assert.deepEqual(await admin.endPass(router, pass), { ended: false, devices: 0 });
    const statuses = (await pg.query<{ status: string }>("SELECT status FROM mesh_access_orders WHERE id IN ($1,$2)", [first, second])).rows.map(row => row.status);
    assert.deepEqual(statuses, ["revoking", "revoking"]);
  } finally {
    Reflect.set(db, "execute", saved);
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await pg.close();
  }
});
