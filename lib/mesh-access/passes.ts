import { createHmac, randomInt, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { meshAccessContexts, meshDeviceCodes, meshPassDevices, meshPasses } from "../db/schema";
import { readMeshAccessConfig } from "./config";
import { accessOrderSchema, type MeshAutomaticOrder } from "./model";
import { decryptAccess, encryptAccess, freshToken, hashToken } from "./security";

// A pass is what the customer bought: a deadline, limits, a code and up to
// deviceLimit device slots. Each slot has at most one live router order. When
// a phone changes its MAC/IP, or a household moves a slot to a new device,
// the old order is revoked on the router before the replacement is handed
// out, and the original deadline is kept: time and data never restart.
export const meshDeviceCookieName = "mesh_device";
export const passKinds = ["personal", "household", "tv"] as const;
export type PassKind = (typeof passKinds)[number];
export const MAX_DEVICE_LIMIT = 10;
const MOVES_PER_DAY = 6;
const liveStatuses = sql`('queued','claimed','active')`;

export class PassError extends Error {
  constructor(message: string, readonly status = 409, readonly devices?: PassDeviceSummary[]) { super(message); }
}
export type PassDeviceSummary = { id: string; slot: number; label: string; lastBoundAt: string; current: boolean };
type Pass = typeof meshPasses.$inferSelect;
type Context = typeof meshAccessContexts.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function keyed(domain: string, value: string) {
  return createHmac("sha256", Buffer.from(readMeshAccessConfig().encryptionKey, "base64")).update(`${domain}\n${value}`).digest("hex");
}
export const normalizeCode = (value: string) => value.replace(/\D/g, "");
export const passCodeHash = (code: string) => keyed("mesh-pass-code-v1", normalizeCode(code));
export const deviceCodeHash = (code: string) => keyed("mesh-device-code-v1", normalizeCode(code));
export const deviceKeyHash = (key: string) => hashToken(`mesh-device-v1:${key}`);
export const isDeviceKey = (value: string | undefined): value is string => /^[A-Za-z0-9_-]{43}$/.test(value ?? "");
export const newDeviceKey = freshToken;
const digits = (length: number) => Array.from({ length }, () => randomInt(10)).join("");
export function formatPassCode(code: string) { const c = normalizeCode(code); return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6)}`; }
export function readDeviceKey(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${meshDeviceCookieName}=`))?.slice(meshDeviceCookieName.length + 1);
  return isDeviceKey(value) ? value : null;
}
export function packageDeviceRules(kind: unknown, limit: unknown) {
  const safeKind: PassKind = passKinds.includes(kind as PassKind) ? kind as PassKind : "personal";
  const safeLimit = Number.isInteger(limit) && Number(limit) >= 1 && Number(limit) <= MAX_DEVICE_LIMIT ? Number(limit) : 1;
  return { kind: safeKind, deviceLimit: safeKind === "household" ? Math.max(2, safeLimit) : 1 };
}

