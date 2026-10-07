# Mesh developer handoff

Release scope: the current application, always-on home-pilot controller and
Primary spare-router welcome assets. The serving 3WEST customer router has not
been cut over. Do not import lab network configuration into a serving site.

Release verification on 6 October 2026: 51 payment, 38 access, 10 production
guard and 16 security tests passed (115 total), plus lint, type checking and
production build. Runtime dependency audit reported zero known vulnerabilities.
These results are not a multi-client field stress test or independent pentest.
The live controller and its two router adapters matched local SHA-256 hashes;
all eleven scoped router welcome assets matched local source on readback.
The retained controller release is `nonce-security-20261006T183318Z`.
See the [published release record](mesh-release-2026-10-06.md) for source and
deployment identifiers. Hosted GitHub CI is blocked before execution by an
account billing issue; the operator must resolve billing and rerun it. Local
tests and Vercel's independent Git build passed.

## Start here

Repository: https://github.com/Afribit-Kibera/Afribit-Wifi (public).
Application: https://wifi.afribit.africa.
Controller: https://mesh-core.afribit.africa.
Vercel: `novyrix-teams/bitcoin-valley-wifi`.

Use the main-branch release commit; `git rev-parse HEAD` identifies the source
you checked out. Read the root [README](../../README.md),
[pilot decision](mesh-pilot-readiness-and-device-plans.md),
[security release](mesh-security-release-2026-10-06.md) and
[operations runbook](mesh-production-operations.md) before operating it.

## Source map

| Area | Entry points | Responsibility |
| --- | --- | --- |
| Welcome/catalogue | `app/page.tsx`, `components/portal-experience.tsx`, `app/mesh-portal.css` | Mobile welcome, passes and free resources |
| Payment completion | `components/payment-status.tsx`, `components/mesh-online-success.tsx`, `lib/payments/` | Prompt, verification and activation; Bitika first, backend fallback |
| Payment API | `app/api/payments/`, `app/api/webhooks/` | Server verification and durable payment transitions |
| Device access | `app/api/mesh/`, `lib/mesh-access/` | Trusted context, nonces, orders and acknowledgements |
| Controller | `gateway-agent/mesh-daemon.ts`, `mesh-router.py`, `mesh-observer.py` | Durable reconciliation and enrolled-router management |
| Vouchers/admin | `app/admin/`, `lib/voucher-lookup.ts`, `lib/voucher-rate-limit.ts` | Passkeys, encrypted codes and attempt budgets |
| Schema | `lib/db/schema.ts`, `scripts/mesh/*schema.sql` | Durable payment/access state and additive migrations |
| Router welcome | `mikrotik/hotspot-mesh/`, `scripts/mesh/install-persistent-portal.py` | Backed-up asset upload and readback |
| Verification | `tests/`, `.github/workflows/ci.yml` | Payment, activation, production guards and security |

## Credentials and durable state

The operator supplies deployment access and development credentials privately.
`.env.example` documents keys, with integrations disabled by default. Router
credentials belong on the controller, never in Vercel. The controller uses
`/etc/mesh/agent.env`, `/var/lib/mesh/automatic-access` for the durable ledger and
`/opt/mesh/current` for the selected release.

Preserve the database, ledger, encryption/lookup keys, SSH pins and provider
references across upgrades. Key changes without migration can invalidate issued
vouchers or stored grants. Private operator evidence, `.env*`, VM keys and
payment payloads must stay out of the public repository. `artifacts/` is absent
from developer clones by design.

## Release and recovery

1. Install with `npm ci`; run the root README's verification commands. CI uses
   fixtures without production credentials or payments.
2. Review additive schema changes separately. The installed nonce replay table
   is required by the strict API; follow the
   [ordered rollout/rollback](mesh-agent-replay-protection.md). Do not run
   `db:push` or `db:seed` as a production migration procedure.
3. Inspect the Vercel target, deploy, then verify alias health and bounded
   security checks. A build does not prove router connectivity or activation.
4. Compare the controller bundle and router adapters before updating the VM.
   `scripts/mesh/upgrade-controller-nonce.py` prepares by default; guarded apply
   requires the expected active release. Preserve environment, TLS proxy,
   tunnel, adapters and ledger. Do not rerun initial provisioning/cutover
scripts against the commissioned server.
5. Inspect router assets with `scripts/mesh/install-persistent-portal.py`;
   `--apply` writes its scoped backed-up assets. This does not enroll a field
   gateway or commission production plan policy.
6. Verify controller cloud connectivity, signed request acceptance and replay
   rejection, router asset readback and provider readiness. Physical acceptance
   needs an unpaid phone joining, catalogue opening, an explicitly authorized
   purchase, activation and deadline expiry. Never blindly repeat a payment
   whose outcome is uncertain.

Roll back application/controller versions as a compatible pair. A nonce-less
old agent cannot talk to the strict API. Preserve payment records and ledger;
do not reissue payments or Bitcoin transfers to repair access.
[Paid-incident procedure](mesh-bitika-pending-ack-incident-2026-10-06.md).

## Work remaining before field rollout

- Match reference plans at 3 Mbps symmetric versus the lab's 50 Mbps caps.
  Explicitly match connected-use allowances and wall-clock validity. Screenshot
  parity is not a customer migration.
- Implement sponsored TV binding/recovery and family parent entitlement, device
  slots and aggregate quotas. Changing `shared-users` alone is insufficient.
- Test 5 then 10 simultaneous real clients, radio airtime, gateway CPU, payment
  concurrency, outages and restores. These are proposed tests, not validated
  capacity limits. No full field stress test has been completed.
- Rotate shared credentials; complete management/customer isolation,
  IPv6/FastTrack checks, monitoring and rollback drills.
- Validate free-app background/push paths on both mobile platforms. Foreground
  Jami/Berty offline success does not prove screen-off delivery. Internet
  whitelisting and offline local communications are distinct services.

See [readiness/device packages](mesh-pilot-readiness-and-device-plans.md) for
control evidence and known abuse limits. MACs can be spoofed and downstream NAT
can hide tethered devices; do not promise perfect anti-sharing enforcement.
