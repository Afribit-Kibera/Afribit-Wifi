import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPrivateKey } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  BEACON_PATH, MESH_PROOF_PATH, checkGatewayIdentity, isBeaconNonce, isSubjectPubkey, signBeacon, signChatProof,
  type NodeCertificate, type RevocationList,
} from "../lib/mesh-access/beacon";

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

type Deps = { identity: () => BeaconIdentity | null; peer: (request: IncomingMessage) => string; now?: () => number };

/** At most `limit` requests per address in `windowMs`; the map is pruned as it grows. */
function perAddressLimit(limit: number, windowMs: number) {
  const recent = new Map<string, number[]>();
  return (address: string, at: number): boolean => {
    const seen = (recent.get(address) ?? []).filter(t => t > at - windowMs);
    if (seen.length >= limit) return false;
    seen.push(at); recent.set(address, seen);
    if (recent.size > 4096) for (const [key, times] of recent) if (times.every(t => t <= at - windowMs)) recent.delete(key);
    return true;
  };
}

function answer(response: ServerResponse, status: number) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.writeHead(status); response.end();
}

/**
 * The checks both endpoints share: GET, an identity, a trusted peer and the rate limit.
 * Returns the identity, the peer address and the time, or null once it has answered.
 */
function admit(request: IncomingMessage, response: ServerResponse, deps: Deps, allow: (address: string, at: number) => boolean) {
  const identity = deps.identity();
  if (request.method !== "GET" || !identity) { answer(response, 404); return null; }
  let address: string;
  try { address = deps.peer(request); }
  catch { answer(response, 403); return null; }
  const at = (deps.now ?? Date.now)();
  if (!allow(address, at)) { response.setHeader("Retry-After", "10"); answer(response, 429); return null; }
  return { identity, address, at };
}

function json(response: ServerResponse, body: unknown) {
  response.writeHead(200, { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

/**
 * Serves GET /.well-known/afribit-mesh-beacon?nonce=… to phones on the mesh. The address
 * signed is the one this gateway saw the request come from (`peer`), never one the request
 * states, so a beacon fetched by a fake access point names the fake point, not the phone.
 */
export function createBeaconHandler(deps: Deps) {
  const allow = perAddressLimit(5, 10_000);
  return (request: IncomingMessage, response: ServerResponse): boolean => {
    const url = new URL(request.url ?? "/", "http://mesh.local");
    if (url.pathname !== BEACON_PATH) return false;
    const admitted = admit(request, response, deps, allow);
    if (!admitted) return true;
    const nonce = url.searchParams.get("nonce");
    if (!isBeaconNonce(nonce)) { answer(response, 400); return true; }
    json(response, signBeacon(admitted.identity, { nonce, clientIp: admitted.address, nowMs: admitted.at }));
    return true;
  };
}

/**
 * Serves GET /.well-known/afribit-mesh-proof?feature=chat&subject=<pubkey> to phones on the
 * mesh (CR-3b): a 60-second proof that this chat identity is asking from here, which the
 * Afribit app adds to its signed requests to the chat gate. Chat needs one per request, so
 * the limit is looser than the beacon's.
 */
export function createMeshProofHandler(deps: Deps) {
  const allow = perAddressLimit(20, 10_000);
  return (request: IncomingMessage, response: ServerResponse): boolean => {
    const url = new URL(request.url ?? "/", "http://mesh.local");
    if (url.pathname !== MESH_PROOF_PATH) return false;
    const admitted = admit(request, response, deps, allow);
    if (!admitted) return true;
    const subject = url.searchParams.get("subject");
    if (url.searchParams.get("feature") !== "chat" || !isSubjectPubkey(subject)) { answer(response, 400); return true; }
    json(response, signChatProof(admitted.identity, { subjectPubkey: subject, nowMs: admitted.at }));
    return true;
  };
}