// Turns each live order that predates passes, or was just created by a
// payment or voucher, into slot 1 of a new pass. Idempotent; safe to call on
// every controller poll. One statement per order, so a pass never exists
// without its first device and order link.
export async function ensurePasses(limit = 20) {
  const config = readMeshAccessConfig();
  const candidates = await db.execute(sql`
    SELECT o.id, o.expires_at, o.payment_id, o.voucher_id, g.data_limit_mb, g.speed_limit_kbps,
      c.mac_address, c.device_key_hash,
      COALESCE(p.metadata->'pass'->>'kind', pk.kind, 'personal') AS kind,
      COALESCE(p.metadata->'pass'->>'deviceLimit', pk.device_limit::text, '1') AS device_limit,
      p.metadata->>'payerDeviceKeyHash' AS payer_device_key_hash
    FROM mesh_access_orders o JOIN access_grants g ON g.id=o.grant_id JOIN mesh_access_contexts c ON c.id=o.context_id
    LEFT JOIN payments p ON p.id=o.payment_id
    LEFT JOIN vouchers v ON v.id=o.voucher_id LEFT JOIN voucher_batches b ON b.id=v.batch_id
    LEFT JOIN packages pk ON pk.id=COALESCE(p.package_id,b.package_id)
    WHERE o.router_id=${config.routerId} AND o.pass_device_id IS NULL AND o.expires_at > now()
      AND o.status IN ('queued','claimed','active')
      AND NOT EXISTS(SELECT 1 FROM mesh_passes mp WHERE mp.origin_order_id=o.id)
      AND (o.payment_id IS NULL OR NOT EXISTS(SELECT 1 FROM mesh_passes mp WHERE mp.payment_id=o.payment_id))
    ORDER BY o.created_at LIMIT ${limit}`);
  let created = 0;
  for (const row of candidates.rows) {
    const rules = packageDeviceRules(row.kind, Number(row.device_limit));
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = digits(10), passId = randomUUID(), deviceId = randomUUID();
      try {
        const result = await db.execute(sql`
          WITH pass AS (
            INSERT INTO mesh_passes(id,router_id,kind,device_limit,origin_order_id,payment_id,voucher_id,code_hash,code_ciphertext,
              payer_device_key_hash,expires_at,data_limit_mb,speed_limit_kbps)
            VALUES(${passId}::uuid,${config.routerId},${rules.kind},${rules.deviceLimit},${String(row.id)}::uuid,
              ${row.payment_id ? String(row.payment_id) : null}::uuid,${row.voucher_id ? String(row.voucher_id) : null}::uuid,
              ${passCodeHash(code)},${encryptAccess({ code }, config)},${row.payer_device_key_hash ? String(row.payer_device_key_hash) : null},
              ${new Date(String(row.expires_at)).toISOString()}::timestamptz,${row.data_limit_mb === null ? null : Number(row.data_limit_mb)}::integer,
              ${Number(row.speed_limit_kbps ?? 2000)})
            ON CONFLICT (origin_order_id) DO NOTHING RETURNING id
          ), device AS (
            INSERT INTO mesh_pass_devices(id,pass_id,slot,device_key_hash,label,mac_address)
            SELECT ${deviceId}::uuid,id,1,${row.device_key_hash ? String(row.device_key_hash) : null},
              ${rules.kind === "tv" ? "TV" : "Device 1"},${String(row.mac_address)} FROM pass RETURNING id
          ) UPDATE mesh_access_orders SET pass_device_id=(SELECT id FROM device),updated_at=now()
            WHERE id=${String(row.id)}::uuid AND pass_device_id IS NULL AND EXISTS(SELECT 1 FROM device) RETURNING id`);
        created += result.rows.length;
        break;
      } catch (error) {
        // A ten-digit code collision is retried; anything else waits for the next poll.
        if (!/code_hash/.test(String((error as { constraint?: string }).constraint ?? (error as Error).message))) break;
      }
    }
  }
  return created;
}

type LiveOrder = { id: string; status: string; mac_address: string; ip_address: string; grant_id: string };
async function liveOrderFor(tx: Tx, deviceId: string): Promise<LiveOrder | null> {
  const rows = await tx.execute(sql`SELECT o.id,o.status,o.grant_id,c.mac_address,c.ip_address FROM mesh_access_orders o
    JOIN mesh_access_contexts c ON c.id=o.context_id WHERE o.pass_device_id=${deviceId}::uuid AND o.status IN ${liveStatuses}
    AND o.expires_at > now() LIMIT 1`);
  return (rows.rows[0] as LiveOrder | undefined) ?? null;
}
async function lockPass(tx: Tx, passId: string): Promise<Pass> {
  const rows = await tx.execute(sql`SELECT id FROM mesh_passes WHERE id=${passId}::uuid AND revoked_at IS NULL AND expires_at > now() + interval '60 seconds' FOR UPDATE`);
  if (!rows.rows.length) throw new PassError("This pass has ended", 410);
  const [pass] = await tx.select().from(meshPasses).where(eq(meshPasses.id, passId)).limit(1);
  return pass;
}

