# Mesh controller request nonce rollout

## Commissioned controller

On 6 October 2026 at 21:33 EAT, the owned `mesh-core.afribit.africa` controller was upgraded to send both the existing gateway signature and a signed, random request nonce. This preserves compatibility with the earlier API while the API replay protection is deployed separately.

| Item | Verified value |
| --- | --- |
| Prior executable release | `/opt/mesh/releases/secure-join-20261006T165251Z` |
| New executable release | `/opt/mesh/releases/nonce-security-20261006T183318Z` |
| SHA-256 | `f37f08ad56a9f22b12dee661841cad40718321d04f2a937b3e0af9f80737f616` |
| Controller mode | Active |
| API readiness | Signed read-only request accepted before and after cutover |
| Controller health | Active, running and connected to the cloud |
| Agent environment, Caddy, WireGuard and systemd unit | Byte-identical before and after |
| Router and observer adapters | Copied unchanged from the retained TLS release |

No payment was initiated. The upgrade did not change router rules, onboarding transport, environment, settlement configuration or the access ledger. A running controller continues its normal polling; the commissioning script sends only a read-only readiness request.

Private evidence is retained at `artifacts/mesh-lab/private/controller-nonce/20261006T183318Z/verification.json`. The VM also retains a root-only backup and verification record under `/var/lib/mesh/controller-upgrade-backups/20261006T183318Z/`.

## Safe order of deployment

1. Upgrade the controller to send the dual headers. Its existing signature still works with the old API.
2. Create the additive durable replay table. This step does not modify customer payments or grants.
3. Deploy the API that requires the signed nonce and atomically claims each request.
4. Verify one signed read-only request succeeds, an exact replay is rejected, and a fresh nonce succeeds. Confirm the running controller remains connected after deployment.

The controller upgrade alone does **not** reject replays. API and database deployment, together with their live negative checks, are separate requirements.

## Scoped commissioning tool

`scripts/mesh/upgrade-controller-nonce.py` prepares an executable and private manifest locally by default:

```powershell
py scripts/mesh/upgrade-controller-nonce.py
```

For a reviewed subsequent upgrade, specify the exact current release:

```powershell
py scripts/mesh/upgrade-controller-nonce.py --apply --expected-release /opt/mesh/releases/nonce-security-20261006T183318Z
```

Application requires the pinned owned VM, an active controller, the retained loopback TLS proxy configuration, the original access-ledger directory, exact release match, and a new unused release directory. The tool validates the executable, checks signed readiness before changing the symlink, restarts only `mesh-controller`, checks cloud health and unchanged configuration hashes, and checks readiness again. It does not start a second daemon during its readiness probe.

If cutover health fails, the tool stops the controller, restores the original symlink, restarts the original executable and records the failure. Review a failed or interrupted operation using the private evidence before retrying; do not reuse its timestamp or assume it succeeded.

## Rollback constraint after API deployment

The old TLS executable predates signed request nonces. After the strict API is deployed, rolling back only the controller to that executable breaks gateway authentication. Prefer a previous dual-header release. A rollback to the old executable requires a paired API rollback or a specifically configured, bounded legacy-authentication window with the replay protection retained. Do not enable indefinite legacy acceptance.

The historical secure-join installation record remains unchanged. Its exact-release activation check applies to the original TLS executable; the new controller release has its own verification record. Do not overwrite an old hash record to make a newer release appear to be the original installation.

Four local commissioning checks pass: exact release scope, remote program/state preservation constraints, readiness import without starting a worker, and rollback wiring. The installed release additionally passed live signed readiness and active-cloud health checks.
