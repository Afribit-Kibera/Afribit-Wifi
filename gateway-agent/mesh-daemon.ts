import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { meshAgentHeaders } from "../lib/mesh-access/security";
import { createLiveObserver } from "./mesh-observer";
import { performance } from "node:perf_hooks";
import { observedHostSchema, customerIpSchema, validateAccessOrder, validateActiveResult,
  type ActiveResult, type NativeAccessOrderV2, type ObservedHost } from "../lib/mesh-access/model";

type DaemonConfig = {
  cloudOrigin: string; routerId: "KM-LAB-001"; serviceKey: string;
  routerUsername: string; routerPassword: string; python: string; ledgerDirectory: string;
  joinBindHost: "10.20.0.10" | "10.254.30.1" | "127.0.0.1";
  joinTransport: "direct" | "trusted-tls-proxy";
  mode: "active" | "standby";
};
const cloudOrigin = "https://wifi.afribit.africa";
const routerHost = "10.20.0.1";
const routerFingerprint = "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ";
const uuid = z.string().uuid().refine(value => value === value.toLowerCase());
const jobSchema = z.object({ id: uuid, claimToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/), order: z.unknown() }).strict();
export type AccessJob = z.infer<typeof jobSchema>;

export function readDaemonConfig(env: Record<string, string | undefined> = process.env): DaemonConfig {
  const joinTransport = env.MESH_JOIN_TRANSPORT ?? "direct";
  const joinBindHost = env.MESH_JOIN_BIND_HOST ?? "10.20.0.10";
  if (env.MESH_AUTOMATIC_AGENT_ENABLED !== "true" ||
      (env.MESH_ACCESS_ROUTER_ID && env.MESH_ACCESS_ROUTER_ID !== "KM-LAB-001") ||
      (env.MESH_CLOUD_URL && env.MESH_CLOUD_URL !== cloudOrigin) ||
      !env.MESH_ROUTER_SERVICE_KEY || Buffer.byteLength(env.MESH_ROUTER_SERVICE_KEY) < 32 ||
      !env.MIKROTIK_USERNAME || !env.MIKROTIK_PASSWORD ||
      !["direct", "trusted-tls-proxy"].includes(joinTransport) ||
      (joinTransport === "trusted-tls-proxy" ? joinBindHost !== "127.0.0.1" : !["10.20.0.10", "10.254.30.1"].includes(joinBindHost)) ||
      (env.MESH_AGENT_MODE && !["active", "standby"].includes(env.MESH_AGENT_MODE))) throw new Error("Mesh automatic agent is not configured");
  return { cloudOrigin, routerId: "KM-LAB-001", serviceKey: env.MESH_ROUTER_SERVICE_KEY,
    routerUsername: env.MIKROTIK_USERNAME, routerPassword: env.MIKROTIK_PASSWORD,
    python: env.MESH_PYTHON ?? (process.platform === "win32" ? "py" : "python3"),
    ledgerDirectory: resolve(env.MESH_AGENT_LEDGER_DIRECTORY ?? "artifacts/mesh-lab/private/automatic-access"),
    joinBindHost: joinBindHost as DaemonConfig["joinBindHost"],
    joinTransport: joinTransport as DaemonConfig["joinTransport"],
    mode: (env.MESH_AGENT_MODE ?? "active") as DaemonConfig["mode"] };
}

