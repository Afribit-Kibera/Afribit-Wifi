// Outbound request budget for the controller. Cache headers cannot reduce the
// CDN request count of an always-running signed POST poller.
export const MESH_POLL_INTERVALS = Object.freeze({
  active: 2_000,
  idle: 60_000,
  standby: 60_000,
  retry: 15_000,
  maxRetry: 300_000,
  activityWindow: 120_000,
});

export class MeshPollSchedule {
  private failures = 0;
  private activeUntil = 0;
  constructor(private readonly now: () => number = Date.now) {}

  activity() {
    // Only a successfully attested join should call this, never a public probe.
    this.activeUntil = this.now() + MESH_POLL_INTERVALS.activityWindow;
  }

  success(hasJobs: boolean, mode: "active" | "standby" | "paused") {
    this.failures = 0;
    if (mode !== "active") return MESH_POLL_INTERVALS.standby;
    if (hasJobs || this.now() < this.activeUntil) return MESH_POLL_INTERVALS.active;
    return MESH_POLL_INTERVALS.idle;
  }

  failure() {
    this.failures = Math.min(this.failures + 1, 6);
    return Math.min(MESH_POLL_INTERVALS.retry * 2 ** (this.failures - 1), MESH_POLL_INTERVALS.maxRetry);
  }
}

export function createMeshPollWaiter() {
  let wake: (() => void) | undefined;
  return {
    wake() { wake?.(); },
    wait(delay: number): Promise<void> {
      if (!Number.isFinite(delay) || delay < MESH_POLL_INTERVALS.active) throw new Error("Invalid Mesh polling delay");
      return new Promise(resolve => {
        const finish = () => { clearTimeout(timer); if (wake === finish) wake = undefined; resolve(); };
        const timer = setTimeout(finish, delay);
        wake = finish;
      });
    },
  };
}
