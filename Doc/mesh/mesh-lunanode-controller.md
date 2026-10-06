# Mesh always-on controller

Commissioned 6 October 2026, Africa/Nairobi. Home pilot enrollment only.

The automatic-access controller now runs on a dedicated LunaNode VM rather
than the Windows laptop. The customer website stays at `wifi.afribit.africa`;
the controller status endpoint is
[mesh-core.afribit.africa/health](https://mesh-core.afribit.africa/health).
That status reports daemon liveness and recent cloud polling, not full purchase,
wallet, router or customer Internet readiness.

| Item | Commissioned value |
| --- | --- |
| VM | `mesh-core`, Toronto, Ubuntu 24.04 |
| Public address | `170.75.168.29` |
| Plan | `m.1s`: 1 GB RAM, 1 vCPU, 15 GB disk, 1,000 GB monthly bandwidth; USD 3.50/month at provisioning |
| Controller | Bundled Node daemon, systemd `mesh-controller`, unprivileged `mesh` user |
| Enrollment | Primary `KM-LAB-001` only; pinned SSH key and board serial |
| Private link | WireGuard: VM `10.254.30.1`, Primary `10.254.30.2` |
| Checkout context | Guest source IP retained over WireGuard; live MAC/IP observed on the router |
| Customer Internet | Primary's home Ethernet uplink; does not transit this VM |
| Laptop worker | `AfribitMeshAutomaticAccess` stopped and disabled |

Two acknowledged access-ledger records were copied byte-for-byte, verified with
SHA-256, and retained with their original deadlines and digests. No allowance
was reset or renewed during migration. The VM was staged in standby first;
only the active worker claims jobs. Pinned SSH identity and synchronized router
time were verified over the tunnel before activation.

## Customer route and security

The router-hosted welcome page remains available at
`http://10.30.0.1/mesh.html`. Its existing join URL is temporarily retained:
`http://10.20.0.10:8040/start`. A guest-interface-only destination NAT rule sends
that exact destination and port to the VM's private WireGuard endpoint. This
keeps the laptop out of the controller path while preserving the customer's
source IP. A later release should replace this legacy address with a properly
commissioned HTTPS join name; HTTP on an open customer WLAN is a remaining
production limitation.

The overlay consists only of `mesh:cloud:join-dnat`, `join-garden`, `join-out`
and `join-return`. No customer source NAT, HotSpot IP bypass, broad private
subnet exception or default-route change was introduced. The public VM does
not expose port 8040. Its OS firewall accepts that port only on WireGuard from
the guest subnet. Router SSH remains limited to the laptop management IP and
the exact private controller IP, with an independent input firewall rule.

SSH on the VM uses a dedicated pinned key, disables password/root login and
allows the operator's commissioning public IP only. If that IP changes, use
authenticated LunaNode console/security-group management to update the exact
operator source; do not open SSH to the world. Caddy provides automatic HTTPS.
Node/Python run under systemd with automatic restart and memory restrictions.

Only router credentials and the scoped gateway service key live on this VM.
Paystack, Bitika, Blink and Engine treasury credentials remain in their existing
server-side payment components. Customer identity is read from the actual router
session, not a browser-supplied MAC or forwarded header.

## Recovery

Private commissioning evidence is in ignored
`artifacts/mesh-lab/private/lunanode/`. It includes the dedicated SSH key,
host-key pin, VM identifiers, pre-cutover router export, old task status, ledger
hashes and cutover evidence. Keep this directory protected; do not publish it.

For controller failure, first inspect `systemctl status mesh-controller`, the
public health endpoint, WireGuard handshake age and the pinned router check.
Inspect only safe service logs; never dump `/etc/mesh/agent.env`.

If restoring the laptop worker, stop the cloud worker first. Reconcile/copy the
latest VM ledger before starting the old worker; never delete locks or reset
deadlines to make a handoff pass. Remove only the four `mesh:cloud:join-*`
overlay rules from NAT, filter and HotSpot walled-garden IP tables. Then restore
the laptop task's prior enabled/running state. Leave the management tunnel and
unrelated router policies intact. Do not import a full export over a serving
router as a rollback shortcut.

## Acceptance and scope

- HTTPS certificate and JSON health response: verified.
- Cloud worker active, laptop task disabled: verified.
- WireGuard, pinned SSH and synchronized router clock: verified.
- Two retained access records: matching hashes.
- Payment regression suite: 36 passed; automatic-access suite: 32 passed.
- Phone catalogue through the new private join path: operator confirmed opening
  before the latency update; repeat timing on the new release remains pending.
- VM reboot recovery: verified at 13:57 EAT. Boot ID changed; controller,
  WireGuard and Caddy recovered automatically; trusted HTTPS and pinned router
  SSH were verified after recovery.
- New live Bitika collection/Bitcoin settlement: pending; Paystack stays active.

This commissions an always-on control point. It does not migrate laptop-hosted
media/relays, enroll Node2/3WEST, provide cloud-free checkout, or establish a
resilient multi-gateway mesh. When WAN fails, the router-hosted page and permitted
local services can remain reachable; new online payments and this cloud
controller cannot operate until connectivity returns. Local controllers and
service hosts can be introduced later with explicit ownership and synchronization.

The current controller release is `cloud-pilot-20261006-fast-join`. It reuses a
pinned read-only SSH transport, with a fresh router/guest observation for every
join; it never reuses a cached device binding. Provisioning and allowance
accounting remain separate. The initial authenticated observation took about
3.5–3.8 seconds; subsequent transport-reused lookups took about one second.
The latter diagnostic had no connected guest, so successful phone opening time
is still awaiting acceptance. See [measurements and recovery](mesh-catalogue-latency.md).

Before field cutover, finish physical checkout/expiry/recovery acceptance,
deploy the pending website hardening, reconcile the 3WEST plan semantics and
bandwidth, prove guest isolation, rotate exposed credentials, and establish
backup/restore and monitoring. Existing 3WEST service has not been modified.
