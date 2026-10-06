import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { POST } from "../app/api/mesh/gateway/readiness/route";
import { readMeshAccessConfig } from "../lib/mesh-access/config";
import { meshAgentHeaders } from "../lib/mesh-access/security";

test("Gateway checkout readiness requires scoped authentication and never contacts payment providers", async () => {
  const env = { ...process.env }, fetcher = globalThis.fetch;
  Object.assign(process.env, {
    DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture",
    MESH_AUTOMATIC_ACCESS_ENABLED: "true", MESH_NATIVE_ACCESS_COMMISSIONED: "true",
    MESH_ROUTER_SERVICE_KEY: "readiness-router-fixture-key-at-least-32-bytes",
    MESH_ACCESS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"), MESH_ACCESS_ROUTER_ID: "KM-LAB-001",
    PAYSTACK_MODE: "live", PAYSTACK_SECRET_KEY: "sk_live_readiness_fixture", PAYSTACK_ENABLED: "true",
    PAYSTACK_RECEIPT_EMAIL: "fixture@example.org", BLINK_SETTLEMENT_ENABLED: "true",
    INSATS_ENGINE_URL: "https://engine.insats.org", INSATS_MESH_SERVICE_KEY: "readiness-engine-fixture-key-at-least-32-bytes",
    MESH_LIGHTNING_ADDRESS: "fixture@blink.sv",
  });
  const pg = await PGlite.create();
  await pg.exec(await readFile("scripts/mesh/agent-replay-schema.sql", "utf8"));
  const { db } = await import("../lib/db"), execute = db.execute, memory = drizzle(pg);
  Reflect.set(db, "execute", memory.execute.bind(memory));
  globalThis.fetch = async () => { throw new Error("Readiness must not call providers or move funds"); };
  const path = "/api/mesh/gateway/readiness", body = "{}";
  const request = (headers?: HeadersInit) => new Request(`https://mesh.fixture${path}`, { method: "POST", body, headers });
  try {
    assert.equal((await POST(request())).status, 403);
    const signed = meshAgentHeaders(readMeshAccessConfig(), path, body);
    assert.equal((await POST(request({ ...signed, "x-mesh-auth": "00".repeat(32) }))).status, 403);
    const result = await POST(request(signed));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.deepEqual(await result.json(), { preferredProvider: "paystack", bitika: {
      configured: false, mode: null, webhookConfigured: false, enabled: false, checkoutReady: false,
    }, paystack: {
      configured: true, receiptEmailConfigured: true, enabled: true, settlementReady: true,
      accessReady: true, checkoutReady: true, blocker: null,
    } });
    process.env.PAYSTACK_ENABLED = "false";
    const blocked = await POST(request(meshAgentHeaders(readMeshAccessConfig(), path, body)));
    const payload = await blocked.json();
    assert.equal(payload.paystack.checkoutReady, false);
    assert.equal(payload.paystack.blocker, "payment_provider_not_configured");
    assert(!JSON.stringify(payload).includes("sk_live"));
    assert(!JSON.stringify(payload).includes("fixture@example.org"));
    Object.assign(process.env, { BITIKA_MODE: "live", BITIKA_API_KEY: "bk_live_readiness_fixture",
      BITIKA_LIGHTNING_ADDRESS: "merchant@blink.sv", BITIKA_WEBHOOK_SECRET: "fixture-webhook", BITIKA_ENABLED: "true" });
    const primary = await (await POST(request(meshAgentHeaders(readMeshAccessConfig(), path, body)))).json();
    assert.equal(primary.preferredProvider, "bitika");
    assert.equal(primary.bitika.checkoutReady, true);
    assert(!JSON.stringify(primary).includes("bk_live"));
  } finally {
    Reflect.set(db, "execute", execute);
    await pg.close();
    globalThis.fetch = fetcher;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
