import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../lib/db/schema";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { authenticateMeshAgent, legacyMeshAgentAuthAllowed, meshAgentHeaders } from "../lib/mesh-access/security";

test("Gateway signatures bind fresh nonces, retain old-server compatibility and cannot downgrade", () => {
  const config = { routerId: "KM-LAB-001" as const, server: "KM-MESH-001" as const,
    serviceKey: "test-only-router-service-key-".repeat(3), encryptionKey: Buffer.alloc(32, 7).toString("base64") };
  const now = Date.parse("2026-10-06T12:00:00.000Z"), timestamp = String(Math.floor(now / 1000));
  const path = "/api/mesh/gateway/context", body = '{"test":true}', nonce = Buffer.alloc(32, 7).toString("base64url");
  const signed = meshAgentHeaders(config, path, body, timestamp, nonce);
  const request = (headers: HeadersInit = signed, url = path) => new Request("https://mesh.fixture" + url, { method: "POST", headers, body });
  const legacy = { "x-mesh-router": signed["x-mesh-router"], "x-mesh-time": timestamp, "x-mesh-auth": signed["x-mesh-auth"] };
  assert.equal(signed["x-mesh-auth"], createHmac("sha256", config.serviceKey).update(`${timestamp}\nPOST\n${path}\n${body}`).digest("hex"),
    "An old API can still verify the new client's v1 compatibility signature");
  assert.equal(authenticateMeshAgent(request(), body, config, now, {})?.version, "v2");
  assert.equal(authenticateMeshAgent(request(legacy), body, config, now, {}), null);
  const compatibility = { MESH_AGENT_LEGACY_AUTH_UNTIL: "2026-10-06T13:00:00.000Z" };
  assert.equal(authenticateMeshAgent(request(legacy), body, config, now, compatibility)?.version, "legacy");
  for (const headers of [
    { ...signed, "x-mesh-nonce": Buffer.alloc(32, 8).toString("base64url") },
    { ...signed, "x-mesh-auth-v2": "" }, { ...signed, "x-mesh-nonce": "" },
    { ...signed, "x-mesh-nonce": nonce.slice(0, -1) + "B" }, { ...signed, "x-mesh-router": "other" },
  ]) assert.equal(authenticateMeshAgent(request(headers), body, config, now, compatibility), null, "Malformed v2 must not fall back to valid v1");
  assert.equal(authenticateMeshAgent(request(), body + " ", config, now, compatibility), null);
  assert.equal(authenticateMeshAgent(request(signed, "/api/mesh/gateway/other"), body, config, now, compatibility), null);
  assert.equal(authenticateMeshAgent(request(), body, config, now + 61_000, compatibility), null);
  for (const until of [undefined, "", "never", "2026-10-06T11:00:00.000Z", "2026-10-08T12:00:00.000Z", "2026-02-30T12:00:00.000Z"])
    assert.equal(legacyMeshAgentAuthAllowed({ MESH_AGENT_LEGACY_AUTH_UNTIL: until }, now), false);
});

