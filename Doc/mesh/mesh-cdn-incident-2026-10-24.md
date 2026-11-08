# Mesh CDN request incident - 24 October 2026

## Finding

The dominant observed source is the dedicated LunaNode Mesh controller, not a
static-image cache failure. It continued signed POST polling while the physical
network was disconnected. The active loop in `gateway-agent/mesh-daemon.ts`
slept only two seconds between cloud claims; stopping Windows lab processes did
not stop this independently hosted controller.

The operator's dashboard screenshot shows 898,102 team CDN requests, of which
746,202 belong to `bitcoin-valley-wifi`. These are screenshot values, not a new
billing export. CLI observability for the last-hour window found 1,762 requests
to `/api/mesh/gateway/jobs/claim` out of 1,817 project requests, about 97%.
A bounded request-log sample showed the same path returning 200 from a Node
client in Canada at approximately two-second intervals. About 42,000 requests
per day at this cadence explains the sustained plateau after commissioning;
the full historical total is not individually attributed by these samples.

Vercel's [CDN usage documentation](https://vercel.com/docs/manage-cdn-usage)
counts function and static-asset requests and identifies excessive polling as
an optimization target. Caching a signed, state-changing job-claim response
would be incorrect and would not stop the caller generating CDN requests.
No cache purge, project deletion or account-plan purchase was performed.

## Live containment

At **09:29:41 EAT / 06:29:41 UTC**, the provider accepted a stop of the exact
dedicated `mesh-core.afribit.africa` VM, verified against its saved VM ID,
hostname and IP. Subsequent provider inspection confirmed `shutoff`.
Its disk, TLS/tunnel configuration, private credentials and access ledger were
not deleted. No other VM or router was modified. Vercel and the database remain
running; the controller/join host is intentionally unavailable while paused.
New automatic purchases depend on a fresh controller heartbeat and must not be
represented as ready during this pause.

CLI request logs for **06:30:15-06:31:46 UTC** contained zero requests, including
zero controller polls, with no excluded intervals. Further post-stop evidence
is retained privately; zero in a bounded window is not a guarantee of zero
future public visitors or bots.

A later check covering **06:30:15-06:35:06 UTC** again returned zero request
records with no excluded intervals. Read-only database inspection found zero
unexpired native orders, zero initiated unresolved Bitika/Paystack payments and
zero fresh gateway heartbeats. No payment, settlement, allowance or customer
record was changed by these inspections.

The global Vercel CLI was updated from the installed older release to **65.2.0**.
The linked target was verified as `novyrix-teams/bitcoin-valley-wifi`, project
`prj_X8zLKF531FT2sGS4qdeLJ0RlvsGw`.

## Source correction and verification

The controller source now has:

- One-minute idle polling: 1,440 baseline claims/day rather than the theoretical
  43,200/day at two seconds, a 96.7% reduction in idle request rate. Work,
  completions, actual customer activity and public traffic are additional.
- A two-minute fast-poll window after a successfully attested join, with an
  immediate wake of an idle wait. Public/invalid join probes cannot activate it.
- Fast polling while actual jobs are returned; it returns to idle after the
  queue empties. Active workloads are not promised the idle budget.
- Exponential cloud/handoff-error backoff from 15 seconds to five minutes.
- Explicit `MESH_AGENT_MODE=paused`: no cloud polling and no customer join
  attestation. Standby remains a read-only one-minute readiness check, not a
  zero-traffic pause.
- Interruptible waits so process shutdown does not wait for the backoff timer.

Fresh access regression checks pass: **43 tests**, including five new polling
tests for a simulated idle day, bounded join activity, retry cap/reset,
zero-cloud paused mode and timer interruption. Type checking and lint pass.
The bundled controller builds successfully. All 16 separate security regression
tests and four controller-upgrade tests also passed.

The prepared bundle is under the ignored directory
`artifacts/mesh-lab/private/controller-nonce/20261024T063307Z/`, SHA-256:
`34b9c88e81e9ce79536a051b452b251e6664a33a24a64fc9dfc0596d3d49fe50`.

**The source patch is not installed on the VM.** Containment is the confirmed
live change. Vercel deployment alone cannot install the daemon: gateway sources
are excluded from its application upload. The stopped VM retains its previous
two-second polling executable and must not simply be restarted for service.

## Required safe resumption

1. Recover restricted administrator access using the provider console and an
   authorized VM login. SSH currently cannot connect because the operator's
   public IP changed from the original allowed `/32`. Both the LunaNode security
   group and guest UFW restrict SSH. Neither firewall was broadened by this
   incident response. Updating only the provider rule is insufficient.
2. Keep `mesh-controller` stopped/disabled during maintenance boot before it
   can resume old polling. Prepare this through the provider's console/recovery
   procedure; do not boot the old automatic service unattended. If an unavoidable
   brief boot is needed for recovery, monitor/contain its old polling immediately.
3. Back up the retained release pointer, environment and ledger. Install the
   reviewed new bundle with existing pinned adapters and nonce authentication;
   preserve customer/financial state and existing deadlines.
4. Set the new controller to `paused` initially and verify zero outbound cloud
   requests. Switch to active only when equipment and actual operations resume.
5. Revalidate private tunnel/SSH, live router observations, correct join and
   original allowance handling. Confirm idle request cadence and review the
   maximum cold discovery delay of one minute after the fast window ends.
   A long-delayed payment can otherwise wait until the next idle claim; keep
   customer progress honest. Event-driven notification is a later improvement.
6. Retain a cloud-controller pause procedure distinct from the Windows pause
   procedure. Do not restart competing laptop and cloud workers.

The earlier active-only nonce-upgrade script is not a recovery command for a
powered-off/paused VM: its health and expected-release guards must be respected.
Do not weaken them or automatically start the obsolete worker to make an
upgrade preflight green.

## Usage reset and observability limits

There is no usage-reset action in `vercel usage`; clearing the cache or
redeploying does not erase accumulated usage. The team API reports the **Hobby**
plan, active, without a billing-period field. Vercel's
[Hobby documentation](https://vercel.com/docs/plans/hobby) describes waiting for
the allowance window after a limit is exceeded; no exact reset date was inferred
from the screenshot or a missing billing period. Requests already consumed
remain in the usage history.

The CLI billing-cost query was unavailable for this team/range; this is not
zero usage. A 24-hour grouped observability query required Observability Plus;
the bounded one-hour metrics and request logs were available and sufficient to
identify the immediate source. No upgrade/add-on was purchased. Review the
hosting plan's production/commercial suitability separately before field sales.

Private raw logs, sampled metrics, provider before-state, team metadata and
containment record are in
`artifacts/mesh-lab/private/cdn-incident-2026-10-24/`. Keep these private; publish
only the sanitized findings. Preserve unrelated handbook/whitepaper work.
