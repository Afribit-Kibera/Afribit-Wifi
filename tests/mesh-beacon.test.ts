import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createPublicKey, verify } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { test } from "node:test";
import {
  BEACON_PATH, canonicalBeacon, checkGatewayIdentity, issueCertificate, issueRevocations,
  privateKeyFromSeed, publicKeyHex, rootKeyIdOf, signBeacon,
} from "../lib/mesh-access/beacon";
import { createBeaconHandler } from "../gateway-agent/mesh-beacon";

// Fixed keys and times, so the beacon below is the same bytes on every run. The Afribit app
// checks the same vector (packages/kernel/test/fixtures/mesh-beacon-vector.json).
const VECTOR = "tests/fixtures/mesh-beacon-vector.json";
const root = privateKeyFromSeed("01".repeat(32));
const node = privateKeyFromSeed("02".repeat(32));
const T0 = 1_790_000_000_000, DAY = 86_400_000;
const rootPub = publicKeyHex(root);

function identity(overrides: { serials?: string[]; notAfter?: number } = {}) {
  const cert = issueCertificate(root, { serial: "0123456789abcdef", meshId: "afribit-kibera", nodeId: "KM-LAB-001",
    nodeKey: publicKeyHex(node), notBefore: T0, notAfter: overrides.notAfter ?? T0 + 90 * DAY });
  return { nodeKey: node, cert, revocations: issueRevocations(root, overrides.serials ?? ["fedcba9876543210"], T0) };
}

test("the beacon vector is stable and its signatures check out", async () => {
  const beacon = signBeacon(identity(), { nonce: "nonce-0123456789abcdefghij", clientIp: "10.20.0.57", nowMs: T0 + 100_000 });
  const vector = { rootPublicKey: rootPub, nowMs: T0 + 100_000, beacon };
  if (process.env.UPDATE_BEACON_VECTOR === "1") await writeFile(VECTOR, `${JSON.stringify(vector, null, 2)}\n`);
  assert.deepEqual(JSON.parse(await readFile(VECTOR, "utf8")), vector);
  const { sig, cert, revocations, ...unsigned } = beacon;
  const nodePub = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(cert.nodeKey, "hex").toString("base64url") }, format: "jwk" });
  assert.ok(verify(null, canonicalBeacon(unsigned, cert.serial), nodePub, Buffer.from(sig, "hex")));
  assert.equal(cert.rootKeyId, rootKeyIdOf(rootPub));
  assert.equal(revocations.rootKeyId, cert.rootKeyId);
  assert.equal(beacon.expiresAt - beacon.issuedAt, 60_000);
});

test("a gateway refuses to serve an identity that would not verify", () => {
  assert.doesNotThrow(() => checkGatewayIdentity(identity(), rootPub, T0 + DAY));
  const otherRoot = publicKeyHex(privateKeyFromSeed("03".repeat(32)));
  assert.throws(() => checkGatewayIdentity(identity(), otherRoot, T0 + DAY), /not signed by the configured root/);
  assert.throws(() => checkGatewayIdentity({ ...identity(), nodeKey: privateKeyFromSeed("04".repeat(32)) }, rootPub, T0 + DAY), /different node key/);
  assert.throws(() => checkGatewayIdentity(identity({ serials: ["0123456789abcdef"] }), rootPub, T0 + DAY), /revoked/);
  assert.throws(() => checkGatewayIdentity(identity(), rootPub, T0 + 91 * DAY), /expired/);
  const tampered = identity(); tampered.cert = { ...tampered.cert, nodeId: "KM-LAB-002" };
  assert.throws(() => checkGatewayIdentity(tampered, rootPub, T0 + DAY), /not signed/);
});

test("certificates and lists stay within the protocol's limits", () => {
  assert.throws(() => issueCertificate(root, { meshId: "afribit-kibera", nodeId: "KM-LAB-001", nodeKey: publicKeyHex(node), notBefore: T0, notAfter: T0 + 401 * DAY }), /400 days/);
  assert.throws(() => issueCertificate(root, { meshId: "mesh", nodeId: "KM-LAB-001", nodeKey: publicKeyHex(node), notBefore: T0, notAfter: T0 + DAY }), /ids must be/);
  assert.throws(() => issueRevocations(root, ["not-a-serial"], T0), /16-hex/);
  assert.deepEqual(issueRevocations(root, ["bb00000000000000", "aa00000000000000", "bb00000000000000"], T0).serials, ["aa00000000000000", "bb00000000000000"]);
});

type Reply = { status: number; headers: Record<string, unknown>; body: string };
function call(handler: ReturnType<typeof createBeaconHandler>, url: string, method = "GET"): { handled: boolean; reply: Reply } {
  const reply: Reply = { status: 0, headers: {}, body: "" };
  const response = {
    setHeader(name: string, value: unknown) { reply.headers[name.toLowerCase()] = value; },
    writeHead(status: number, headers: Record<string, unknown> = {}) { reply.status = status; for (const [k, v] of Object.entries(headers)) reply.headers[k.toLowerCase()] = v; },
    end(body?: string) { reply.body = body ?? ""; },
  } as unknown as ServerResponse;
  const handled = handler({ method, url, headers: {} } as IncomingMessage, response);
  return { handled, reply };
}

test("the endpoint signs the address it saw, not one the request claims", () => {
  let at = T0 + 100_000;
  const handler = createBeaconHandler({ identity: () => identity(), peer: () => "10.20.0.57", now: () => at });
  const { handled, reply } = call(handler, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij&clientIp=10.20.0.99`);
  assert.equal(handled, true);
  assert.equal(reply.status, 200);
  assert.equal(reply.headers["cache-control"], "no-store");
  const beacon = JSON.parse(reply.body);
  assert.equal(beacon.clientIp, "10.20.0.57");
  assert.equal(beacon.nonce, "nonce-0123456789abcdefghij");
  at += 1;
});

test("the endpoint refuses what it should and leaves other paths alone", () => {
  const on = createBeaconHandler({ identity: () => identity(), peer: () => "10.20.0.57", now: () => T0 });
  assert.equal(call(on, "/start").handled, false);
  assert.equal(call(on, `${BEACON_PATH}?nonce=short`).reply.status, 400);
  assert.equal(call(on, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij`, "POST").reply.status, 404);
  const off = createBeaconHandler({ identity: () => null, peer: () => "10.20.0.57" });
  assert.equal(call(off, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij`).reply.status, 404);
  const outsider = createBeaconHandler({ identity: () => identity(), peer: () => { throw new Error("not a mesh address"); } });
  assert.equal(call(outsider, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij`).reply.status, 403);
});

test("one address gets five beacons per ten seconds", () => {
  let at = T0;
  const handler = createBeaconHandler({ identity: () => identity(), peer: () => "10.20.0.57", now: () => at });
  const statuses = Array.from({ length: 6 }, () => call(handler, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij`).reply.status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  at += 10_001;
  assert.equal(call(handler, `${BEACON_PATH}?nonce=nonce-0123456789abcdefghij`).reply.status, 200);
});
