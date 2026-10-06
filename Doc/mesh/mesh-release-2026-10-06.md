# Mesh published pilot release - 6 October 2026

The complete current source and developer documentation were pushed to
`novyrix/Afribit-Wifi` main in
[`32ed51f`](https://github.com/novyrix/Afribit-Wifi/commit/32ed51f2196b62b407405af05afdab82eee814df).
This is the supervised home-pilot release, not a 3WEST customer-router cutover
or unattended field-production signoff.

## Published application and runtime

The Git-triggered Vercel build explicitly cloned main at `32ed51f` and completed
successfully at 19:49:51 UTC / 22:49:51 EAT:

- Application alias: https://wifi.afribit.africa.
- Git-build deployment: `dpl_2nrXvxKszWCmAgMmQ6cfWt7hgqSD`.
- Immutable URL: https://bitcoin-valley-wifi-b2f4fm9v2-novyrix-teams.vercel.app.
- Controller: https://mesh-core.afribit.africa, active and cloud-connected.
- Retained controller release: `nonce-security-20261006T183318Z`.
- Controller bundle SHA-256:
  `f37f08ad56a9f22b12dee661841cad40718321d04f2a937b3e0af9f80737f616`.

The controller bundle and both Python router adapters match local source
hashes. Its environment, tunnel and durable ledger were preserved. All eleven
scoped captive assets were backed up, uploaded and verified against source;
the update did not change firewall, DHCP or site configuration.

App health reports a connected database. Public catalogue and controller health
return HTTP 200. Signed gateway checks accept fresh requests (200), reject exact
replays (403) and reject nonce-less requests (403). Unsigned/oversized webhook
and passkey probes return the expected 401/413. Bitika is preferred and configured
for live checkout; the enrolled gateway is fresh with no outstanding orders.
A quote/configuration check does not prove every catalogue price can settle.
No payment, Bitcoin transfer or new access allowance was initiated by this
release procedure.

## Verification and CI limitation

Local checks passed: 51 payment tests, 38 access tests, 10 production guards and
16 security tests (115 total), plus four router command tests and four controller
upgrade tests. Lint, type checking and production build passed. Runtime
dependency audit reported zero known vulnerabilities. Proposed public Git
contents were checked against private environment values and credential patterns;
lab wireless keys were replaced with placeholders in published templates.

[GitHub CI run](https://github.com/novyrix/Afribit-Wifi/actions/runs/37521737399)
could not start: GitHub reports the account is locked because of a billing issue.
No CI test steps ran. The operator must resolve GitHub billing and rerun the
workflow; local passing tests are not represented as a successful hosted CI run.
Vercel's independent Git build and production deployment succeeded.

## Developer handoff and limits

Start with [developer setup and recovery](mesh-developer-handoff.md). Production
credentials and private evidence are excluded from the public repository and
must be supplied separately by the operator. Follow-up documentation commits
can trigger new Vercel builds with identical application code; the immutable
deployment above records the published implementation baseline.

TV sponsorship, family device slots, plan/customer migration, field stress
testing, credential rotation and remaining isolation/restore gates are tracked
in [pilot readiness](mesh-pilot-readiness-and-device-plans.md) and
[3WEST readiness](3west-production-readiness.md).
