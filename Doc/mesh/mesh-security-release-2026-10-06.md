# Home pilot security release — 6 October 2026

Current production release is `dpl_HpKEQZzM11mApzUTr9NYWvjeuEJF`; it retains
the security changes described below and adds payment recovery/customer
completion. [Latest release](mesh-bitika-pending-ack-incident-2026-10-06.md).
At 22:23 EAT, a fresh runtime audit reports zero known advisories. This is not
a stress-test result or field signoff.
[Current pilot/security/device decision](mesh-pilot-readiness-and-device-plans.md).

Application hardening is deployed to `https://wifi.afribit.africa`:
`dpl_7dADG7ZxJmmUY64TbN4M11ypNikZ`,
`https://bitcoin-valley-wifi-bfbw1vpd7-novyrix-teams.vercel.app`.
This supersedes earlier `dpl_CvBHLAx2B9XB9TnLYn1DJqRfREjh`.
This is a scoped home-pilot release, not field-production clearance.
[Audit and remaining risks](mesh-security-audit-2026-10-06.md).

## Shipped application changes

- Bitika and BTCPay webhooks stop oversized streams before authentication,
  provider requests or database work. BTCPay rejects malformed signed events.
- Three passkey POST handlers have byte-bounded request bodies.
- New voucher lookups use versioned HMAC with a separate derived key; numeric
  ticket suffixes are no longer stored in plaintext. Legacy fallback is off.
- One legacy database voucher was inspected, authenticated/decrypted in memory
  and rehashed transactionally. It was already unusable. The post-migration
  inventory is zero legacy, one keyed and zero unknown formats. Its physical
  value, validity, flags and usage counters did not change. A private encrypted
  pre-migration backup is retained; no ticket value was printed.

## Evidence

Payment regression suite: 36 passed. Automatic-access suite: 38 passed.
Production guards: 10 passed. Additional webhook/passkey/voucher security
tests: nine top-level tests passed. Router error-propagation tests: four passed.
Lint, type checking, local production build and Vercel build passed.

Four small synthetic unsigned requests against the owned production deployment
verified 413 for oversized Bitika/BTCPay webhooks and passkey registration
options, and 401 for a small unsigned Bitika event.
`scripts/mesh/check-public-security.ts` performs these bounded checks. No charge,
Bitcoin send, voucher redemption or customer allowance was initiated.

## Tunnel and HTTPS recovery - 21:30 EAT

The private tunnel recovered on the original UDP 51820 endpoint. A fresh
handshake and pinned VM-to-router SSH passed before activation. The existing
`secure-join-20261006T165251Z` release and TLS overlay were activated at
**18:30:21 UTC / 21:30:21 EAT**. Active controller health, trusted loopback TLS
settings, exact router-rule readback, public forged-header denial and invalid
loopback attestation denial passed. Purchase readiness was enabled; no payment,
Bitcoin send or new allowance was initiated. The disabled laptop worker and
access ledger were preserved. The overlay was not recreated.

A bounded earlier UDP comparison observed six diagnostic packets on 4500 and
zero on 51820. Its temporary operator-IP-only provider permit was removed;
no operational tunnel port migration was applied. Recovery does not identify
the earlier upstream fault. Physical unpaid-phone HTTPS catalogue acceptance
and a fresh Bitika purchase remain separate pending gates.
[Recovery evidence](mesh-controller-connectivity-2026-10-06.md) and
[activation runbook](mesh-secure-join.md).

## Follow-up security implementation and rollout

Two additional findings are fixed and isolated regression tests pass:

- Gateway requests carry fresh signed nonces. PostgreSQL uniqueness claims the
  hashed request key before route work, stopping identical requests across
  concurrent workers. Partial v2 headers cannot downgrade, and a missing table
  fails closed. Tests verify exactly one context minted by twelve concurrent
  copies and fresh legitimate requests accepted within the same second.
- Voucher gates atomically check device, trusted source and global budgets in
  that order. Requests from a blocked device/source no longer spend downstream
  budgets and deny unrelated customers the shared window. Independent callers
  still hit the unchanged global ceiling; distributed guessing and
  shared-source contention remain field concerns.

