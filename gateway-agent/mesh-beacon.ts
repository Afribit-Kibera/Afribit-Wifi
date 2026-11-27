import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPrivateKey } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { BEACON_PATH, checkGatewayIdentity, isBeaconNonce, signBeacon, type NodeCertificate, type RevocationList } from "../lib/mesh-access/beacon";

export type BeaconIdentity = Parameters<typeof signBeacon>[0];

/**
 * The gateway's beacon identity, from MESH_BEACON_DIR:
 *   node-key.pem      this gateway's Ed25519 private key (PKCS#8 PEM, mode 0600)
 *   node-cert.json    its certificate from the mesh root
 *   revocations.json  the newest revocation list from the mesh root
 *   root.pub          the mesh root's public key, hex, to check the two files above
 * With no MESH_BEACON_DIR the beacon is off and the endpoint answers 404, so a gateway
 * without an identity never looks like one that has a broken identity.
 */
export async function loadBeaconIdentity(env: Record<string, string | undefined> = process.env, nowMs = Date.now()): Promise<BeaconIdentity | null> {
  const dir = env.MESH_BEACON_DIR;
  if (!dir) return null;
  const [pem, cert, revocations, root] = await Promise.all([
    readFile(join(dir, "node-key.pem"), "utf8"),
    readFile(join(dir, "node-cert.json"), "utf8"),
    readFile(join(dir, "revocations.json"), "utf8"),
    readFile(join(dir, "root.pub"), "utf8"),
  ]);
  const identity: BeaconIdentity = { nodeKey: createPrivateKey(pem), cert: JSON.parse(cert) as NodeCertificate, revocations: JSON.parse(revocations) as RevocationList };
  checkGatewayIdentity(identity, root.trim(), nowMs);
  return identity;
}

const PER_ADDRESS = 5, PER_WINDOW_MS = 10_000;

/**
 * Serves GET /.well-known/afribit-mesh-beacon?nonce=… to phones on the mesh. The address
 * signed is the one this gateway saw the request come from (`peer`), never one the request
 * states, so a beacon fetched by a fake access point names the fake point, not the phone.
 */
export function createBeaconHandler(deps: { identity: () => BeaconIdentity | null; peer: (request: IncomingMessage) => string; now?: () => number }) {
  const recent = new Map<string, number[]>();
  const now = deps.now ?? Date.now;
  return (request: IncomingMessage, response: ServerResponse): boolean => {
    const url = new URL(request.url ?? "/", "http://mesh.local");
    if (url.pathname !== BEACON_PATH) return false;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const identity = deps.identity();
    if (request.method !== "GET" || !identity) { response.writeHead(404); response.end(); return true; }
    const nonce = url.searchParams.get("nonce");
    if (!isBeaconNonce(nonce)) { response.writeHead(400); response.end(); return true; }
    let clientIp: string;
    try { clientIp = deps.peer(request); }
    catch { response.writeHead(403); response.end(); return true; }
    const at = now();
    const seen = (recent.get(clientIp) ?? []).filter(t => t > at - PER_WINDOW_MS);
    if (seen.length >= PER_ADDRESS) { response.setHeader("Retry-After", "10"); response.writeHead(429); response.end(); return true; }
    seen.push(at); recent.set(clientIp, seen);
    if (recent.size > 4096) for (const [key, times] of recent) if (times.every(t => t <= at - PER_WINDOW_MS)) recent.delete(key);
    const body = JSON.stringify(signBeacon(identity, { nonce, clientIp, nowMs: at }));
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(body);
    return true;
  };
}