// Points one device slot at a router-attested context. The old order goes to
// 'revoking' first; the controller disables it on the router before it is
// given the replacement (see claimMeshOrders). The deadline is the pass's.
async function bindSlot(tx: Tx, pass: Pass, input: { deviceId?: string; slot?: number; label?: string; context: Context; deviceKeyHash?: string | null; countMove: boolean }) {
  const config = readMeshAccessConfig();
  const { context } = input;
  if (context.routerId !== pass.routerId || context.routerId !== config.routerId) throw new PassError("This pass belongs to another Mesh network", 403);
  const busy = await tx.execute(sql`SELECT o.id FROM mesh_access_orders o JOIN mesh_access_contexts c ON c.id=o.context_id
    WHERE o.router_id=${config.routerId} AND c.mac_address=${context.macAddress} AND o.status IN ${liveStatuses} AND o.expires_at > now()
    AND (o.pass_device_id IS NULL OR o.pass_device_id IS DISTINCT FROM ${input.deviceId ?? null}::uuid) LIMIT 1`);
  if (busy.rows.length) throw new PassError("This device already has internet on another pass");
  if (input.countMove) {
    const windowOpen = Date.now() - pass.movesWindowStartedAt.getTime() < 86_400_000;
    if (windowOpen && pass.movesInWindow >= MOVES_PER_DAY) throw new PassError("This pass has moved too many times today. Try again tomorrow.", 429);
    await tx.update(meshPasses).set(windowOpen ? { movesInWindow: pass.movesInWindow + 1 } : { movesInWindow: 1, movesWindowStartedAt: new Date() })
      .where(eq(meshPasses.id, pass.id));
  }
  let deviceId = input.deviceId;
  if (deviceId) {
    const previous = await liveOrderFor(tx, deviceId);
    if (previous) await tx.execute(sql`UPDATE mesh_access_orders SET status='revoking',updated_at=now() WHERE id=${previous.id}::uuid`);
    await tx.update(meshPassDevices).set({ macAddress: context.macAddress, lastBoundAt: new Date(),
      ...(input.deviceKeyHash ? { deviceKeyHash: input.deviceKeyHash } : {}), ...(input.label ? { label: input.label } : {}) })
      .where(eq(meshPassDevices.id, deviceId));
  } else {
    deviceId = randomUUID();
    await tx.insert(meshPassDevices).values({ id: deviceId, passId: pass.id, slot: input.slot!, label: input.label ?? `Device ${input.slot}`,
      deviceKeyHash: input.deviceKeyHash ?? null, macAddress: context.macAddress });
  }
  const remainingMs = pass.expiresAt.getTime() - Date.now();
  const id = randomUUID(), grantId = randomUUID();
  const order: MeshAutomaticOrder = accessOrderSchema.parse({ id, routerId: config.routerId, server: config.server,
    macAddress: context.macAddress, ipAddress: context.ipAddress, user: `ma-${id.replaceAll("-", "")}`, password: freshToken(),
    expiresAt: pass.expiresAt.toISOString(), durationMinutes: Math.min(44_640, Math.ceil(remainingMs / 60_000)),
    dataLimitMb: pass.dataLimitMb, speedLimitKbps: pass.speedLimitKbps,
    ...(pass.paymentId ? { paymentId: pass.paymentId } : { voucherId: pass.voucherId! }) });
  await tx.execute(sql`INSERT INTO access_grants(id,payment_id,voucher_id,mac_address,status,starts_at,expires_at,data_limit_mb,speed_limit_kbps,purpose)
    VALUES(${grantId}::uuid,${pass.paymentId}::uuid,${pass.voucherId}::uuid,${context.macAddress},'pending',now(),${pass.expiresAt.toISOString()}::timestamptz,
      ${pass.dataLimitMb}::integer,${pass.speedLimitKbps},'pass-device')`);
  await tx.execute(sql`INSERT INTO mesh_access_orders(id,context_id,router_id,payment_id,voucher_id,grant_id,encrypted_order,expires_at,pass_device_id)
    VALUES(${id}::uuid,${context.id}::uuid,${config.routerId},${pass.paymentId}::uuid,${pass.voucherId}::uuid,${grantId}::uuid,
      ${encryptAccess(order, config)},${pass.expiresAt.toISOString()}::timestamptz,${deviceId}::uuid)`);
  return { grantId, deviceId };
}

async function devicesOf(tx: Tx | typeof db, passId: string, currentKey?: string | null): Promise<PassDeviceSummary[]> {
  const rows = await tx.select().from(meshPassDevices).where(and(eq(meshPassDevices.passId, passId), sql`${meshPassDevices.removedAt} IS NULL`))
    .orderBy(meshPassDevices.slot);
  return rows.map(row => ({ id: row.id, slot: row.slot, label: row.label, lastBoundAt: row.lastBoundAt.toISOString(),
    current: Boolean(currentKey && row.deviceKeyHash === currentKey) }));
}

