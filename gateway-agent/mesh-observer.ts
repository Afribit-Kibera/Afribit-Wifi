import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";
import { z } from "zod";
import { customerIpSchema, observedHostSchema, type ObservedHost } from "../lib/mesh-access/model";
import { readRouterIdentity } from "./mesh-router-identity";
import { routerStatsSchema, type RouterStats } from "../lib/mesh-access/telemetry-schema";

const replySchema = z.object({ id: z.string().uuid(), host: observedHostSchema.optional(), stats: routerStatsSchema.optional(),
  error: z.string().max(100).optional() }).strict();
type Reply = { host?: ObservedHost; stats?: RouterStats };
type Config = { python: string; routerUsername: string; routerPassword: string };

// Reuse only the authenticated transport. Never reuse a MAC/IP observation.
// Opening SSH to the gateway costs ~1.7s on its CPU, so once warmed the
// transport is re-opened in the background whenever it drops; a customer
// waiting on /start should never pay for the reconnect.
export function createLiveObserver(config: Config, startWorker: () => ChildProcessWithoutNullStreams = () =>
  spawn(config.python, [resolve("gateway-agent/mesh-observer.py")], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }),
  options: { rewarmMs?: number; maxRewarmMs?: number } = {}) {
  let worker: ChildProcessWithoutNullStreams | null = null;
  let ready: Promise<void> | null = null;
  let closed = false;
  let keepWarm = false;
  const baseDelay = options.rewarmMs ?? 2_000, maxDelay = options.maxRewarmMs ?? 60_000;
  let rewarmDelay = baseDelay;
  let rewarmTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleRewarm() {
    if (!keepWarm || closed || rewarmTimer) return;
    rewarmTimer = setTimeout(() => {
      rewarmTimer = null;
      if (closed) return;
      // Back off while the gateway is unreachable; reset once it answers.
      start().then(() => { rewarmDelay = baseDelay; }, () => { rewarmDelay = Math.min(rewarmDelay * 2, maxDelay); });
    }, rewarmDelay);
    rewarmTimer.unref?.();
  }
  const pending = new Map<string, { accept: (reply: Reply) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  function start() {
    if (closed) throw new Error("Mesh observer is closed");
    if (ready) return ready;
    const child = startWorker(); worker = child;
    ready = new Promise<void>((acceptReady, rejectReady) => {
      let text = "", isReady = false, stopped = false;
      const startup = setTimeout(() => fail(), 15_000);
      function fail() {
        if (stopped) return;
        stopped = true; clearTimeout(startup);
        if (worker === child) { worker = null; ready = null; }
        const error = new Error("Pinned Mesh router observation unavailable");
        rejectReady(error);
        for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); }
        pending.clear(); child.kill();
        scheduleRewarm();
      }
      child.on("error", fail); child.on("close", fail); child.stdin.on("error", fail);
      child.stderr.resume();
      child.stdout.on("data", data => {
        text += data;
        if (Buffer.byteLength(text) > 65_536) { fail(); return; }
        while (text.includes("\n") && !stopped) {
          const i = text.indexOf("\n"), line = text.slice(0, i); text = text.slice(i + 1);
          try {
            const value = JSON.parse(line);
            if (!isReady) {
              z.object({ ready: z.literal(true) }).strict().parse(value);
              isReady = true; clearTimeout(startup); acceptReady(); continue;
            }
            const reply = replySchema.parse(value), item = pending.get(reply.id);
            if (!item || [reply.host, reply.stats, reply.error].filter(Boolean).length !== 1) throw new Error();
            pending.delete(reply.id); clearTimeout(item.timer);
            if (reply.host || reply.stats) item.accept({ host: reply.host, stats: reply.stats });
            else item.reject(new Error("Pinned Mesh router observation unconfirmed"));
          } catch { fail(); }
        }
      });
      const router = readRouterIdentity();
      child.stdin.write(JSON.stringify({ host: router.host, fingerprint: router.fingerprint,
        username: config.routerUsername, password: config.routerPassword }) + "\n");
    });
    void ready.catch(() => {}); // A warm-up failure is retried by the next request.
    return ready;
  }
  async function ask(message: Record<string, string>, slots: number) {
    await start();
    if (!worker || pending.size >= slots) throw new Error("Mesh router observer is busy");
    const child = worker, id = randomUUID();
    return new Promise<Reply>((accept, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error("Mesh observation timed out")); }, 25_000);
      pending.set(id, { accept, reject, timer });
      child.stdin.write(JSON.stringify({ id, ...message }) + "\n");
    });
  }
  return {
    warm: () => { keepWarm = true; void start().catch(() => {}); },
    async observe(value: string) {
      const ip = customerIpSchema.parse(value);
      const { host } = await ask({ ipAddress: ip }, 2);
      if (!host || host.ipAddress !== ip) throw new Error("Mesh observed host mismatch");
      return host;
    },
    // Health snapshot; never queues behind a waiting customer.
    async stats() {
      const { stats } = await ask({ action: "stats" }, 1);
      if (!stats) throw new Error("Mesh router stats unconfirmed");
      return stats;
    },
    close() { closed = true; if (rewarmTimer) clearTimeout(rewarmTimer); rewarmTimer = null; worker?.kill(); },
  };
}
