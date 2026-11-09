// Is Mesh's internet line up? Mesh itself (pages, passes, codes) runs on the
// local network and keeps working when the line is down; only buying passes
// needs the internet, because M-Pesa and Bitcoin payments do.
//
// Pages never wait on this: they read the last known state, and a check runs
// in the background at most every 20 seconds. Two failed checks in a row mark
// the line down, so one slow answer doesn't pause sales.
export type UplinkState = { online: boolean; since: number; checkedAt: number; failures: number };

// IP addresses, not names, so a DNS problem alone doesn't look like an outage.
const targets = ["https://1.1.1.1/cdn-cgi/trace", "https://8.8.8.8/"];
const checkEveryMs = 20_000;

let state: UplinkState = { online: true, since: Date.now(), checkedAt: 0, failures: 0 };
let running: Promise<UplinkState> | null = null;

// Only the live server checks. Tests and builds never reach the internet.
const enabled = () => process.env.NODE_ENV === "production" && process.env.MESH_UPLINK_PROBE !== "off";

export async function probeInternet(fetcher: typeof fetch = fetch, timeoutMs = 3_000) {
  for (const url of targets) {
    try {
      const response = await fetcher(url, { method: "HEAD", cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
      if (response.status < 500) return true;
    } catch { /* Try the next address. */ }
  }
  return false;
}

export function nextUplinkState(previous: UplinkState, reachable: boolean, now: number): UplinkState {
  if (reachable) return previous.online ? { ...previous, checkedAt: now, failures: 0 } : { online: true, since: now, checkedAt: now, failures: 0 };
  const failures = previous.failures + 1;
  if (previous.online && failures >= 2) return { online: false, since: now, checkedAt: now, failures };
  return { ...previous, checkedAt: now, failures };
}

function check() {
  running ??= probeInternet().then(reachable => {
    const before = state;
    state = nextUplinkState(state, reachable, Date.now());
    if (before.online && !state.online) console.warn("Internet line is down; pausing pass sales");
    if (!before.online && state.online) console.warn(`Internet line is back after ${Math.round((state.since - before.since) / 60_000)} min`);
    return state;
  }).finally(() => { running = null; });
  return running;
}

// The last known state, refreshed in the background.
export function internetStatus() {
  if (enabled() && Date.now() - state.checkedAt > checkEveryMs) void check();
  return { online: state.online, since: new Date(state.since) };
}

// For checkout: if the line was marked down, check again now before refusing,
// so a sale is never refused on old news.
export async function internetUpForCheckout() {
  if (!enabled() || state.online) return true;
  return (await check()).online;
}
