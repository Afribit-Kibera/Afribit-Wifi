import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

test("Public webhooks bound unsigned streams before database/provider effects and preserve signed bytes", async () => {
  const saved = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgresql://fixture:fixture@unused.invalid/fixture",
    BITIKA_WEBHOOK_SECRET: "bitika-fixture-secret", BTCPAY_WEBHOOK_SECRET: "btcpay-fixture-secret" });
  const { db } = await import("../lib/db");
  const oldSelect = db.select, oldUpdate = db.update, originalFetch = globalThis.fetch;
  const forbidden = () => { throw new Error("No database/provider effects allowed in webhook boundary fixtures"); };
  Reflect.set(db, "select", forbidden);
  Reflect.set(db, "update", forbidden);
  globalThis.fetch = forbidden;
  const { POST: bitika } = await import("../app/api/webhooks/bitika/route");
  const { POST: btcpay } = await import("../app/api/webhooks/btcpay/route");
  try {
    for (const handler of [bitika, btcpay]) {
      for (const length of [undefined, "1", "64001"]) {
        let cancelled = false;
        let pulls = 0;
        const body = new ReadableStream<Uint8Array>({ pull(controller) {
          pulls++;
          controller.enqueue(new Uint8Array(32_001));
        }, cancel() { cancelled = true; } });
        const request = new Request("https://fixture.invalid/api/webhooks/fixture", {
          method: "POST", body, headers: length ? { "Content-Length": length } : {}, duplex: "half",
        } as RequestInit & { duplex: "half" });
        assert.equal((await handler(request)).status, 413);
        assert.equal(cancelled, true);
        assert.ok(pulls <= 3, "The infinite fixture stream must stop near the limit");
      }
      assert.equal((await handler(new Request("https://fixture.invalid/", {
        method: "POST", body: new Uint8Array([255]),
      }))).status, 400);
      assert.equal((await handler(new Request("https://fixture.invalid/", { method: "POST", body: "{}" }))).status, 401);
    }
    const time = Math.floor(Date.now() / 1000);
    // Signed sandbox / ignored events need no database/provider access. Include
    // UTF-8 and whitespace to catch reserialization before signature checking.
    const rawBitika = '{\n "id":"fixture", "event":"transaction.updated", "data":{"transaction_code":"SBX-fixture"}, "note":"🍊"\n}';
    const bitikaSignature = createHmac("sha256", process.env.BITIKA_WEBHOOK_SECRET!).update(`${time}.${rawBitika}`).digest("hex");
    assert.equal((await bitika(new Request("https://fixture.invalid/", { method: "POST", body: rawBitika,
      headers: { "x-bitika-signature": `t=${time},v1=${bitikaSignature}` } }))).status, 200);
    const rawBtcpay = '{\n "note":"🍊"\n}';
    const signedBtcpay = (body: string) => new Request("https://fixture.invalid/", { method: "POST", body,
      headers: { "btcpay-sig": `sha256=${createHmac("sha256", process.env.BTCPAY_WEBHOOK_SECRET!).update(body).digest("hex")}` } });
    assert.equal((await btcpay(signedBtcpay(rawBtcpay))).status, 200);
    assert.equal((await btcpay(signedBtcpay("{"))).status, 400);
    assert.equal((await btcpay(signedBtcpay('{"invoiceId":{"unexpected":"object"}}'))).status, 400);
  } finally {
    Reflect.set(db, "select", oldSelect); Reflect.set(db, "update", oldUpdate); globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
