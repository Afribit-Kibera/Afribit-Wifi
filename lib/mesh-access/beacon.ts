import { createPrivateKey, createPublicKey, randomBytes, sign, verify, type KeyObject } from "node:crypto";

/**
 * The Afribit Mesh beacon (S-14): how the Afribit app tells this mesh from an impostor.
 *
 * Three signed statements, each with its own prefix so a signature over one can never be
 * replayed as another:
 *
 * - Node certificate: the Afribit mesh root key, which is kept offline and pinned in the
 *   app, certifies one gateway's Ed25519 key for a mesh, a node id and a period. A new
 *   gateway therefore needs a certificate, not an app update.
 * - Revocation list: the root key lists certificate serials that are no longer trusted.
 *   The app keeps the newest list it has seen, so a gateway cannot hide a revocation by
 *   serving an older list.
 * - Beacon: the gateway signs the phone's fresh nonce, the address the request came from,
 *   a short validity window and its certificate serial. A relaying impostor shows up as an
 *   address mismatch, and a replayed beacon as a nonce mismatch.
 *
 * The app's verifier is packages/kernel/src/mesh.ts in the Afribit app repository. Field
 * order, separators and limits here are part of the protocol and must match it.
 */

export const BEACON_PATH = "/.well-known/afribit-mesh-beacon";
export const BEACON_WINDOW_MS = 60_000;
export const MAX_CERTIFICATE_LIFETIME_MS = 400 * 24 * 60 * 60_000;
export const MAX_REVOKED_SERIALS = 256;

const ID = /^[A-Za-z0-9_-]{8,64}$/;
const SERIAL = /^[0-9a-f]{16}$/;
const KEY_HEX = /^[0-9a-f]{64}$/;
const SIG_HEX = /^[0-9a-f]{128}$/;
const NONCE = /^[A-Za-z0-9_-]{22,64}$/;
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export type NodeCertificate = {
  v: 1; rootKeyId: string; serial: string; meshId: string; nodeId: string; nodeKey: string;
  notBefore: number; notAfter: number; sig: string;
};
export type RevocationList = { v: 1; rootKeyId: string; issuedAt: number; serials: string[]; sig: string };
export type MeshBeacon = {
  v: 2; meshId: string; nodeId: string; issuedAt: number; expiresAt: number; nonce: string; clientIp: string;
  cert: NodeCertificate; revocations: RevocationList; sig: string;
};

const encode = (lines: (string | number)[]) => Buffer.from(lines.map(String).join("\n"), "utf8");

export function canonicalCertificate(c: Omit<NodeCertificate, "sig">) {
  return encode(["afribit-mesh-node-cert/1", c.rootKeyId, c.serial, c.meshId, c.nodeId, c.nodeKey, c.notBefore, c.notAfter]);
}
export function canonicalRevocations(r: Omit<RevocationList, "sig">) {
  return encode(["afribit-mesh-revocations/1", r.rootKeyId, r.issuedAt, r.serials.join(",")]);
}
export function canonicalBeacon(b: Omit<MeshBeacon, "sig" | "cert" | "revocations">, serial: string) {
  return encode(["afribit-mesh-beacon/2", serial, b.meshId, b.nodeId, b.issuedAt, b.expiresAt, b.nonce, b.clientIp]);
}

// The fixed DER prefix of an Ed25519 PKCS#8 private key; the 32-byte seed follows it.
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");

/** An Ed25519 private key from its 32-byte seed, as hex. Used for fixtures and key files. */
export function privateKeyFromSeed(seedHex: string): KeyObject {
  if (!KEY_HEX.test(seedHex)) throw new Error("An Ed25519 seed is 32 bytes of lowercase hex");
  return createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.from(seedHex, "hex")]), format: "der", type: "pkcs8" });
}

/** The raw 32-byte public key of an Ed25519 key, as lowercase hex. */
export function publicKeyHex(key: KeyObject): string {
  const jwk = (key.type === "private" ? createPublicKey(key) : key).export({ format: "jwk" });
  if (jwk.crv !== "Ed25519" || typeof jwk.x !== "string") throw new Error("Not an Ed25519 key");
  return Buffer.from(jwk.x, "base64url").toString("hex");
}