// Same-device recovery after a DHCP/IP change (router-attested MAC matches a
// slot) or a MAC change (httpOnly device key matches a slot). Returns the
// grant to watch, or null when this device holds no live pass.
export async function restoreDevicePass(context: Context, keyHash: string | null) {
  await ensurePasses();
  const owned = await db.execute(sql`SELECT d.id,d.pass_id,(d.device_key_hash IS NOT DISTINCT FROM ${keyHash}) AS by_key
    FROM mesh_pass_devices d JOIN mesh_passes p ON p.id=d.pass_id
    WHERE (d.device_key_hash=${keyHash} OR d.mac_address=${context.macAddress}) AND d.removed_at IS NULL AND p.revoked_at IS NULL
    AND p.router_id=${context.routerId} AND p.expires_at > now() + interval '60 seconds'
    ORDER BY (d.device_key_hash IS NOT DISTINCT FROM ${keyHash}) DESC, p.expires_at DESC LIMIT 1`);
  const row = owned.rows[0];
  if (!row) return null;
  return db.transaction(async tx => {
    const pass = await lockPass(tx, String(row.pass_id));
    const live = await liveOrderFor(tx, String(row.id));
    if (live && live.mac_address === context.macAddress && live.ip_address === context.ipAddress) {
      // Same router-attested device in another browser (the iPhone sign-in
      // window and Safari keep separate cookies): let this browser see the pass.
      if (keyHash) await tx.update(meshPassDevices).set({ deviceKeyHash: keyHash }).where(eq(meshPassDevices.id, String(row.id)));
      return { grantId: live.grant_id, restored: false };
    }
    const bound = await bindSlot(tx, pass, { deviceId: String(row.id), context, deviceKeyHash: keyHash, countMove: false });
    return { grantId: bound.grantId, restored: true };
  });
}

// The pass code works on any device on the same Mesh network: it restores a
// slot this device already holds, fills a free slot, moves a one-device pass,
// or replaces a chosen slot of a full household pass.
export async function redeemPassCode(context: Context, input: { code: string; keyHash: string | null; replaceDeviceId?: string; label?: string }) {
  await ensurePasses();
  const [found] = await db.select({ id: meshPasses.id }).from(meshPasses).where(eq(meshPasses.codeHash, passCodeHash(input.code))).limit(1);
  if (!found) throw new PassError("That pass code was not found. Check the numbers.", 404);
  return attachToPass(found.id, context, { keyHash: input.keyHash, replaceDeviceId: input.replaceDeviceId, label: input.label });
}

async function attachToPass(passId: string, context: Context, input: { keyHash: string | null; replaceDeviceId?: string; label?: string }) {
  return db.transaction(async tx => {
    const pass = await lockPass(tx, passId);
    const devices = await tx.select().from(meshPassDevices).where(and(eq(meshPassDevices.passId, pass.id), sql`${meshPassDevices.removedAt} IS NULL`));
    const same = devices.find(device => input.keyHash && device.deviceKeyHash === input.keyHash) ?? devices.find(device => device.macAddress === context.macAddress);
    if (same) {
      const live = await liveOrderFor(tx, same.id);
      if (live && live.mac_address === context.macAddress && live.ip_address === context.ipAddress) return { grantId: live.grant_id, passId: pass.id };
      return { ...(await bindSlot(tx, pass, { deviceId: same.id, context, deviceKeyHash: input.keyHash, countMove: same.macAddress !== context.macAddress })), passId: pass.id };
    }
    const used = new Set(devices.map(device => device.slot));
    const free = Array.from({ length: pass.deviceLimit }, (_, index) => index + 1).find(slot => !used.has(slot));
    if (free) return { ...(await bindSlot(tx, pass, { slot: free, label: input.label, context, deviceKeyHash: input.keyHash, countMove: false })), passId: pass.id };
    const replace = pass.deviceLimit === 1 ? devices[0] : devices.find(device => device.id === input.replaceDeviceId);
    if (!replace) throw new PassError(`This pass already has ${pass.deviceLimit} devices. Choose one to replace.`, 409, await devicesOf(tx, pass.id, input.keyHash));
    return { ...(await bindSlot(tx, pass, { deviceId: replace.id, label: input.label, context, deviceKeyHash: input.keyHash, countMove: true })), passId: pass.id };
  });
}

