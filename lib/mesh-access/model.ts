import { z } from "zod";

export const accessPackageSchema = z.object({
  durationMinutes: z.number().int().min(1).max(44_640),
  dataLimitMb: z.number().int().min(1).max(2_097_151).nullable().optional().default(null),
  speedLimitKbps: z.number().int().min(1).max(100_000).nullable().optional().transform(value => value ?? 2000),
});
export type AccessPackage = z.output<typeof accessPackageSchema>;
export function validateAccessPackage(value: unknown): AccessPackage {
  return accessPackageSchema.parse(value);
}

const uuid = z.string().uuid().refine(value => value === value.toLowerCase());
export const customerIpSchema = z.string().regex(/^10\.30\.0\.(?:[2-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-4])$/);
const macSchema = z.string().regex(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/)
  .refine(value => (Number.parseInt(value.slice(0, 2), 16) & 1) === 0 && value !== "00:00:00:00:00:00");

export const observedHostSchema = z.object({
  macAddress: macSchema, ipAddress: customerIpSchema, server: z.literal("KM-MESH-001"),
}).strict();
export type ObservedHost = z.infer<typeof observedHostSchema>;

export const accessOrderSchema = z.object({
  id: uuid, routerId: z.literal("KM-LAB-001"), server: z.literal("KM-MESH-001"),
  macAddress: macSchema, ipAddress: customerIpSchema,
  user: z.string().regex(/^ma-[a-f0-9]{32}$/), password: z.string().regex(/^[a-zA-Z0-9_-]{43}$/),
  expiresAt: z.string().datetime(), durationMinutes: accessPackageSchema.shape.durationMinutes,
  dataLimitMb: accessPackageSchema.shape.dataLimitMb,
  speedLimitKbps: accessPackageSchema.shape.speedLimitKbps,
  paymentId: uuid.optional(), voucherId: uuid.optional(),
}).strict().superRefine((order, context) => {
  if (order.user !== `ma-${order.id.replaceAll("-", "")}`) context.addIssue({ code: "custom", message: "Mesh order user mismatch" });
  if (Boolean(order.paymentId) === Boolean(order.voucherId)) context.addIssue({ code: "custom", message: "One payment or voucher is required" });
});
export type NativeAccessOrderV2 = z.output<typeof accessOrderSchema>;
export type AccessOrder = NativeAccessOrderV2;
export type MeshAutomaticOrder = NativeAccessOrderV2;

export function validateAccessOrder(value: unknown, now = Date.now()): NativeAccessOrderV2 {
  const order = accessOrderSchema.parse(value);
  const deadline = Date.parse(order.expiresAt);
  if (!Number.isSafeInteger(now) || !Number.isFinite(deadline) || deadline <= now ||
      deadline - now > order.durationMinutes * 60_000 + 5000) throw new Error("Mesh access order expired or deadline invalid");
  return order;
}

export const activeResultSchema = observedHostSchema.extend({
  active: z.literal(true), user: z.string(), expiresAt: z.string().datetime(),
}).strict();
export type ActiveResult = z.infer<typeof activeResultSchema>;
export function validateActiveResult(value: unknown, order: NativeAccessOrderV2): ActiveResult {
  const active = activeResultSchema.parse(value);
  if (active.macAddress !== order.macAddress || active.ipAddress !== order.ipAddress || active.server !== order.server ||
      active.user !== order.user || Date.parse(active.expiresAt) !== Date.parse(order.expiresAt)) throw new Error("Router session does not match the Mesh order");
  return active;
}
