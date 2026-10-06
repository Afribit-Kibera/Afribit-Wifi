import assert from "node:assert/strict";
import { test } from "node:test";

test("Passkey POST routes bound trusted-origin bodies before database or cookie challenge work", async () => {
  const saved = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture", WEBAUTHN_ORIGINS: "https://fixture.invalid" });
  const { db } = await import("../lib/db"), original = db.select;
  Reflect.set(db, "select", () => { throw new Error("Oversized body reached the database"); });
  try {
    const handlers = [
      { handler: (await import("../app/api/admin/passkeys/registration/options/route")).POST, limit: 4096 },
      { handler: (await import("../app/api/admin/passkeys/registration/verify/route")).POST, limit: 64000 },
      { handler: (await import("../app/api/admin/passkeys/authentication/verify/route")).POST, limit: 64000 },
    ];
    for (const { handler, limit } of handlers) {
      for (const declared of [false, true]) {
        let cancelled = false, chunks = 0;
        const body = new ReadableStream<Uint8Array>({ pull(controller) {
          chunks++; controller.enqueue(new Uint8Array(Math.ceil(limit / 2) + 1));
        }, cancel() { cancelled = true; } });
        const result = await handler(new Request("https://fixture.invalid/", { method: "POST", body,
          headers: { Origin: "https://fixture.invalid", ...(declared ? { "Content-Length": String(limit + 1) } : {}) },
          duplex: "half" } as RequestInit & { duplex: "half" }));
        assert.equal(result.status, 413);
        assert.equal(cancelled, true);
        assert(chunks <= 3);
      }
      assert.equal((await handler(new Request("https://fixture.invalid/", { method: "POST", body: "{", headers: { Origin: "https://fixture.invalid" } }))).status, 400);
    }
  } finally {
    Reflect.set(db, "select", original);
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
