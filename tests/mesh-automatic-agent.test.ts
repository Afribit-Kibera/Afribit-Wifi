import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { validateAccessPackage, validateAccessOrder, validateActiveResult, type AccessOrder } from "../lib/mesh-access/model";
import { MeshCloudClient, processAccessJob, createJoinHandler, readDaemonConfig, pollMeshCloud } from "../gateway-agent/mesh-daemon";
import { verifyMeshAgent } from "../lib/mesh-access/security";

const now = 1_791_222_000_000;
function order(): AccessOrder {
  const id = randomUUID();
  return { id, routerId: "KM-LAB-001", server: "KM-MESH-001", macAddress: "02:11:22:33:44:55", ipAddress: "10.30.0.197",
    user: `ma-${id.replaceAll("-", "")}`, password: "s".repeat(43), expiresAt: new Date(now + 300_000).toISOString(),
    durationMinutes: 5, dataLimitMb: null, speedLimitKbps: 2000, paymentId: randomUUID() };
}
const session = (value: AccessOrder) => ({ active: true as const, macAddress: value.macAddress, ipAddress: value.ipAddress,
  server: value.server, user: value.user, expiresAt: value.expiresAt });

test("Automatic package/order bounds reject management targets, invalid sources and excessive deadlines", () => {
  assert.deepEqual(validateAccessPackage({ durationMinutes: 5 }), { durationMinutes: 5, dataLimitMb: null, speedLimitKbps: 2000 });
  assert.deepEqual(validateAccessPackage({ durationMinutes: 44_640, speedLimitKbps: 100_000, dataLimitMb: 2_097_151 }),
    { durationMinutes: 44_640, speedLimitKbps: 100_000, dataLimitMb: 2_097_151 });
  for (const value of [{ durationMinutes: 0 }, { durationMinutes: 44_641 }, { durationMinutes: 1.5 },
    { durationMinutes: 5, dataLimitMb: 0 }, { durationMinutes: 5, speedLimitKbps: 100_001 }]) assert.throws(() => validateAccessPackage(value));
  const value = order();
  assert.deepEqual(validateAccessOrder(value, now), value);
  for (const patch of [{ ipAddress: "10.20.0.1" }, { ipAddress: "10.30.0.1" }, { ipAddress: "10.30.0.255" },
    { routerId: "KM-LAB-002" }, { server: "other" }, { user: `ma-${randomUUID().replaceAll("-", "")}` },
    { password: "injection;$user" }, { macAddress: "FF:FF:FF:FF:FF:FF" }, { paymentId: undefined },
    { voucherId: randomUUID() }, { expiresAt: new Date(now).toISOString() },
    { expiresAt: new Date(now + 400_000).toISOString() }]) assert.throws(() => validateAccessOrder({ ...value, ...patch }, now));
  assert.throws(() => validateActiveResult({ ...session(value), ipAddress: "10.30.0.198" }, value));
});

test("Daemon config is scoped to enrolled Primary and never takes its treasury encryption key", () => {
  const env = { MESH_AUTOMATIC_AGENT_ENABLED: "true", MESH_ROUTER_SERVICE_KEY: "fixture-router-key-at-least-32-bytes",
    MIKROTIK_USERNAME: "fixture", MIKROTIK_PASSWORD: "fixture-secret" };
  const config = readDaemonConfig(env);
  assert.equal(config.cloudOrigin, "https://wifi.afribit.africa");
  assert.equal(config.routerId, "KM-LAB-001");
  assert.equal(config.joinBindHost, "10.20.0.10");
  assert.equal(config.mode, "active");
  assert.equal(config.joinTransport, "direct");
  assert.equal(readDaemonConfig({ ...env, MESH_JOIN_TRANSPORT: "trusted-tls-proxy", MESH_JOIN_BIND_HOST: "127.0.0.1" }).joinBindHost, "127.0.0.1");
  assert.equal(readDaemonConfig({ ...env, MESH_AGENT_MODE: "standby" }).mode, "standby");
  assert.equal(readDaemonConfig({ ...env, MESH_JOIN_BIND_HOST: "10.254.30.1", MESH_PYTHON: "/opt/mesh/venv/bin/python" }).joinBindHost, "10.254.30.1");
  for (const patch of [{ MESH_AUTOMATIC_AGENT_ENABLED: "false" }, { MESH_ROUTER_SERVICE_KEY: "short" },
    { MESH_ACCESS_ROUTER_ID: "KM-LAB-002" }, { MESH_CLOUD_URL: "http://untrusted.example" },
    { MESH_JOIN_BIND_HOST: "0.0.0.0" }, { MESH_JOIN_BIND_HOST: "127.0.0.1" },
    { MESH_JOIN_BIND_HOST: "10.254.30.2" }, { MESH_AGENT_MODE: "unknown" }, { MESH_JOIN_TRANSPORT: "unknown" },
    { MESH_JOIN_TRANSPORT: "trusted-tls-proxy" }, { MESH_JOIN_TRANSPORT: "trusted-tls-proxy", MESH_JOIN_BIND_HOST: "10.254.30.1" }]) assert.throws(() => readDaemonConfig({ ...env, ...patch }));
});

