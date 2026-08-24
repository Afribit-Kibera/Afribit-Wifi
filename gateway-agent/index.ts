export {};

type GatewayJob = {
  id: string;
  type: "grant_access" | "revoke_access" | "sync_walled_garden";
  payload: Record<string, unknown>;
  attempt: number;
};

type RouterRecord = Record<string, string> & { ".id"?: string };

const config = {
  apiUrl: required("GATEWAY_API_URL").replace(/\/$/, ""),
  agentToken: required("GATEWAY_AGENT_TOKEN"),
  pollInterval: Number(process.env.GATEWAY_POLL_INTERVAL_MS ?? 5000),
  routerHost: required("MIKROTIK_HOST").replace(/\/$/, ""),
  routerUsername: required("MIKROTIK_USERNAME"),
  routerPassword: required("MIKROTIK_PASSWORD"),
  routerTls: process.env.MIKROTIK_USE_TLS !== "false",
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function gatewayRequest(path: string, init: RequestInit = {}) {
  return fetch(`${config.apiUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${config.agentToken}`, "Content-Type": "application/json", ...init.headers } });
}

async function routerRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const protocol = config.routerTls ? "https" : "http";
  const response = await fetch(`${protocol}://${config.routerHost}/rest${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${config.routerUsername}:${config.routerPassword}`).toString("base64")}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw new Error(`RouterOS ${init.method ?? "GET"} ${path} failed (${response.status}): ${(await response.text()).slice(0, 400)}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function managedRecords(path: string) {
  const records = await routerRequest<RouterRecord[]>(path);
  return records.filter((record) => record.comment?.startsWith("bitcoin-valley-wifi:"));
}

async function removeRecords(path: string, records: RouterRecord[]) {
  for (const record of records) {
    if (record[".id"]) await routerRequest(`${path}/${encodeURIComponent(record[".id"])}`, { method: "DELETE" });
  }
}

async function executeJob(job: GatewayJob) {
  if (job.type === "grant_access") {
    const accessGrantId = String(job.payload.accessGrantId);
    const macAddress = String(job.payload.macAddress);
    const ipAddress = typeof job.payload.ipAddress === "string" ? job.payload.ipAddress : undefined;
    const speedLimitKbps = typeof job.payload.speedLimitKbps === "number" ? job.payload.speedLimitKbps : undefined;
    await routerRequest("/ip/hotspot/ip-binding", { method: "PUT", body: JSON.stringify({ "mac-address": macAddress, ...(ipAddress ? { address: ipAddress } : {}), type: "bypassed", comment: `bitcoin-valley-wifi:grant:${accessGrantId}` }) });
    if (ipAddress && speedLimitKbps) {
      await routerRequest("/queue/simple", { method: "PUT", body: JSON.stringify({ name: `bv-${accessGrantId.slice(0, 8)}`, target: `${ipAddress}/32`, "max-limit": `${speedLimitKbps}k/${speedLimitKbps}k`, comment: `bitcoin-valley-wifi:grant:${accessGrantId}` }) });
    }
    return { binding: "created", queue: ipAddress && speedLimitKbps ? "created" : "not-required" };
  }
  if (job.type === "revoke_access") {
    const accessGrantId = String(job.payload.accessGrantId);
    const records = (await managedRecords("/ip/hotspot/ip-binding")).filter((record) => record.comment === `bitcoin-valley-wifi:grant:${accessGrantId}`);
    const queues = (await managedRecords("/queue/simple")).filter((record) => record.comment === `bitcoin-valley-wifi:grant:${accessGrantId}`);
    await removeRecords("/ip/hotspot/ip-binding", records);
    await removeRecords("/queue/simple", queues);
    return { removed: records.length, queuesRemoved: queues.length };
  }
  const sites = Array.isArray(job.payload.sites) ? job.payload.sites as Array<{ hostname: string; includeSubdomains: boolean }> : [];
  await removeRecords("/ip/hotspot/walled-garden", await managedRecords("/ip/hotspot/walled-garden"));
  for (const site of sites) {
    await routerRequest("/ip/hotspot/walled-garden", { method: "PUT", body: JSON.stringify({ "dst-host": site.includeSubdomains ? `*.${site.hostname}` : site.hostname, comment: `bitcoin-valley-wifi:free-site:${site.hostname}` }) });
    if (site.includeSubdomains) await routerRequest("/ip/hotspot/walled-garden", { method: "PUT", body: JSON.stringify({ "dst-host": site.hostname, comment: `bitcoin-valley-wifi:free-site:${site.hostname}` }) });
  }
  return { synchronized: sites.length };
}

async function poll() {
  try {
    const response = await gatewayRequest("/api/gateway/jobs/claim", { method: "POST" });
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`Gateway claim failed (${response.status})`);
    const job = await response.json() as GatewayJob;
    try {
      const result = await executeJob(job);
      await gatewayRequest(`/api/gateway/jobs/${job.id}/complete`, { method: "POST", body: JSON.stringify({ success: true, result }) });
      console.log(`Completed ${job.type} job ${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown gateway error";
      await gatewayRequest(`/api/gateway/jobs/${job.id}/complete`, { method: "POST", body: JSON.stringify({ success: false, error: message }) });
      console.error(`Failed ${job.type} job ${job.id}: ${message}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log("Bitcoin Valley WiFi gateway agent started");
  await poll();
  setInterval(poll, config.pollInterval);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
