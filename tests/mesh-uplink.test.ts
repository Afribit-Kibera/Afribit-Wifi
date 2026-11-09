import assert from "node:assert/strict";
import { test } from "node:test";
import { nextUplinkState, probeInternet, type UplinkState } from "../lib/mesh-access/uplink";

// Mesh keeps running when the internet line drops; only sales pause.
test("The internet line is marked down after two failed checks, and up on the first good one", () => {
  const up: UplinkState = { online: true, since: 0, checkedAt: 0, failures: 0 };
  const once = nextUplinkState(up, false, 1_000);
  assert.equal(once.online, true, "One slow answer doesn't pause sales");
  const down = nextUplinkState(once, false, 2_000);
  assert.deepEqual([down.online, down.since], [false, 2_000]);
  assert.equal(nextUplinkState(down, false, 3_000).since, 2_000, "Still down since the first outage");
  const back = nextUplinkState(down, true, 4_000);
  assert.deepEqual([back.online, back.since, back.failures], [true, 4_000, 0]);
  assert.equal(nextUplinkState(nextUplinkState(back, false, 5_000), true, 6_000).failures, 0, "A good check clears a single failure");
});

test("A check passes if any address answers, and fails only if none do", async () => {
  const seen: string[] = [];
  const answer = (results: Record<string, number | "throw">) => (async (url: string | URL | Request) => {
    seen.push(String(url));
    const result = results[String(url)];
    if (result === undefined || result === "throw") throw new Error("unreachable");
    return new Response(null, { status: result });
  }) as typeof fetch;
  assert.equal(await probeInternet(answer({ "https://1.1.1.1/cdn-cgi/trace": 200 })), true);
  assert.equal(await probeInternet(answer({ "https://8.8.8.8/": 302 })), true, "A redirect still proves the line works");
  assert.equal(await probeInternet(answer({ "https://1.1.1.1/cdn-cgi/trace": 503 })), false);
  assert.equal(await probeInternet(answer({})), false);
  assert.ok(seen.every(url => /^https:\/\/\d+\.\d+\.\d+\.\d+\//.test(url)), "Checks use IP addresses, not names");
});