// What a device sees on "My pass": passes it is a slot of, or bought for others.
export async function passesForDevice(keyHash: string) {
  await ensurePasses();
  const config = readMeshAccessConfig();
  const rows = await db.execute(sql`SELECT DISTINCT p.* FROM mesh_passes p LEFT JOIN mesh_pass_devices d ON d.pass_id=p.id AND d.removed_at IS NULL
    WHERE p.router_id=${config.routerId} AND p.revoked_at IS NULL AND p.expires_at > now()
    AND (d.device_key_hash=${keyHash} OR p.payer_device_key_hash=${keyHash}) ORDER BY p.expires_at DESC LIMIT 5`);
  return Promise.all(rows.rows.map(async row => {
    const code = decryptAccess<{ code: string }>(String(row.code_ciphertext), config).code;
    return { id: String(row.id), kind: String(row.kind) as PassKind, deviceLimit: Number(row.device_limit),
      expiresAt: new Date(String(row.expires_at)).toISOString(), code: formatPassCode(code),
      speedLimitKbps: Number(row.speed_limit_kbps), devices: await devicesOf(db, String(row.id), keyHash) };
  }));
}
async function assertOwner(passId: string, keyHash: string) {
  const rows = await db.execute(sql`SELECT 1 FROM mesh_passes p WHERE p.id=${passId}::uuid AND (p.payer_device_key_hash=${keyHash}
    OR EXISTS(SELECT 1 FROM mesh_pass_devices d WHERE d.pass_id=p.id AND d.removed_at IS NULL AND d.device_key_hash=${keyHash}))`);
  if (!rows.rows.length) throw new PassError("Open My pass on a device that uses this pass", 403);
}

// Owner adds the device that shows a device code (TV, child's phone).
export async function addDeviceByCode(input: { passId: string; ownerKeyHash: string; deviceCode: string; replaceDeviceId?: string; label?: string }) {
  await assertOwner(input.passId, input.ownerKeyHash);
  const target = await resolveDeviceCode(input.deviceCode);
  const result = await attachToPass(input.passId, target, { keyHash: target.deviceKeyHash, replaceDeviceId: input.replaceDeviceId, label: input.label });
  await db.update(meshDeviceCodes).set({ usedAt: new Date() }).where(eq(meshDeviceCodes.contextId, target.id));
  return result;
}

export async function removeDevice(input: { passId: string; ownerKeyHash: string; deviceId: string }) {
  await assertOwner(input.passId, input.ownerKeyHash);
  await db.transaction(async tx => {
    await lockPass(tx, input.passId);
    const removed = await tx.update(meshPassDevices).set({ removedAt: new Date() })
      .where(and(eq(meshPassDevices.id, input.deviceId), eq(meshPassDevices.passId, input.passId), sql`${meshPassDevices.removedAt} IS NULL`)).returning({ id: meshPassDevices.id });
    if (!removed.length) throw new PassError("That device is not on this pass", 404);
    await tx.execute(sql`UPDATE mesh_access_orders SET status='revoking',updated_at=now() WHERE pass_device_id=${input.deviceId}::uuid AND status IN ${liveStatuses}`);
  });
}

// A code the unpaid device shows so someone else can pay for it or add it.
export async function createDeviceCode(context: Context) {
  await db.delete(meshDeviceCodes).where(eq(meshDeviceCodes.contextId, context.id));
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = digits(6);
    const inserted = await db.insert(meshDeviceCodes).values({ codeHash: deviceCodeHash(code), contextId: context.id,
      expiresAt: new Date(Date.now() + 30 * 60_000) }).onConflictDoNothing().returning({ codeHash: meshDeviceCodes.codeHash });
    if (inserted.length) return { code, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() };
  }
  throw new PassError("Could not create a device code. Try again.", 503);
}
export async function resolveDeviceCode(code: string): Promise<Context> {
  const config = readMeshAccessConfig();
  if (!/^\d{6}$/.test(normalizeCode(code))) throw new PassError("Enter the 6-digit code shown on the other device", 400);
  const rows = await db.execute(sql`SELECT c.id FROM mesh_device_codes d JOIN mesh_access_contexts c ON c.id=d.context_id
    WHERE d.code_hash=${deviceCodeHash(code)} AND d.used_at IS NULL AND d.expires_at > now()
    AND c.router_id=${config.routerId} AND c.joined_at IS NOT NULL AND c.expires_at > now() LIMIT 1`);
  if (!rows.rows.length) throw new PassError("That device code has expired or is wrong. Ask for the code on the screen again.", 404);
  const [context] = await db.select().from(meshAccessContexts).where(eq(meshAccessContexts.id, String(rows.rows[0].id))).limit(1);
  return context;
}

