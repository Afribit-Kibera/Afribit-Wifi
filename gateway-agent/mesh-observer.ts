import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";
import { z } from "zod";
import { customerIpSchema, observedHostSchema, type ObservedHost } from "../lib/mesh-access/model";

const replySchema = z.object({ id: z.string().uuid(), host: observedHostSchema.optional(), error: z.string().max(100).optional() }).strict();
type Config = { python: string; routerUsername: string; routerPassword: string };

// Reuse only the authenticated transport. Never reuse a MAC/IP observation.
export function createLiveObserver(config: Config, startWorker: () => ChildProcessWithoutNullStreams = () =>
  spawn(config.python, [resolve("gateway-agent/mesh-observer.py")], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] })) {
  let worker: ChildProcessWithoutNullStreams | null = null;
  let ready: Promise<void> | null = null;
  let closed = false;
  const pending = new Map<string, { accept: (host: ObservedHost) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
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
      }
      child.on("error", fail); child.on("close", fail); child.stdin.on("error", fail);
      child.stderr.resume();
      child.stdout.on("data", data => {
        text += data;
        if (Buffer.byteLength(text) > 16_384) { fail(); return; }
        while (text.includes("\n") && !stopped) {
          const i = text.indexOf("\n"), line = text.slice(0, i); text = text.slice(i + 1);
          try {
            const value = JSON.parse(line);
            if (!isReady) {
              z.object({ ready: z.literal(true) }).strict().parse(value);
              isReady = true; clearTimeout(startup); acceptReady(); continue;
            }
            const reply = replySchema.parse(value), item = pending.get(reply.id);
            if (!item || Boolean(reply.host) === Boolean(reply.error)) throw new Error();
            pending.delete(reply.id); clearTimeout(item.timer);
            if (reply.host) item.accept(reply.host);
            else item.reject(new Error("Pinned Mesh router observation unconfirmed"));
          } catch { fail(); }
        }
      });
      child.stdin.write(JSON.stringify({ host: "10.20.0.1", fingerprint: "SHA256:oyCgA93qwim6JGTa055M/07J5wvjACh0LMnrhY7DUxQ",
        username: config.routerUsername, password: config.routerPassword }) + "\n");
    });
    void ready.catch(() => {}); // A warm-up failure is retried by the next request.
    return ready;
  }
  return {
    warm: () => { void start().catch(() => {}); },
    async observe(value: string) {
      const ip = customerIpSchema.parse(value);
      await start();
      if (!worker || pending.size >= 2) throw new Error("Mesh router observer is busy");
      const child = worker, id = randomUUID();
      const host = await new Promise<ObservedHost>((accept, reject) => {
        const timer = setTimeout(() => { child.kill(); reject(new Error("Mesh observation timed out")); }, 25_000);
        pending.set(id, { accept, reject, timer });
        child.stdin.write(JSON.stringify({ id, ipAddress: ip }) + "\n");
      });
      if (host.ipAddress !== ip) throw new Error("Mesh observed host mismatch");
      return host;
    },
    close() { closed = true; worker?.kill(); },
  };
}
