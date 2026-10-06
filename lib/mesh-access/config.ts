export type MeshAccessConfig = { routerId: "KM-LAB-001"; server: "KM-MESH-001"; serviceKey: string; encryptionKey: string };
export function meshAutomaticAccessEnabled(env: Record<string, string | undefined> = process.env) {
  return env.MESH_AUTOMATIC_ACCESS_ENABLED === "true";
}
export function readMeshAccessConfig(env: Record<string, string | undefined> = process.env): MeshAccessConfig {
  if (!meshAutomaticAccessEnabled(env) || env.MESH_NATIVE_ACCESS_COMMISSIONED !== "true" ||
      (env.MESH_ACCESS_ROUTER_ID && env.MESH_ACCESS_ROUTER_ID !== "KM-LAB-001") ||
      !env.MESH_ROUTER_SERVICE_KEY || Buffer.byteLength(env.MESH_ROUTER_SERVICE_KEY) < 32 ||
      !env.MESH_ACCESS_ENCRYPTION_KEY || Buffer.from(env.MESH_ACCESS_ENCRYPTION_KEY, "base64").length !== 32) throw new Error("Automatic Mesh access is not configured");
  return { routerId: "KM-LAB-001", server: "KM-MESH-001", serviceKey: env.MESH_ROUTER_SERVICE_KEY, encryptionKey: env.MESH_ACCESS_ENCRYPTION_KEY };
}
export function meshAutomaticAccessReady(env: Record<string, string | undefined> = process.env) {
  try { readMeshAccessConfig(env); return true; } catch { return false; }
}
