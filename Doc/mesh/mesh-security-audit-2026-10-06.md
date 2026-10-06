# Mesh security review — 6 October 2026

## Decision

The home pilot has meaningful payment and device-binding controls, but this review is **not a field-production clearance**. The HTTPS onboarding overlay passed existing-overlay activation after private tunnel recovery on the original UDP 51820 endpoint. Active health, pinned router access and negative join checks passed at 21:30 EAT. Physical unpaid-phone HTTPS acceptance remains a separate pending gate; installation or mock tests alone do not establish it.

Webhook/passkey input boundaries and keyed voucher lookup are deployed in the earlier scoped release. Root migrated one unusable legacy ticket without changing value, flags or usage; that operation was not performed by this reviewer. The follow-up signed-request replay and voucher-limit denial-of-service fixes are implemented and regression-tested; their controller/schema/API deployment is recorded in the [security release](mesh-security-release-2026-10-06.md). None of these tests proves a fresh Bitika payment or field migration.

## Scope and method

Reviewed owned application code for Bitika-first / Paystack-backup checkout, provider reconciliation, webhook authentication, browser ownership, one-use joins, voucher redemption, passkey administration, immutable controller jobs and the scoped Blink/learning firewall commissioning scripts. Used the engineering code-review skill and the installed Next.js route-handler/data-security documentation.

Tests used synthetic credentials, mocked provider calls and isolated PostgreSQL-compatible databases. No real charge, transfer, voucher issuance, live provider probing, customer session interception, router mutation or third-party/WispMan scanning took place. Dependency checks queried npm advisory metadata. No live load or radio attack was attempted.

## Confirmed findings

| ID | Severity | Finding and evidence | Status |
| --- | --- | --- | --- |
| MESH-01 | High; requires local on-path position | `gateway-agent/mesh-daemon.ts` originally serves `/start` over HTTP and returns a redirect from `createMeshContext()` containing both a short-lived one-use join ticket and a reusable browser bearer secret. `lib/mesh-access/service.ts` gives the browser capability up to 32 days. Passive capture or an on-path attacker on unencrypted guest Wi-Fi can race the intended user to exchange the ticket. Cloud HTTPS, HttpOnly cookies and one-use ticket consumption do not encrypt this first redirect. MAC attestation is not cryptographic user identity. | HTTPS overlay activated by root at 21:30 EAT with pinned router access and negative attestation checks. Public forged headers are rejected and old secret-bearing HTTP entry is blocked. **Physical unpaid-phone acceptance remains pending**; initial captive-origin/rogue-AP protection is separate. |
| MESH-02 | Medium; resource exhaustion boundary | Public Bitika webhook called `request.text()` before checking a character count; BTCPay webhook had no body limit. An unsigned chunked request therefore reached full buffering before authentication/rejection. Cloud/platform request limits may bound the outer impact, but the intended 64 KB application limit did not protect either handler. | **Deployed in the earlier scoped release**: both handlers use the streaming byte-limited reader, reject oversized declared/chunked bodies with 413 and cancel the stream before signature, database or provider work. |
| MESH-03 | Low; authenticated malformed input | BTCPay handler parsed signed JSON without catching syntax errors or validating the invoice field type. A malformed correctly signed event produced an uncaught handler exception instead of a controlled rejection. This requires signing authority/provider fault; it is not an anonymous settlement bypass. | **Deployed in the earlier scoped release**: signed malformed JSON or wrong invoice field types return 400; valid ignored events still return 200. |
| MESH-04 | Medium; requires database read leak | Six-digit voucher values used unkeyed SHA-256 lookup, allowing a database-only reader to enumerate one million possibilities without the AES export key. Plaintext `codeLastFour` also disclosed four of the six digits, leaving 100 online candidates per leaked ticket. | **Deployed**: versioned HMAC via domain-separated HKDF/dedicated key and no numeric suffix. Root transactionally rehashed the one unusable legacy record; the checked inventory has zero legacy formats. Paired rollback limits and inventory-aware field issuance remain applicable. |
| MESH-05 | Medium; input-boundary exposure | Three passkey POST routes used unbounded `request.json()` after only an origin check. A non-browser caller can forge that header; it does not protect body allocation. | **Deployed in the earlier scoped release**: registration options limit 4 KB; registration/authentication proofs limit 64 KB; oversized streamed/declared bodies return 413 and cancel before database/challenge work. |
| MESH-06 | Medium; operator recovery/integrity | Shared RouterOS staging runner ignored SSH exit status and several stdout error forms, including `expected end of command`. Three snapshot callers used unsupported `/export terse show-sensitive=no`; RouterOS 7.20 returned a parser error with exit zero that was saved as a purported backup. | **Fixed in shared operator automation**: shared runner rejects status/stderr/known stdout diagnostics, sanitizes errors and verifies actual export headers; callers use `/export terse`, whose sensitive values are hidden by default. Four historical snapshots below are invalid and are not repaired retrospectively. |
| MESH-07 | Medium; authenticated request replay | Valid gateway HMAC requests could be replayed during the 60-second acceptance window. Repeated context creation minted additional capabilities because no durable request nonce was claimed. The immutable order/claim controls remain separate; no anonymous payment bypass was established. | **Deployed; live read-only replay/legacy denial passed at 21:35 EAT**: fresh signed nonces, durable PostgreSQL uniqueness before route work, no malformed-v2 downgrade, fail-closed missing schema and bounded dated legacy compatibility. [Rollout and rollback](mesh-agent-replay-protection.md). |
| MESH-08 | Medium; voucher availability | A device already blocked by its local voucher throttle continued spending the global redemption budget. One blocked client could therefore deny other customers the shared allowance window. | **Deployed; isolated concurrent tests passed**: dependent atomic device/source/global gates stop downstream spending once an earlier gate blocks. Concurrent tests retain the global ceiling for independent clients. This does not eliminate distributed guessing or shared-source contention. |

