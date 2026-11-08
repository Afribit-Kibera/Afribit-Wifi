import assert from "node:assert/strict";
import { test } from "node:test";
import { createMeshPollWaiter, MeshPollSchedule, MESH_POLL_INTERVALS } from "../gateway-agent/mesh-polling";
import { MeshCloudClient, pollMeshCloud, readDaemonConfig } from "../gateway-agent/mesh-daemon";

test("An idle controller has at most 1,440 cloud polls per day instead of 43,200", () => {
  let clock = 0, polls = 0;
  const schedule = new MeshPollSchedule(() => clock);
  while (clock < 86_400_000) {
    polls++;
    clock += schedule.success(false, "active");
  }
  assert.equal(polls, 1440);
  assert.equal(schedule.success(false, "standby"), 60_000);
});

test("A live attested join wakes a bounded fast window, then idle polling returns", () => {
  let clock = 0;
  const schedule = new MeshPollSchedule(() => clock);
  assert.equal(schedule.success(false, "active"), 60_000);
  schedule.activity();
  assert.equal(schedule.success(false, "active"), 2_000);
  clock = MESH_POLL_INTERVALS.activityWindow - 1;
  assert.equal(schedule.success(false, "active"), 2_000);
  clock++;
  assert.equal(schedule.success(false, "active"), 60_000);
  assert.equal(schedule.success(true, "active"), 2_000);
  assert.equal(schedule.success(false, "active"), 60_000);
});

test("Cloud or handoff failures back off to five minutes, and success resets retries", () => {
  const schedule = new MeshPollSchedule();
  assert.deepEqual(Array.from({ length: 9 }, () => schedule.failure()),
    [15_000, 30_000, 60_000, 120_000, 240_000, 300_000, 300_000, 300_000, 300_000]);
  assert.equal(schedule.success(false, "active"), 60_000);
  assert.equal(schedule.failure(), 15_000);
});

test("Paused mode performs zero cloud requests and cannot claim access jobs", async () => {
  const env = { MESH_AUTOMATIC_AGENT_ENABLED: "true", MESH_AGENT_MODE: "paused",
    MESH_ROUTER_SERVICE_KEY: "fixture-router-service-key-at-least-32-bytes",
    MIKROTIK_USERNAME: "fixture", MIKROTIK_PASSWORD: "fixture" };
  assert.equal(readDaemonConfig(env).mode, "paused");
  let requests = 0;
  const client = new MeshCloudClient(readDaemonConfig(env), async () => { requests++; throw new Error("Must not call cloud"); });
  for (let i = 0; i < 100; i++) assert.deepEqual(await pollMeshCloud(client, "paused"), { jobs: [], revocations: [] });
  assert.equal(requests, 0);
});

test("Idle waits wake immediately on a live join or stop without leaving a timer", async () => {
  const waiter = createMeshPollWaiter();
  const wait = waiter.wait(300_000);
  waiter.wake();
  await wait;
  // The completed wait must not swallow the next wake or leak its long timer.
  const next = waiter.wait(60_000);
  waiter.wake();
  await next;
  assert.throws(() => waiter.wait(0), /Invalid Mesh polling delay/);
});