export class MeshCloudClient {
  constructor(readonly config: Pick<DaemonConfig, "cloudOrigin" | "routerId" | "serviceKey">,
    private readonly fetcher: typeof fetch = fetch) {}
  private async post(path: string, value: unknown) {
    const body = JSON.stringify(value);
    let response: Response;
    try {
      response = await this.fetcher(this.config.cloudOrigin + path, { method: "POST", body,
        headers: meshAgentHeaders(this.config, path, body), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(90_000) });
      if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 262_144) throw new Error();
      const raw = await response.text();
      if (Buffer.byteLength(raw) > 262_144) throw new Error();
      return JSON.parse(raw) as unknown;
    } catch { throw new Error("Mesh cloud operation unconfirmed"); }
  }
  async createContext(host: ObservedHost) {
    const result = z.object({ joinUrl: z.string().url() }).strict().parse(await this.post("/api/mesh/gateway/context", host));
    const redirect = new URL(result.joinUrl);
    if (redirect.origin !== this.config.cloudOrigin || redirect.pathname !== "/api/mesh/join" || redirect.username || redirect.password) throw new Error("Invalid Mesh join destination");
    return result;
  }
  async claim() {
    return z.object({ jobs: z.array(jobSchema).max(5) }).strict().parse(await this.post("/api/mesh/gateway/jobs/claim", {})).jobs;
  }
  async readiness() {
    return z.object({ paystack: z.object({ accessReady: z.boolean() }).passthrough() }).passthrough()
      .parse(await this.post("/api/mesh/gateway/readiness", {}));
  }
  async complete(job: AccessJob, active: ActiveResult) {
    const result = await this.post(`/api/mesh/gateway/jobs/${job.id}/complete`, { claimToken: job.claimToken, ...active });
    // Only an explicit acknowledgment closes the local handoff. A timeout or
    // rejected lease leaves the same account and original deadline intact.
    const acknowledged = z.object({ activated: z.literal(true) }).passthrough().safeParse(result);
    if (!acknowledged.success) throw new Error("Mesh activation acknowledgment unconfirmed");
  }
}

export async function pollMeshCloud(client: MeshCloudClient, mode: DaemonConfig["mode"]) {
  if (mode === "standby") { await client.readiness(); return []; }
  return client.claim();
}

export function createPinnedRouter(config: DaemonConfig) {
  const observer = createLiveObserver(config);
  if (config.mode === "active") observer.warm();
  const execute = async (operation: { action: "inspect"; ipAddress: string } | { action: "provision"; order: NativeAccessOrderV2 }) => {
    return new Promise<unknown>((accept, reject) => {
      const child = spawn(config.python, [resolve("gateway-agent/mesh-router.py")], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
      let output = "", settled = false;
      const finish = (error?: Error, value?: unknown) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (error) reject(error); else accept(value);
      };
      const timer = setTimeout(() => { child.kill(); finish(new Error("Mesh router operation unconfirmed")); }, 45_000);
      child.stdout.on("data", data => {
        output += data;
        if (Buffer.byteLength(output) > 16_384) { child.kill(); finish(new Error("Invalid Mesh router response")); }
      });
      child.stderr.resume(); // Never echo raw RouterOS/library errors or secrets.
      child.on("error", () => finish(new Error("Mesh router helper could not start")));
      child.on("close", code => {
        try {
          if (code !== 0) throw new Error();
          finish(undefined, JSON.parse(output));
        } catch { finish(new Error("Pinned Mesh router operation failed")); }
      });
      child.stdin.on("error", () => finish(new Error("Mesh router request unconfirmed")));
      // Credentials never enter command-line arguments, files, stdout or logs.
      child.stdin.end(JSON.stringify({ ...operation, host: routerHost, username: config.routerUsername,
        password: config.routerPassword, fingerprint: routerFingerprint }));
    });
  };
  return {
    observe: observer.observe,
    activate: async (order: NativeAccessOrderV2) => validateActiveResult(await execute({ action: "provision", order }), order),
    close: observer.close,
  };
}

type LedgerRecord = { id: string; digest: string; expiresAt: string; state: "reserved" | "active" | "acknowledged" };
async function durableWrite(path: string, record: LedgerRecord, exclusive = false) {
  const temporary = exclusive ? path : `${path}.${randomUUID()}.next`;
  const handle = await open(temporary, "wx", 0o600);
  try { await handle.writeFile(JSON.stringify(record) + "\n"); await handle.sync(); } finally { await handle.close(); }
  if (!exclusive) await rename(temporary, path);
}