## Regression evidence

`tests/webhook-security.test.ts` imports the real Bitika and BTCPay route handlers with database and network methods replaced by guards that throw on any access. It verifies:

- Infinite chunked streams stop and cancel at the limit, including a false `Content-Length: 1`.
- Declared oversized requests return 413 without consuming the body in full.
- Invalid UTF-8 returns 400; unsigned small bodies return 401.
- Whitespace and multibyte UTF-8 in valid signed fixtures authenticate without JSON reserialization.
- A signed Bitika sandbox event and a signed BTCPay ignored event are acknowledged without provider/database effects.
- Signed malformed BTCPay JSON and an object-valued invoice identifier return 400.

Commands run successfully during this review:

```text
npx tsx --test tests/webhook-security.test.ts tests/request-body.test.ts
npm run test:payments
npm run test:mesh-access
npm run test:production-guards
npm run typecheck
npm run lint
```

Results at the time run: 4 boundary tests, 36 payment tests, 35 access tests and 10 production-guard tests passed; type checking and lint passed. The access suite may gain tests from the separate HTTPS onboarding work after this snapshot. The production build and deployment of these changes are owned by the root agent, not performed by this reviewer.

Follow-up local verification after voucher/passkey patches: 24 tests passed across `webhook-security`, `passkey-body-security`, `voucher-lookup-security`, `six-digit-vouchers` and `mesh-automatic-access`; type checking passed. This includes actual HTTP voucher redemption against isolated PostgreSQL. Root should rerun the complete release suite with the parallel secure-join changes.

Router automation follow-up: `py tests/router-command-security.test.py` passed four fake-channel tests, including zero-status parse/permission errors, ANSI-colored diagnostics, nonzero status, stderr, transport exceptions, invalid UTF-8, missing export headers and valid export/script text. The shared runner and all three corrected snapshot callers compiled with `py -m py_compile`. No live router request or configuration mutation was needed for those checks.

## Invalid historical router snapshots

Read-only local inspection confirmed that each of these files is 42 bytes, lacks a RouterOS export header and contains the parser-error marker. They **are not configuration backups**:

```text
artifacts/mesh-lab/private/blink-free-access/20261006T122619Z/router-before.rsc
artifacts/mesh-lab/private/lunanode/router-before-cutover.rsc
artifacts/mesh-lab/private/learning-sites/20261006T123009Z/router-before.rsc
artifacts/mesh-lab/private/learning-sites/20261006T112635Z/router-before.rsc
```

Their originals were retained unchanged. Previous commissioning summaries must not claim those files can restore pre-change configuration. A newly verified export can establish a current baseline; it cannot recreate those missing historical pre-change snapshots. Use independently verified backups and explicit scoped rollback procedures, with fresh read-back of actual policy. Detecting an error after a compound RouterOS command also does not automatically undo any earlier successful operations within that command.

## Controls verified by source and existing isolated tests

- Customer MAC/IP/router values are replaced with attested context when automatic Mesh access is enabled. Public UUIDs alone cannot read another native payment/access status.
- Gateway HMAC authenticates exact method, route, body and bounded timestamp; router operations pin the SSH host key and verify the expected board identity.
- Bitika signed callbacks are notifications: server-side provider lookup still matches invoice code, amount, destination, environment and a fulfilled delivery hash. Paystack collection alone does not grant internet; the Engine receipt is rechecked for Bitcoin settlement.
- Device checkout reservations are durable across Bitika and Paystack. An uncertain prompt retains its reference and cannot switch providers to trigger another collection.
- Payment-to-order insertion and voucher redemption are transactional; retrying an order cannot change the device, renew its deadline or reset consumed counters.
- Six-digit vouchers use cryptographically uniform generation, database uniqueness and shared redemption throttles. New codes cannot be redeemed through the legacy unauthenticated browser-MAC path.
- Admin actions/exports require a current passkey session. Revoked passkeys invalidate subsequent session checks; enrollment uses expiring codes, atomic consumption, required user verification and unique active device slots.
- Native Mesh disables legacy bypass job claims. Guest VLAN scripts place private-network/IPv6 denials before ordinary forwarding/FastTrack and constrain free-access rules by guest source, protocol, destination list and expected WAN.