test("Agent cloud calls sign method, target, path and exact body; activation requires acknowledgment", async () => {
  const config = { cloudOrigin: "https://wifi.afribit.africa", routerId: "KM-LAB-001" as const,
    serviceKey: "fixture-router-key-at-least-32-bytes", server: "KM-MESH-001" as const, encryptionKey: Buffer.alloc(32).toString("base64") };
  const value = order(), job = { id: value.id, order: value, claimToken: "t".repeat(43) };
  let calls = 0;
  const client = new MeshCloudClient(config, async (url, init) => {
    calls++;
    assert.equal(init?.redirect, "error");
    const raw = String(init?.body);
    const request = new Request(String(url), init);
    assert.equal(verifyMeshAgent(request, raw, config), true);
    assert.equal(verifyMeshAgent(request, raw + " ", config), false);
    if (String(url).endsWith("/claim")) return Response.json({ jobs: [job] });
    if (String(url).endsWith("/context")) return Response.json({ joinUrl: "https://wifi.afribit.africa/api/mesh/join?ticket=fixture" });
    assert.deepEqual(JSON.parse(raw), { claimToken: job.claimToken, ...session(value) });
    return Response.json({ activated: true });
  });
  assert.equal((await client.claim())[0].id, value.id);
  await client.createContext({ macAddress: value.macAddress, ipAddress: value.ipAddress, server: value.server });
  await client.complete(job, session(value));
  assert.equal(calls, 3);
  const rejected = new MeshCloudClient(config, async () => Response.json({ activated: false }));
  await assert.rejects(rejected.complete(job, session(value)));
  const redirect = new MeshCloudClient(config, async () => Response.json({ joinUrl: "https://attacker.example/api/mesh/join" }));
  await assert.rejects(redirect.createContext({ macAddress: value.macAddress, ipAddress: value.ipAddress, server: value.server }));
});

test("A standby controller makes signed read-only checks and never claims jobs or attests customers", async () => {
  const config = { cloudOrigin: "https://wifi.afribit.africa", routerId: "KM-LAB-001" as const,
    serviceKey: "fixture-router-key-at-least-32-bytes", server: "KM-MESH-001" as const,
    encryptionKey: Buffer.alloc(32).toString("base64") };
  const targets: string[] = [];
  const client = new MeshCloudClient(config, async (url, init) => {
    const path = new URL(String(url)).pathname; targets.push(path);
    assert.equal(path, "/api/mesh/gateway/readiness");
    assert.equal(verifyMeshAgent(new Request(String(url), init), String(init?.body), config), true);
    return Response.json({ paystack: { accessReady: true } });
  });
  assert.deepEqual(await pollMeshCloud(client, "standby"), []);
  assert.deepEqual(targets, ["/api/mesh/gateway/readiness"]);
});

test("Ambiguous completion retries the same immutable account and never starts another allowance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mesh-automatic-agent-test-"));
  try {
    const value = order(), job = { id: value.id, order: value, claimToken: "t".repeat(43) };
    let clock = now, activations = 0, completions = 0;
    const deps = { ledgerDirectory: directory, now: () => clock,
      activate: async (received: AccessOrder) => { activations++; assert.deepEqual(received, value); return session(received); },
      complete: async () => { completions++; if (completions === 1) throw new Error("Ambiguous cloud timeout"); } };
    await assert.rejects(processAccessJob(job, deps));
    const retained = JSON.parse(await readFile(join(directory, `${value.id}.json`), "utf8"));
    assert.equal(retained.state, "active");
    assert.equal(JSON.stringify(retained).includes(value.password), false);
    clock += 10_000;
    await processAccessJob({ ...job, claimToken: "r".repeat(43) }, deps);
    assert.equal(activations, 2);
    assert.equal(completions, 2);
    assert.equal(JSON.parse(await readFile(join(directory, `${value.id}.json`), "utf8")).state, "acknowledged");
    await assert.rejects(processAccessJob({ ...job, order: { ...value, expiresAt: new Date(now + 301_000).toISOString() } }, deps), /conflicts/);
    await assert.rejects(processAccessJob({ ...job, order: { ...value, password: "q".repeat(43) } }, deps), /conflicts/);
    await assert.rejects(processAccessJob({ ...job, id: randomUUID() }, deps), /identity/);
    clock = now + 300_000;
    await assert.rejects(processAccessJob(job, deps), /expired/);
    assert.equal(activations, 2);
  } finally {
    const path = resolve(directory);
    if (dirname(path) !== resolve(tmpdir()) || !basename(path).startsWith("mesh-automatic-agent-test-")) throw new Error("Unsafe fixture cleanup target");
    await rm(path, { recursive: true, force: true });
  }
});

