import assert from "node:assert/strict";
import { test } from "node:test";

test("An authorized legacy controller cannot claim bypass work while native Mesh is enabled", async () => {
  const saved = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture",
    GATEWAY_AGENT_TOKEN: "legacy-isolation-fixture", MESH_AUTOMATIC_ACCESS_ENABLED: "true" });
  const { db } = await import("../lib/db");
  const oldSelect = db.select;
  Reflect.set(db, "select", () => { throw new Error("Legacy isolation must precede database work"); });
  const { POST } = await import("../app/api/gateway/jobs/claim/route");
  try {
    const request = (authorized: boolean) => new Request("https://mesh.fixture/api/gateway/jobs/claim", {
      method: "POST", headers: authorized ? { Authorization: "Bearer legacy-isolation-fixture" } : {},
    });
    assert.equal((await POST(request(false))).status, 401);
    const blocked = await POST(request(true));
    assert.equal(blocked.status, 409);
    assert.equal(blocked.headers.get("cache-control"), "no-store");
    process.env.MESH_AUTOMATIC_ACCESS_ENABLED = "false";
    await assert.rejects(POST(request(true)), /Legacy isolation must precede database work/,
      "Independent legacy installations retain their existing path");
  } finally {
    Reflect.set(db, "select", oldSelect);
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