These are scoped checks, not proof that every deployed router rule, dependency or administrative workflow is correct.

## Remaining security work and practical limits

### Open Wi-Fi identity and onboarding

Accept the physical HTTPS handoff before a field launch. Even after HTTPS onboarding, a paid MAC address on open Wi-Fi is spoofable. Automatic IP+MAC+HotSpot bindings limit accidental sharing and stale grants; they are not an identity credential resistant to a determined radio attacker. Test client isolation, DHCP/ARP impersonation and account takeover only on the isolated lab. Consider OWE or an appropriate encrypted guest-access design where hardware/client support permits, with a carefully scoped policy for device replacement and MAC randomization.

### Six-digit voucher stock

The new local implementation stores a versioned HMAC using a domain-separated HKDF key derived from the existing export secret, or an explicitly configured dedicated lookup key. New numeric tickets no longer store four of their six digits in plaintext. Old SHA-256 records must be rehashed from authenticated encrypted values before that database-only leakage is closed for existing stock. The root/operator migration and bounded compatibility instructions are in [mesh-voucher-lookup-hardening.md](mesh-voucher-lookup-hardening.md). The reviewer did not mutate live stock; root later rehashed the one unusable legacy record, as recorded in the security release.

Online guessing also depends on outstanding inventory. With 1,000 valid codes, 100 uniformly random guesses have about a 9.5% chance of hitting at least one; with 10,000 valid codes the chance is about 63%. The current global redemption ceiling is 100 attempts per 15 minutes and includes successful attempts. This constrains home abuse but can become both a guessing and availability concern at field scale. Keep six-digit stock single-use, short-lived and limited; add inventory-aware issuance limits, per-site observability and a tested recovery process. Do not silently weaken the global throttle to increase sales capacity.

### Free application access

Current domain/IP allowances can permit other services that share an allowed hosting address. They cannot prove that traffic belongs only to Blink, Signal or one education site. This is a documented network-policy limitation, not a demonstrated open Internet bypass in this review. Push-service allowances may be inherently shared across applications; evaluate the abuse/cost tradeoff before adding them. Do not use TLS interception or install private trust roots on customer phones to obtain app isolation.

### Other input and replay boundaries

Passkey registration/authentication handlers now have streaming byte bounds and tests with trusted origins but forbidden database access. Authentication/enrollment abuse still needs monitoring/rate policy in a field release. MESH-07 adds signed fresh nonces and a durable request claim; isolated concurrent handlers mint exactly one capability from an identical request. Job completion remains independently bound to an immutable claim and native order. Release order matters: the dual-header controller precedes the additive replay schema and strict API. The earlier client cannot be rolled back alone after strict authentication without an explicitly bounded compatibility window or paired API rollback. See [the replay runbook](mesh-agent-replay-protection.md).

### Secrets and recovery

Multiple live credentials were intentionally supplied during commissioning. Rotate these before moving out of the home pilot, scope payment/controller credentials independently, restrict router administration to the private management path and test revocation. This review did not retrieve production secret values or claim a secret leak from the deployed bundle. Verify backups, local private-artifact ACLs, log retention and incident recovery with the eventual field operator.

### Dependency audit

The earlier runtime scan was clean, but a later 6 October scan found a new
high-severity advisory in `sharp` 0.35.4's librsvg dependency,
**GHSA-wq5f-xc86-pv6w**. Root updated the lockfile to `sharp` 0.35.5 within the
supported Next dependency range. The subsequent `npm audit --omit=dev` reports
**zero known production dependency advisories**. Release/build verification is
tracked separately in [the security release](mesh-security-release-2026-10-06.md).

The full scan still reports **nine development dependency findings**: five
high-severity nodes in the Next ESLint glob/braces chain and four moderate nodes
in Drizzle Kit's old esbuild chain. Counts include transitive effects, not nine
distinct deployed exploits. No forced framework downgrade was applied. Keep
development servers and Drizzle Studio private, track upstream fixes and retest
a compatible dependency update. An advisory scan is not an independent security
audit, and zero known findings is not a security guarantee.

## Next acceptance gate

The installed HTTPS path has passed activation and negative attestation checks.
Finish its unpaid physical-phone acceptance. The ordered nonce-controller,
schema and API release is deployed and read-only live replay rejection passed;
retain the regression and release evidence.
Then accept one approved home purchase and conduct an isolated lab abuse
exercise for guest isolation, MAC replacement, voucher guessing limits and
provider ambiguity. A public bug bounty requires a written owned-asset scope,
safe testing rules, reporting channel and a funded response process; this local
review is not an external bounty launch or penetration-test certification.