// Revocations the controller must confirm on the router before replacements
// for the same slot are released.
export async function claimMeshRevocations() {
  const config = readMeshAccessConfig(), token = freshToken();
  const rows = await db.execute(sql`
    UPDATE mesh_access_orders SET revoke_claim_token_hash=${hashToken(token)},revoke_claimed_at=now(),updated_at=now()
    WHERE id IN (SELECT id FROM mesh_access_orders WHERE router_id=${config.routerId} AND status='revoking'
      AND (revoke_claimed_at IS NULL OR revoke_claimed_at < now()-interval '60 seconds') ORDER BY updated_at LIMIT 5 FOR UPDATE SKIP LOCKED)
    RETURNING id`);
  return rows.rows.map(row => ({ id: String(row.id), claimToken: token, user: `ma-${String(row.id).replaceAll("-", "")}` }));
}
export async function completeMeshRevocation(id: string, claimToken: string) {
  const config = readMeshAccessConfig();
  const rows = await db.execute(sql`
    WITH revoked AS (UPDATE mesh_access_orders SET status='revoked',updated_at=now() WHERE id=${id}::uuid AND router_id=${config.routerId}
      AND status='revoking' AND revoke_claim_token_hash=${hashToken(claimToken)} RETURNING grant_id)
    UPDATE access_grants SET status='revoked',updated_at=now() WHERE id IN (SELECT grant_id FROM revoked) RETURNING id`);
  return rows.rows.length === 1;
}

// The pass this device last used, if it ended in the last day and nothing
// live replaced it. Lets the Mesh page say "your pass ended" instead of
// looking like a lost connection.
export async function recentlyEndedPass(context: Pick<Context, "macAddress" | "routerId" | "deviceKeyHash">) {
  const rows = await db.execute(sql`SELECT p.kind, COALESCE(pay.metadata->>'packageName', '') AS package_name,
      COALESCE(p.revoked_at, p.expires_at) AS ended_at, p.revoked_at IS NOT NULL AND p.revoked_at < p.expires_at AS early
    FROM mesh_pass_devices d JOIN mesh_passes p ON p.id=d.pass_id LEFT JOIN payments pay ON pay.id=p.payment_id
    WHERE (d.mac_address=${context.macAddress} OR d.device_key_hash=${context.deviceKeyHash ?? null}) AND p.router_id=${context.routerId}
      AND COALESCE(p.revoked_at, p.expires_at) <= now() AND COALESCE(p.revoked_at, p.expires_at) > now() - interval '24 hours'
      AND NOT EXISTS (SELECT 1 FROM mesh_pass_devices d2 JOIN mesh_passes p2 ON p2.id=d2.pass_id
        WHERE (d2.mac_address=${context.macAddress} OR d2.device_key_hash=${context.deviceKeyHash ?? null}) AND d2.removed_at IS NULL
          AND p2.revoked_at IS NULL AND p2.expires_at > now())
    ORDER BY COALESCE(p.revoked_at, p.expires_at) DESC LIMIT 1`);
  const row = rows.rows[0];
  if (!row) return null;
  const endedAt = new Date(String(row.ended_at));
  // "2:03 pm", or "Sun 2:03 pm" when it ended more than half a day ago. Nairobi time.
  const endedAtLabel = endedAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", hour: "numeric", minute: "2-digit",
    ...(endedAt.getTime() < Date.now() - 12 * 3_600_000 ? { weekday: "short" as const } : {}) });
  return { kind: String(row.kind) as PassKind, packageName: String(row.package_name), endedAt, endedAtLabel, early: row.early === true };
}

// Whether the router has switched this device on: an activated order for its
// Wi-Fi address that hasn't ended. A TV's code screen waits for this.
export async function deviceOnline(context: Pick<Context, "macAddress" | "routerId">) {
  const { rows: [row] } = await db.execute(sql`SELECT o.expires_at FROM mesh_access_orders o JOIN mesh_access_contexts c ON c.id=o.context_id
    WHERE c.mac_address=${context.macAddress} AND o.router_id=${context.routerId} AND o.status='active' AND o.expires_at > now()
    ORDER BY o.expires_at DESC LIMIT 1`);
  return row ? { online: true, expiresAt: new Date(String(row.expires_at)).toISOString() } : { online: false, expiresAt: null };
}
