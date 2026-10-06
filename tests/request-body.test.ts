import assert from "node:assert/strict";
import { test } from "node:test";
import { readBoundedJson, readBoundedText, RequestBodyError } from "../lib/request-body";

function streamRequest(chunks: Uint8Array[], headers?: HeadersInit) {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks.shift();
      if (chunk) controller.enqueue(chunk); else controller.close();
    },
    cancel() { cancelled = true; },
  });
  const request = new Request("https://fixture.invalid/", { method: "POST", body, headers, duplex: "half" } as RequestInit & { duplex: "half" });
  return { request, cancelled: () => cancelled };
}

test("Chunked bodies are stopped at the byte limit, even with a false Content-Length", async () => {
  for (const headers of [undefined, { "Content-Length": "1" }]) {
    const fixture = streamRequest([new Uint8Array(4), new Uint8Array(5), new Uint8Array(100)], headers);
    await assert.rejects(readBoundedText(fixture.request, 8), (error: unknown) => error instanceof RequestBodyError && error.status === 413);
    assert.equal(fixture.cancelled(), true);
  }
});

test("Limits count UTF-8 bytes and decode multibyte characters split across chunks", async () => {
  const bytes = new TextEncoder().encode('{"text":"🍊"}');
  const exact = streamRequest([bytes.slice(0, 10), bytes.slice(10)]);
  assert.deepEqual(await readBoundedJson(exact.request, bytes.length), { text: "🍊" });
  await assert.rejects(readBoundedJson(streamRequest([bytes]).request, bytes.length - 1), (error: unknown) => error instanceof RequestBodyError && error.status === 413);
});

test("Oversized declarations, malformed lengths, JSON and UTF-8 are rejected", async () => {
  const fixture = streamRequest([new Uint8Array(20)], { "Content-Length": "20" });
  await assert.rejects(readBoundedText(fixture.request, 8), (error: unknown) => error instanceof RequestBodyError && error.status === 413);
  assert.equal(fixture.cancelled(), true);
  for (const length of ["-1", "NaN", "9007199254740993"]) {
    await assert.rejects(readBoundedText(streamRequest([], { "Content-Length": length }).request, 8), RequestBodyError);
  }
  await assert.rejects(readBoundedText(streamRequest([new Uint8Array([255])]).request, 8), RequestBodyError);
  await assert.rejects(readBoundedJson(new Request("https://fixture.invalid/", { method: "POST", body: "{" }), 8), RequestBodyError);
});