function publicKeyFromHex(hex: string): KeyObject {
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(hex, "hex").toString("base64url") }, format: "jwk" });
}

const signHex = (key: KeyObject, bytes: Buffer) => sign(null, bytes, key).toString("hex");
function verifyHex(publicHex: string, bytes: Buffer, sigHex: string) {
  try { return SIG_HEX.test(sigHex) && verify(null, bytes, publicKeyFromHex(publicHex), Buffer.from(sigHex, "hex")); }
  catch { return false; }
}

/** The root key's id: the first 16 hex characters of its public key, so it cannot drift from the key. */
export const rootKeyIdOf = (rootPublicHex: string) => `root-${rootPublicHex.slice(0, 16)}`;
export const newSerial = () => randomBytes(8).toString("hex");

export function issueCertificate(root: KeyObject, fields: { serial?: string; meshId: string; nodeId: string; nodeKey: string; notBefore: number; notAfter: number }): NodeCertificate {
  const unsigned = { v: 1 as const, rootKeyId: rootKeyIdOf(publicKeyHex(root)), serial: fields.serial ?? newSerial(),
    meshId: fields.meshId, nodeId: fields.nodeId, nodeKey: fields.nodeKey, notBefore: fields.notBefore, notAfter: fields.notAfter };
  const problem = certificateProblem(unsigned);
  if (problem) throw new Error(`Cannot issue this certificate: ${problem}`);
  return { ...unsigned, sig: signHex(root, canonicalCertificate(unsigned)) };
}

export function issueRevocations(root: KeyObject, serials: string[], issuedAt: number): RevocationList {
  const sorted = [...new Set(serials)].sort();
  if (sorted.length > MAX_REVOKED_SERIALS || !sorted.every(serial => SERIAL.test(serial))) throw new Error("Revoked serials must be up to 256 16-hex-character serials");
  const unsigned = { v: 1 as const, rootKeyId: rootKeyIdOf(publicKeyHex(root)), issuedAt, serials: sorted };
  return { ...unsigned, sig: signHex(root, canonicalRevocations(unsigned)) };
}

function certificateProblem(c: Omit<NodeCertificate, "sig">): string | null {
  if (!ID.test(c.rootKeyId) || !ID.test(c.meshId) || !ID.test(c.nodeId)) return "ids must be 8 to 64 of A-Z, a-z, 0-9, _ and -";
  if (!SERIAL.test(c.serial)) return "the serial must be 16 lowercase hex characters";
  if (!KEY_HEX.test(c.nodeKey)) return "the node key must be a 32-byte Ed25519 public key in hex";
  if (!Number.isSafeInteger(c.notBefore) || !Number.isSafeInteger(c.notAfter) || c.notAfter <= c.notBefore) return "the period must end after it starts";
  if (c.notAfter - c.notBefore > MAX_CERTIFICATE_LIFETIME_MS) return "a certificate may last at most 400 days";
  return null;
}

/**
 * Checks the gateway's own certificate and list against the root before it starts serving,
 * so a mistyped file fails at start-up rather than as an impostor warning on every phone.
 */
export function checkGatewayIdentity(identity: { nodeKey: KeyObject; cert: NodeCertificate; revocations: RevocationList }, rootPublicHex: string, nowMs: number) {
  const { cert, revocations } = identity;
  const { sig, ...unsigned } = cert;
  const problem = certificateProblem(unsigned);
  if (problem) throw new Error(`Mesh beacon certificate: ${problem}`);
  if (cert.rootKeyId !== rootKeyIdOf(rootPublicHex) || !verifyHex(rootPublicHex, canonicalCertificate(unsigned), sig)) throw new Error("Mesh beacon certificate is not signed by the configured root");
  if (cert.nodeKey !== publicKeyHex(identity.nodeKey)) throw new Error("Mesh beacon certificate is for a different node key");
  if (cert.notAfter <= nowMs) throw new Error("Mesh beacon certificate has expired");
  const { sig: listSig, ...list } = revocations;
  if (revocations.rootKeyId !== cert.rootKeyId || !verifyHex(rootPublicHex, canonicalRevocations(list), listSig)) throw new Error("Mesh beacon revocation list is not signed by the configured root");
  if (revocations.serials.includes(cert.serial)) throw new Error("Mesh beacon certificate is revoked");
}