test("Durable replay claims stop parallel HTTP context minting, survive new clients and fail closed", async t => {
  const env = { ...process.env }, fetcher = globalThis.fetch;
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true",
    MESH_NATIVE_ACCESS_COMMISSIONED: "true", MESH_ROUTER_SERVICE_KEY: "gateway-replay-fixture-".repeat(3),
    MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") });
  delete process.env.MESH_AGENT_LEGACY_AUTH_UNTIL;
  globalThis.fetch = async () => { throw new Error("No external requests or payments in replay tests"); };
  const pg = await PGlite.create();
  await pg.exec(await readFile("scripts/mesh/agent-replay-schema.sql", "utf8"));
  await pg.exec(`CREATE TABLE mesh_access_contexts(id uuid PRIMARY KEY,router_id text NOT NULL,server text NOT NULL,
    mac_address text NOT NULL,ip_address text NOT NULL,join_token_hash text NOT NULL UNIQUE,browser_token_hash text NOT NULL,
    join_expires_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,joined_at timestamptz,created_at timestamptz NOT NULL DEFAULT now())`);
  const memory = drizzle(pg, { schema }), { db } = await import("../lib/db");
  const saved = new Map<string, unknown>();
  for (const key of ["insert", "execute"]) {
    saved.set(key, Reflect.get(db, key));
    Reflect.set(db, key, (Reflect.get(memory, key) as (...args: unknown[]) => unknown).bind(memory));
  }
  const config = readMeshAccessConfig(), { POST } = await import("../app/api/mesh/gateway/context/route");
  const body = JSON.stringify({ macAddress: "02:11:22:33:44:55", ipAddress: "10.30.0.197", server: config.server });
  const path = "/api/mesh/gateway/context";
  const request = (headers: HeadersInit, value = body) => new Request("https://mesh.fixture" + path, { method: "POST", body: value, headers });
  async function contexts() { return (await pg.query<{ count: number }>("SELECT count(*)::int AS count FROM mesh_access_contexts")).rows[0].count; }
  try {
    await t.test("One valid request mints one capability across twelve concurrent handlers", async () => {
      const headers = meshAgentHeaders(config, path, body);
      const responses = await Promise.all(Array.from({ length: 12 }, () => POST(request(headers))));
      assert.equal(responses.filter(response => response.status === 200).length, 1);
      assert.equal(responses.filter(response => response.status === 403).length, 11);
      assert.equal(await contexts(), 1);
      assert.equal((await POST(request(headers))).status, 403, "A fresh Request/worker must not reset durable replay state");
      const stored = (await pg.query("SELECT * FROM mesh_agent_requests")).rows;
      assert.equal(stored.length, 1);
      assert(!JSON.stringify(stored).includes(headers["x-mesh-auth"]));
      assert(!JSON.stringify(stored).includes(headers["x-mesh-nonce"]));
      assert(!JSON.stringify(stored).includes(body));
    });
    await t.test("Identical legitimate requests within the same second have different nonces", async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const first = meshAgentHeaders(config, path, body, timestamp), second = meshAgentHeaders(config, path, body, timestamp);
      assert.notEqual(first["x-mesh-nonce"], second["x-mesh-nonce"]);
      assert.equal((await POST(request(first))).status, 200);
      assert.equal((await POST(request(second))).status, 200);
      assert.equal(await contexts(), 3);
    });
    await t.test("Invalid signatures cannot consume valid nonce or reach the context insert", async () => {
      const headers = meshAgentHeaders(config, path, body);
      assert.equal((await POST(request({ ...headers, "x-mesh-auth-v2": "00".repeat(32) }))).status, 403);
      assert.equal((await POST(request(headers, body + " "))).status, 403);
      assert.equal(await contexts(), 3);
      assert.equal((await POST(request(headers))).status, 200);
    });
    await t.test("Explicit legacy transition deduplicates replay and fails closed after expiry", async () => {
      process.env.MESH_AGENT_LEGACY_AUTH_UNTIL = new Date(Date.now() + 3_600_000).toISOString();
      const signed = meshAgentHeaders(config, path, body);
      const headers = { "x-mesh-router": signed["x-mesh-router"], "x-mesh-time": signed["x-mesh-time"], "x-mesh-auth": signed["x-mesh-auth"] };
      assert.equal((await POST(request(headers))).status, 200);
      assert.equal((await POST(request(headers))).status, 403);
      process.env.MESH_AGENT_LEGACY_AUTH_UNTIL = new Date(Date.now() - 1000).toISOString();
      assert.equal((await POST(request(headers))).status, 403);
      delete process.env.MESH_AGENT_LEGACY_AUTH_UNTIL;
    });
    await t.test("Bounded cleanup removes expired hashes and a missing replay table never bypasses auth", async () => {
      await pg.exec("UPDATE mesh_agent_requests SET expires_at=now()-interval '1 minute'");
      assert.equal((await POST(request(meshAgentHeaders(config, path, body)))).status, 200);
      assert.equal((await pg.query("SELECT * FROM mesh_agent_requests")).rows.length, 1);
      const before = await contexts();
      await pg.exec("DROP TABLE mesh_agent_requests");
      assert.equal((await POST(request(meshAgentHeaders(config, path, body)))).status, 403);
      assert.equal(await contexts(), before, "Missing replay schema is an outage, never an in-memory or legacy bypass");
    });
  } finally {
    for (const [key, value] of saved) Reflect.set(db, key, value);
    globalThis.fetch = fetcher;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await pg.close();
  }
});
