import { z } from "zod";

// Read-only gateway health the controller reports about once a minute.
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const routerStatsSchema = z.object({
  resource: z.object({ cpuLoad: z.number().int().min(0).max(100), freeMemory: count, totalMemory: count, uptimeSeconds: count,
    version: z.string().max(40), board: z.string().max(40) }).strict(),
  hotspot: z.object({ hosts: count, active: count }).strict(),
  sessions: z.array(z.object({ user: z.string().max(64), ipAddress: z.string().max(15), macAddress: z.string().max(17),
    uptimeSeconds: count, bytesIn: count, bytesOut: count, idleSeconds: count }).strict()).max(60),
  interfaces: z.array(z.object({ name: z.string().max(32), rxBytes: count, txBytes: count }).strict()).max(16),
  wireguardHandshakeSeconds: z.array(count.nullable()).max(4),
}).strict();
export type RouterStats = z.infer<typeof routerStatsSchema>;