export async function processAccessJob(jobValue: unknown, deps: {
  ledgerDirectory: string; now: () => number;
  activate: (order: NativeAccessOrderV2) => Promise<unknown>;
  complete: (job: AccessJob, active: ActiveResult) => Promise<void>;
}) {
  const job = jobSchema.parse(jobValue);
  const order = validateAccessOrder(job.order, deps.now());
  if (job.id !== order.id) throw new Error("Mesh job/order identity mismatch");
  const digest = createHash("sha256").update(JSON.stringify(order)).digest("hex");
  await mkdir(deps.ledgerDirectory, { recursive: true, mode: 0o700 });
  const path = join(deps.ledgerDirectory, `${order.id}.json`), lockPath = `${path}.lock`;
  let lock;
  try { lock = await open(lockPath, "wx", 0o600); }
  catch { throw new Error("Mesh order is locked; review interrupted handoff before recovery"); }
  try {
    let previous: LedgerRecord | null = null;
    try { previous = JSON.parse(await readFile(path, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Mesh order ledger requires review"); }
    if (previous && (previous.id !== order.id || previous.digest !== digest || previous.expiresAt !== order.expiresAt)) throw new Error("Mesh order conflicts with retained allowance");
    const record: LedgerRecord = { id: order.id, digest, expiresAt: order.expiresAt, state: "reserved" };
    if (!previous) await durableWrite(path, record, true);
    // The helper verifies a live matching session even on a retained order.
    // It cannot reset counters, change credentials or extend this deadline.
    const active = validateActiveResult(await deps.activate(order), order);
    if (Date.parse(order.expiresAt) <= deps.now()) throw new Error("Mesh deadline elapsed before acknowledgment");
    await durableWrite(path, { ...record, state: "active" });
    await deps.complete(job, active);
    await durableWrite(path, { ...record, state: "acknowledged" });
    return { id: order.id, active: true, expiresAt: order.expiresAt };
  } finally { await lock.close(); await unlink(lockPath); }
}

function peerAddress(request: IncomingMessage, transport: DaemonConfig["joinTransport"]) {
  const address = request.socket.remoteAddress ?? "";
  if (transport === "trusted-tls-proxy") {
    // Only the explicitly configured local TLS terminator may attest a peer.
    // Caddy must overwrite these headers from its real socket remote_ip and
    // restrict /start to WireGuard-preserved guest sources. No XFF trust.
    if (!["127.0.0.1", "::ffff:127.0.0.1"].includes(address) ||
        request.headers["x-mesh-proxy-tls"] !== "1" ||
        typeof request.headers["x-mesh-client-ip"] !== "string") throw new Error("Untrusted Mesh join proxy");
    return customerIpSchema.parse(request.headers["x-mesh-client-ip"]);
  }
  return customerIpSchema.parse(address.startsWith("::ffff:") ? address.slice(7) : address);
}
export function createJoinHandler(deps: {
  observe: (ipAddress: string) => Promise<ObservedHost>;
  createContext: (host: ObservedHost) => Promise<{ joinUrl: string }>;
  transport?: DaemonConfig["joinTransport"];
}) {
  const busy = new Set<string>(), last = new Map<string, number>();
  return async (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    if (request.method !== "GET" || request.url?.split("?")[0] !== "/start") {
      response.writeHead(404); response.end("Mesh connection not found"); return;
    }
    let ip: string;
    try { ip = peerAddress(request, deps.transport ?? "direct"); }
    catch { response.writeHead(403); response.end("Join Mesh Wi-Fi to continue"); return; }
    if (busy.size >= 2 || busy.has(ip) || (last.get(ip) ?? 0) > Date.now() - 5000) {
      response.setHeader("Retry-After", "5"); response.writeHead(429); response.end("Please wait a moment and retry"); return;
    }
    busy.add(ip); last.set(ip, Date.now());
    try {
      const started = performance.now();
      const host = observedHostSchema.parse(await deps.observe(ip));
      const observed = performance.now();
      if (host.ipAddress !== ip) throw new Error("Observed host mismatch");
      const { joinUrl } = await deps.createContext(host);
      const contextReady = performance.now();
      response.setHeader("Server-Timing", `router;dur=${(observed-started).toFixed(0)}, context;dur=${(contextReady-observed).toFixed(0)}`);
      // Timings only: no device, ticket, cookie or request URL in logs.
      console.info(JSON.stringify({service:"mesh-join",routerMs:Math.round(observed-started),contextMs:Math.round(contextReady-observed)}));
      const redirect = new URL(joinUrl);
      if (redirect.origin !== cloudOrigin || redirect.pathname !== "/api/mesh/join") throw new Error("Invalid Mesh join URL");
      const view = new URL(request.url ?? "/start", "http://mesh.local").searchParams.get("view");
      if (view === "internet" || view === "voucher") redirect.searchParams.set("view", view);
      response.writeHead(302, { Location: redirect.toString() }); response.end();
    } catch { response.writeHead(503); response.end("We could not confirm your Mesh connection. Please try again."); }
    finally { busy.delete(ip); }
  };
}

export async function runMeshDaemon(config = readDaemonConfig()) {
  const cloud = new MeshCloudClient(config), router = createPinnedRouter(config);
  let stopping = false;
  const joinHandler = createJoinHandler({ observe: router.observe, createContext: host => cloud.createContext(host), transport: config.joinTransport });
  const server = createServer((request, response) => {
    if (config.mode === "standby") {
      response.writeHead(503, { "Cache-Control": "no-store", "Content-Type": "text/plain" });
      response.end("Mesh controller is being commissioned. Please try again later."); return;
    }
    void joinHandler(request, response);
  });
  server.requestTimeout = 100_000; server.headersTimeout = 10_000; server.maxRequestsPerSocket = 10;
  try {
    await new Promise<void>((accept, reject) => { server.once("error", reject); server.listen(8040, config.joinBindHost, accept); });
  } catch (error) { router.close(); throw error; }
  let lastCloudContact = 0;
  const health = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json");
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404); response.end(JSON.stringify({ error: "Not found" })); return;
    }
    const cloudConnected = lastCloudContact > Date.now() - 90_000;
    response.writeHead(cloudConnected && !stopping ? 200 : 503);
    // Liveness/cloud polling only: no claim that a customer is authorized or
    // that a working router tunnel, wallet liquidity or WAN has been verified.
    response.end(JSON.stringify({ service: "mesh-controller", running: !stopping, cloudConnected, mode: config.mode }));
  });
  try {
    await new Promise<void>((accept, reject) => { health.once("error", reject); health.listen(8041, "127.0.0.1", accept); });
  } catch (error) { server.close(); router.close(); throw error; }
  const stop = () => { stopping = true; server.close(); health.close(); router.close(); };
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  console.log(JSON.stringify({ service: "mesh-automatic-access", routerId: config.routerId, status: "running" }));
  try {
    while (!stopping) {
      try {
        const jobs = await pollMeshCloud(cloud, config.mode);
        lastCloudContact = Date.now();
        for (const job of jobs) {
          if (stopping) break;
          try {
            const result = await processAccessJob(job, { ledgerDirectory: config.ledgerDirectory, now: Date.now,
              activate: router.activate, complete: (claimed, active) => cloud.complete(claimed, active) });
            console.log(JSON.stringify({ service: "mesh-automatic-access", ...result }));
          } catch { console.error(JSON.stringify({ service: "mesh-automatic-access", id: job.id, status: "handoff_unconfirmed" })); }
        }
      } catch { console.error(JSON.stringify({ service: "mesh-automatic-access", status: "cloud_unavailable" })); }
      await new Promise(accept => setTimeout(accept, config.mode === "standby" ? 15_000 : 2000));
    }
  } finally { server.close(); health.close(); router.close(); process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop); }
}

if (process.argv[1] && /(?:^|[\\/])mesh-daemon\.(?:ts|js)$/.test(process.argv[1])) {
  runMeshDaemon().catch(() => { console.error("Mesh automatic agent could not start; check private configuration"); process.exitCode = 1; });
}
