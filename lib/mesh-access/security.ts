import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { MeshAccessConfig } from "./config";
export const meshCookieName = "mesh_session";
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const freshToken = () => randomBytes(32).toString("base64url");
export function encryptAccess(value: unknown, config: MeshAccessConfig) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(config.encryptionKey, "base64"), iv);
  cipher.setAAD(Buffer.from("mesh-access-v2"));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString("base64url")).join(".");
}
export function decryptAccess<T>(value: string, config: MeshAccessConfig): T {
  const [iv, tag, ciphertext] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(config.encryptionKey, "base64"), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from("mesh-access-v2"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString()) as T;
}
function agentSignature(config: Pick<MeshAccessConfig, "routerId" | "serviceKey">, path: string, body: string, timestamp: string, nonce?: string) {
  const message = nonce === undefined ? `${timestamp}\nPOST\n${path}\n${body}`
    : `mesh-agent-v2\n${config.routerId}\n${timestamp}\nPOST\n${path}\n${nonce}\n${body}`;
  return createHmac("sha256", config.serviceKey).update(message).digest("hex");
}
export function meshAgentHeaders(config: Pick<MeshAccessConfig, "routerId" | "serviceKey">, path: string, body: string,
  timestamp = Math.floor(Date.now() / 1000).toString(), nonce = freshToken()) {
  // Keep the original signature while the new controller is rolled out ahead
  // of the API. Old servers ignore v2 headers; new servers bind the nonce.
  return { "Content-Type": "application/json", "x-mesh-router": config.routerId, "x-mesh-time": timestamp,
    "x-mesh-auth": agentSignature(config, path, body, timestamp), "x-mesh-nonce": nonce,
    "x-mesh-auth-v2": agentSignature(config, path, body, timestamp, nonce) };
}
export type MeshAgentAuthentication = { version: "v2" | "legacy"; replayKey: string };
function sameSignature(actual: string, expected: string) {
  return /^[a-f0-9]{64}$/.test(actual) && timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
export function legacyMeshAgentAuthAllowed(env: Record<string, string | undefined>, now = Date.now()) {
  const until = env.MESH_AGENT_LEGACY_AUTH_UNTIL;
  if (!until || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(until)) return false;
  const deadline = Date.parse(until);
  return Number.isFinite(deadline) && new Date(deadline).toISOString() === until &&
    deadline > now && deadline - now <= 24 * 60 * 60 * 1000;
}
export function authenticateMeshAgent(request: Request, body: string, config: MeshAccessConfig,
  now = Date.now(), env: Record<string, string | undefined> = process.env): MeshAgentAuthentication | null {
  const timestamp = request.headers.get("x-mesh-time") ?? "";
  const signature = request.headers.get("x-mesh-auth") ?? "";
  if (request.method !== "POST" || request.headers.get("x-mesh-router") !== config.routerId || !/^\d{10}$/.test(timestamp) ||
      Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 60 || !/^[a-f0-9]{64}$/.test(signature) || Buffer.byteLength(body) > 16_384) return null;
  const path = new URL(request.url).pathname;
  if (!sameSignature(signature, agentSignature(config, path, body, timestamp))) return null;
  const nonce = request.headers.get("x-mesh-nonce"), v2 = request.headers.get("x-mesh-auth-v2");
  if (nonce !== null || v2 !== null) {
    // A partial/broken v2 request must never downgrade to legacy auth.
    if (!nonce || !v2 || !/^[A-Za-z0-9_-]{43}$/.test(nonce) || Buffer.from(nonce, "base64url").toString("base64url") !== nonce ||
      !sameSignature(v2, agentSignature(config, path, body, timestamp, nonce))) return null;
    return { version: "v2", replayKey: hashToken(`mesh-agent-v2\n${config.routerId}\n${nonce}`) };
  }
  if (!legacyMeshAgentAuthAllowed(env, now)) return null;
  return { version: "legacy", replayKey: hashToken(`mesh-agent-legacy\n${config.routerId}\n${signature}`) };
}
export function verifyMeshAgent(request: Request, body: string, config: MeshAccessConfig, now = Date.now()) {
  // Cryptographic validity only. Route callers must claim the request in the
  // durable store; a process-local Set would permit serverless replay.
  return authenticateMeshAgent(request, body, config, now) !== null;
}