function fakeResponse() {
  const state = { status: 0, headers: {} as Record<string, string>, text: "" };
  const response = { setHeader: (key: string, value: string) => { state.headers[key] = value; },
    writeHead: (status: number, headers?: Record<string, string>) => { state.status = status; Object.assign(state.headers, headers); },
    end: (value?: string) => { state.text = value ?? ""; } } as unknown as ServerResponse;
  return { state, response };
}
test("Local join derives live host from socket peer, ignores spoofed headers/query and refuses mismatches", async () => {
  const value = order();
  let observed = "";
  const handler = createJoinHandler({ observe: async ip => { observed = ip; return { macAddress: value.macAddress, ipAddress: ip, server: value.server }; },
    createContext: async host => { assert.equal(host.ipAddress, "10.30.0.197"); return { joinUrl: "https://wifi.afribit.africa/api/mesh/join?ticket=fixture" }; } });
  const request = { method: "GET", url: "/start?ip=10.30.0.198", socket: { remoteAddress: "::ffff:10.30.0.197" },
    headers: { "x-forwarded-for": "10.30.0.198" } } as unknown as IncomingMessage;
  const first = fakeResponse();
  await handler(request, first.response);
  assert.equal(observed, "10.30.0.197"); assert.equal(first.state.status, 302);
  assert.equal(first.state.headers["Referrer-Policy"], "no-referrer");
  const retry = fakeResponse(); await handler(request, retry.response); assert.equal(retry.state.status, 429);
  const management = fakeResponse();
  await handler({ ...request, socket: { remoteAddress: "10.20.0.10" } } as unknown as IncomingMessage, management.response);
  assert.equal(management.state.status, 403);
  const mismatch = createJoinHandler({ observe: async () => ({ macAddress: value.macAddress, ipAddress: "10.30.0.198", server: value.server }),
    createContext: async () => { throw new Error("Must not receive mismatched host"); } });
  const denied = fakeResponse(); await mismatch(request, denied.response); assert.equal(denied.state.status, 503);
});

test("HTTPS join trusts only the configured loopback TLS proxy and rejects direct clients and malformed peer headers", async () => {
  const value = order(), observed: string[] = [];
  const handler = createJoinHandler({ transport: "trusted-tls-proxy",
    observe: async ip => { observed.push(ip); return { macAddress: value.macAddress, ipAddress: ip, server: value.server }; },
    createContext: async () => ({ joinUrl: "https://wifi.afribit.africa/api/mesh/join?ticket=fixture" }) });
  const request = { method: "GET", url: "/start?view=internet&ip=10.30.0.198", socket: { remoteAddress: "127.0.0.1" },
    headers: { "x-mesh-client-ip": "10.30.0.197", "x-mesh-proxy-tls": "1", "x-forwarded-for": "10.30.0.198" } } as unknown as IncomingMessage;
  for (const patch of [
    { socket: { remoteAddress: "10.30.0.197" } }, { socket: { remoteAddress: "10.254.30.2" } },
    { socket: { remoteAddress: "::1" } }, { headers: { ...request.headers, "x-mesh-proxy-tls": "0" } },
    { headers: { ...request.headers, "x-mesh-proxy-tls": undefined } },
    ...[undefined, ["10.30.0.197"], "10.30.0.197, 10.30.0.198", "10.30.0.0197", "10.20.0.10", "10.30.0.1", "10.30.0.255", " 10.30.0.197 ", "::ffff:10.30.0.197"].map(ip => ({ headers: { ...request.headers, "x-mesh-client-ip": ip } })),
  ]) {
    const denied = fakeResponse(); await handler({ ...request, ...patch } as IncomingMessage, denied.response);
    assert.equal(denied.state.status, 403); assert.equal(denied.state.headers.Location, undefined);
  }
  assert.deepEqual(observed, []);
  const response = fakeResponse(); await handler(request, response.response);
  assert.equal(response.state.status, 302); assert.deepEqual(observed, ["10.30.0.197"]);
  assert.equal(new URL(response.state.headers.Location).searchParams.get("view"), "internet");
  assert.equal(response.state.headers["Cache-Control"], "private, no-store");
  assert.equal(response.state.headers["Referrer-Policy"], "no-referrer");
});
