# Bitika-first checkout

6 October 2026. Home pilot at `wifi.afribit.africa`; the existing 3WEST serving router is unchanged.

**Current operating status, 22:10 EAT:** the live application prefers Bitika,
with Paystack configured as backend fallback for new purchases. A real KES 10
purchase was collected and delivered **86 sats to spira@blink.sv**. Its live
`PENDING` acknowledgement exposed an adapter error; the original response was
recovered with the same key and exact payload, without another charge or Bitcoin
transfer. The iPhone's original pass is now router-acknowledged as active after
reconnection; the operator reports browsing works after retry. Physical
acceptance of the newly published success/captive handoff remains pending.
[Payment incident and customer completion](mesh-bitika-pending-ack-incident-2026-10-06.md).
[Current roadmap](mesh-status-and-roadmap-2026-10-06.md).

## Payment path

The customer sees one **M-Pesa** method. Bitika is preferred: it collects the selected catalogue amount and delivers Bitcoin directly to `spira@blink.sv`. Paystack uses the existing Insats settlement engine when it serves a new purchase. Bitika payments never make a second Bitcoin transfer through that engine.

When Bitika is disabled or incompletely configured, new checkouts select available Paystack. An initiated request never automatically fails over: a timeout is not a confirmed collection failure. The same router/device is reserved across both providers until the earlier purchase has a definite outcome. Bitika recovery retains its original UUID/Idempotency-Key; known transaction codes are lookup-only. `qadi_` references are accepted.

Server-side lookup confirms the exact code, KES amount, stored Lightning recipient, live environment, fulfilled status, positive delivered sats and valid payment hash. Collected M-Pesa with failed Bitcoin delivery stays unresolved and cannot grant access or authorize another collection.

Verified delivery atomically commits the receipt, pending allowance and encrypted router-bound automatic order. Insertion failure rolls everything back. Repeated callbacks/polls retain one order and deadline. Authenticated controller polling reconciles both providers, independent of an open customer browser. Only the matching router acknowledgment establishes active access. The retired legacy worker cannot consume these orders.

## Deployment and checks

- The Bitika-first feature release was `dpl_54cHg5wqkb89ZyFLkU7m1jNahgns`.
  The security release `dpl_7dADG7ZxJmmUY64TbN4M11ypNikZ` is retained within
  current customer/recovery release `dpl_HpKEQZzM11mApzUTr9NYWvjeuEJF`
  at https://wifi.afribit.africa. [Security and rollback limits](mesh-security-release-2026-10-06.md).
- `BITIKA_ENABLED=true`; live key, signing secret and recipient remain server-side. Paystack stays enabled as backup.
- Historical pre-feature release: `dpl_DYWYGVYdMr2iJZJd62FfNT5EPpv4`. Do not
  restore a SHA-only voucher implementation over the migrated HMAC inventory;
  use the current security release's paired rollback instructions and preserve
  receipts, reservations, orders and deadlines.
- Eleven Primary static files verified by byte readback; backup `artifacts/mesh-lab/private/persistent-portal/20261006T190207Z`. DHCP, firewall, SSID and site configuration unchanged.
- 51 payment, 38 native/automatic-access and 10 production-guard tests passed. Coverage includes lost response/same-key recovery, encrypted retained requests, concurrent worker leases, cross-provider reservations, controller polling, receipt mismatches, incomplete delivery and atomic rollback.
- Typecheck, lint and production build passed. Mobile fixtures: 320/390 pixels; router welcome: 320/390/430/580 pixels. Installed Chrome stalled actionability/screenshots; the installed Playwright headless Chromium completed the checks.
- Safe read-only verification: `scripts/mesh/check-bitika-primary.ts` and `artifacts/mesh-catalogue-design/implemented/check-live.mjs`. Results retained locally. No collection or Bitcoin transfer initiated by this change.

The post-outage purchase has a verified direct Bitcoin receipt, acknowledged router access and reported working browsing. Next acceptance is the published success/handoff and an unpaid second device remaining blocked. Preserve the original reference if the prompt/delivery is uncertain. This is home-lab evidence, not a field signoff.

[Bitika documentation](https://bitika.xyz/developers/docs); remaining field prerequisites: [3WEST readiness](3west-production-readiness.md).