/** Signs a beacon for one request. The caller has already checked the nonce and the peer address. */
export function signBeacon(identity: { nodeKey: KeyObject; cert: NodeCertificate; revocations: RevocationList }, request: { nonce: string; clientIp: string; nowMs: number }): MeshBeacon {
  if (!NONCE.test(request.nonce)) throw new Error("Invalid beacon nonce");
  if (!IPV4.test(request.clientIp)) throw new Error("Invalid beacon client address");
  const unsigned = { v: 2 as const, meshId: identity.cert.meshId, nodeId: identity.cert.nodeId,
    issuedAt: request.nowMs, expiresAt: request.nowMs + BEACON_WINDOW_MS, nonce: request.nonce, clientIp: request.clientIp };
  return { ...unsigned, cert: identity.cert, revocations: identity.revocations,
    sig: signHex(identity.nodeKey, canonicalBeacon(unsigned, identity.cert.serial)) };
}

export const isBeaconNonce = (value: string | null): value is string => value !== null && NONCE.test(value);

/**
 * The chat proof (CR-3b): this gateway vouches that a chat identity is asking from the
 * mesh. The Afribit chat gate (services/chat-gate/src/auth.ts in the Afribit app
 * repository) checks it against this gateway's node key, which it lists by `keyId`, so
 * the prefix and field order below must match the gate's. `issuedAt` and `expiresAt` are
 * in seconds, and the gate accepts a proof for at most 60 seconds. Each proof has its
 * own nonce, which the gate keeps to refuse a replay.
 */
export const MESH_PROOF_PATH = "/.well-known/afribit-mesh-proof";
export const MESH_PROOF_LIFETIME_S = 60;

export type ChatMeshProof = {
  v: 1; meshId: string; nodeId: string; featureId: "chat"; subjectPubkey: string;
  issuedAt: number; expiresAt: number; nonce: string; keyId: string; sig: string;
};

/** The gate's name for a gateway's node key: one per certificate. */
export const meshProofKeyId = (cert: Pick<NodeCertificate, "serial">) => `node-${cert.serial}`;

export function chatProofSigningBytes(p: Omit<ChatMeshProof, "sig">) {
  return Buffer.from(JSON.stringify(["afribit.chat.mesh.v1", p.v, p.meshId, p.nodeId, p.featureId, p.subjectPubkey, p.issuedAt, p.expiresAt, p.nonce, p.keyId]));
}

/** A chat identity: a Nostr public key, 32 bytes of lowercase hex. */
export const isSubjectPubkey = (value: string | null): value is string => value !== null && KEY_HEX.test(value);

/** Signs a chat proof for one request. The caller has already checked the peer address. */
export function signChatProof(identity: { nodeKey: KeyObject; cert: NodeCertificate }, request: { subjectPubkey: string; nowMs: number; nonce?: string }): ChatMeshProof {
  if (!isSubjectPubkey(request.subjectPubkey)) throw new Error("Invalid chat identity");
  const issuedAt = Math.floor(request.nowMs / 1000);
  const unsigned = { v: 1 as const, meshId: identity.cert.meshId, nodeId: identity.cert.nodeId, featureId: "chat" as const,
    subjectPubkey: request.subjectPubkey, issuedAt, expiresAt: issuedAt + MESH_PROOF_LIFETIME_S,
    nonce: request.nonce ?? randomBytes(16).toString("base64url"), keyId: meshProofKeyId(identity.cert) };
  return { ...unsigned, sig: sign(null, chatProofSigningBytes(unsigned), identity.nodeKey).toString("base64url") };
}

/**
 * This gateway's entry for the chat gate's CHAT_MESH_KEYS_FILE. It is public data: the
 * certified node key as PEM, under the id its proofs carry.
 */
export function chatGateKeyEntry(cert: NodeCertificate) {
  const publicKeyPem = publicKeyFromHex(cert.nodeKey).export({ format: "pem", type: "spki" }).toString();
  return { [meshProofKeyId(cert)]: { meshId: cert.meshId, nodeId: cert.nodeId, publicKeyPem } };
}
