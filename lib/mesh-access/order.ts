import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { EngineSettlement } from "../payments/insats-engine";

// Isolated commissioning contract. No legacy gateway queue or IP bypass grant.
// A future service must persist one immutable order per payment and consume the
// host ticket atomically before enabling this contract for public checkout.
const uuid = z.string().uuid().refine(value => value === value.toLowerCase());
const mac = z.string().regex(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/);
const hostSchema = z.object({
  routerId: z.string().min(1).max(64), server: z.string().min(1).max(64),
  ticketId: uuid, macAddress: mac,
  ipAddress: z.string().regex(/^10\.30\.0\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])$/),
  checkedAt: z.number().int().positive(),
}).strict();
const orderSchema = z.object({
  version: z.literal(1), purpose: z.literal("paid"), paymentId: uuid,
  routerId: z.string(), server: z.string(), ticketId: uuid, macAddress: mac,
  ipAddress: z.string(), issuedAt: z.number().int().positive(), expiresAt: z.number().int().positive(),
  username: z.string().regex(/^md-[a-f0-9]{32}$/), password: z.string().regex(/^[a-zA-Z0-9_-]{32}$/),
  profile: z.literal("KM-MESH-DEADLINE-5M"), rateLimit: z.literal("2M/2M"),
  paymentHash: z.string().regex(/^[a-f0-9]{64}$/), amountSats: z.number().int().positive(),
}).strict();
export type HostContext = z.infer<typeof hostSchema>;
export type NativeAccessOrder = z.infer<typeof orderSchema>;
export type Enrollment = { routerId: string; server: string; key: string };
export type SignedEnvelope = { body: string; signature: string };

function sign(domain: string, body: string, key: string) {
  if (Buffer.byteLength(key) < 32) throw new Error("Mesh router key must have at least 32 bytes");
  return createHmac("sha256", key).update(domain + "\n" + body).digest("hex");
}
function unwrap(domain: string, envelope: SignedEnvelope, key: string) {
  if (typeof envelope.body !== "string" || envelope.body.length > 4096 || !/^[a-f0-9]{64}$/.test(envelope.signature)) throw new Error("Invalid Mesh signature");
  const expected = Buffer.from(sign(domain, envelope.body, key), "hex");
  if (!timingSafeEqual(expected, Buffer.from(envelope.signature, "hex"))) throw new Error("Invalid Mesh signature");
  return JSON.parse(envelope.body) as unknown;
}
function bound(context: { routerId: string; server: string }, enrollment: Enrollment) {
  if (context.routerId !== enrollment.routerId || context.server !== enrollment.server) throw new Error("Mesh router target mismatch");
}
export function attestHost(context: HostContext, enrollment: Enrollment): SignedEnvelope {
  // Only an enrolled agent that has checked the live HotSpot host may call this.
  const host = hostSchema.parse(context);
  bound(host, enrollment);
  const body = JSON.stringify(host);
  return { body, signature: sign("mesh-host-v1", body, enrollment.key) };
}
export function verifyHost(envelope: SignedEnvelope, enrollment: Enrollment, now: number) {
  const host = hostSchema.parse(unwrap("mesh-host-v1", envelope, enrollment.key));
  bound(host, enrollment);
  if (!Number.isSafeInteger(now) || host.checkedAt > now + 5 || host.checkedAt < now - 120) throw new Error("Mesh host attestation expired");
  return host;
}
export function createPaidOrder(input: {
  paymentId: string; amountKes: number; destination: string; durationSeconds: number;
  host: SignedEnvelope; enrollment: Enrollment; now: number; receipt: EngineSettlement;
}): SignedEnvelope {
  const host = verifyHost(input.host, input.enrollment, input.now);
  const id = uuid.parse(input.paymentId);
  const receipt = input.receipt;
  // Receipt must come from authenticated Engine getReceipt(), never a browser.
  if (receipt.paymentId !== id || receipt.reference !== `mesh-${id}` || receipt.amountKes !== input.amountKes ||
      receipt.destination !== input.destination || receipt.status !== "settled" || receipt.collectionConfirmed !== true ||
      receipt.verifiedBitcoinDelivery !== true || receipt.resolutionRequired || !receipt.sourceTransactionId ||
      !receipt.settledAt || !Number.isFinite(Date.parse(receipt.settledAt)) || !/^[a-f0-9]{64}$/.test(receipt.paymentHash ?? "")) throw new Error("Verified Bitcoin receipt required");
  if (!Number.isSafeInteger(input.durationSeconds) || input.durationSeconds < 1 || input.durationSeconds > 300) throw new Error("Mesh commissioning duration must be 1 to 300 seconds");
  const order = orderSchema.parse({ version: 1, purpose: "paid", paymentId: id,
    routerId: host.routerId, server: host.server, ticketId: host.ticketId, macAddress: host.macAddress,
    ipAddress: host.ipAddress, issuedAt: input.now, expiresAt: input.now + input.durationSeconds,
    username: `md-${id.replaceAll("-", "")}`, password: randomBytes(24).toString("base64url"),
    profile: "KM-MESH-DEADLINE-5M", rateLimit: "2M/2M", paymentHash: receipt.paymentHash, amountSats: receipt.amountSats });
  const body = JSON.stringify(order);
  return { body, signature: sign("mesh-order-v1", body, input.enrollment.key) };
}
export function verifyOrder(envelope: SignedEnvelope, enrollment: Enrollment, now: number): NativeAccessOrder {
  const order = orderSchema.parse(unwrap("mesh-order-v1", envelope, enrollment.key));
  bound(order, enrollment);
  if (!Number.isSafeInteger(now) || now < order.issuedAt - 5 || now >= order.expiresAt ||
      order.expiresAt <= order.issuedAt || order.expiresAt - order.issuedAt > 300 ||
      order.username !== `md-${order.paymentId.replaceAll("-", "")}`) throw new Error("Mesh order expired or inconsistent");
  // Reuse the strict customer address validator; an order cannot target management.
  hostSchema.parse({ routerId: order.routerId, server: order.server, ticketId: order.ticketId,
    macAddress: order.macAddress, ipAddress: order.ipAddress, checkedAt: order.issuedAt });
  return order;
}

export function deadlineTag(expiresAt: number) {
  if (!Number.isSafeInteger(expiresAt) || expiresAt < 1_000_000_000 || expiresAt > 9_999_999_999) throw new Error("Invalid deadline epoch");
  return `mesh-deadline-v1:${expiresAt}`;
}