The additive `mesh_agent_requests` schema was installed at **18:31:19 UTC /
21:31:19 EAT**, without changing customer or payment data. The dual-header
controller is installed in `nonce-security-20261006T183318Z`, with active cloud
health and signed old-API readiness verified before and after the upgrade.
Its recorded bundle SHA-256 is
`f37f08ad56a9f22b12dee661841cad40718321d04f2a937b3e0af9f80737f616`.
Environment, Caddy, WireGuard, systemd unit, router adapters and the ledger were
unchanged. No financial request was made. The strict API is deployed to the
production alias in the release above. At **18:35:08 UTC / 21:35:08 EAT**, a
read-only live signed request returned 200, the exact replay returned 403, a
fresh nonce returned 200, and a legacy nonce-less request returned 403.
Post-deployment controller health remains active and cloud-connected with the
new release selected. No legacy compatibility window was enabled.
[Required rollout order and rollback dependencies](mesh-agent-replay-protection.md).

A fresh runtime dependency scan also found the newly reported
`sharp` 0.35.4 librsvg advisory **GHSA-wq5f-xc86-pv6w**. The lockfile is updated
to supported `sharp` 0.35.5 and the subsequent runtime-only audit reports zero
known advisories. The updated production build and type checking pass;
the production release includes the patch.
Nine development dependency findings remain; no forced framework downgrade was
used. This is advisory checking, not an independent penetration test.

Final build, type checking and lint pass. The four bounded public unsigned
negative checks pass again on the new production alias. A regular optimized
portal image returns 200 and the local `sharp` 0.35.5 rendering check passes;
an unsupported cache-busting image query was an invalid probe, not evidence of
a product regression. Image evidence is retained privately in
`artifacts/mesh-lab/private/security-release/image-check.json`.

Read-only router management inventory confirms SSH restricted to the operator
workstation `10.20.0.10/32` and controller tunnel address `10.254.30.1/32`;
API, FTP and Telnet services are disabled. HTTP administration and Winbox are
restricted to the workstation. MAC management is still allowed on the current
LAN list. These settings were inspected, not newly commissioned by this release.
A dedicated field management VLAN, removal of plaintext administration, MAC
management guarding and credential rotation remain production requirements.

Private activation evidence is retained under
`artifacts/mesh-lab/private/secure-join/activation/20261006T183021Z/`;
private schema verification is under
`artifacts/mesh-lab/private/security-release/replay-schema.json`.
Controller upgrade evidence is in
`artifacts/mesh-lab/private/controller-nonce/20261006T183318Z/verification.json`.
Read-only live replay evidence is in
`artifacts/mesh-lab/private/security-release/live-replay-check.json`.

Blink wallet API allowances were rechecked enabled with zero paid sessions.
The operator identifies iPhone push as the missing feature. An Apple push
trial for `10.30.0.197/32` is now installed and verified, after correcting
RouterOS single-IP normalization and generated HotSpot child counting. Earlier
failed trials removed their rules. Five destination entries, two static
forwarding rules, five garden entries and ten strictly scoped generated rules
were read back. No raw HTTPS change or payment was made. Notification
acceptance is still pending. [Push scope and test](mesh-mobile-push-trial.md).

Four earlier router snapshot files contained export parser errors rather than
configuration. They are explicitly invalid in the audit. New shared SSH
automation rejects parse errors and verifies export content. A new export does
not recreate the missing historical pre-change configuration.

## Rollback limits

Do not roll back only the web application to a SHA-only voucher implementation:
it would not find the migrated HMAC ticket. Pair any code/database rollback,
preserve usage changes and do not overwrite the whole database from this small
inventory backup. Controller rollback remains fail closed; never restore the
HTTP capability path as a convenience fallback.

After strict nonce authentication ships, an older nonce-less controller cannot
be rolled back alone: retain the newer dual-header client, use a reviewed paired
API rollback, or an explicitly dated legacy window no longer than 24 hours.
Keep the additive replay table and preserve payment/order state. See the
[signed-request rollback runbook](mesh-agent-replay-protection.md).

Open-Wi-Fi MAC spoofing, six-digit online guessing at field inventory sizes,
shared-IP app exceptions, authenticated captive-origin protection and secret
rotation remain field readiness work. This review is not an external bug-bounty
launch or penetration-test certification.
