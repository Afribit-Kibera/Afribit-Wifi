# Mesh product roadmap

Updated 6 October 2026, Africa/Nairobi. This roadmap records the current home
pilot and the gates for a field deployment. The detailed evidence and handoff
are in [Mesh status and remaining work](mesh/mesh-status-and-roadmap-2026-10-06.md).

## Current position

The two-node IP network, open captive welcome, local-service experiments,
verified Paystack-to-Bitcoin settlement and automatic router access have passed
specific home-lab checks. They do not establish field-production readiness.

**Secure controller service is restored.** The original private tunnel has a
fresh handshake and pinned router SSH succeeds. Existing TLS-overlay activation
at 21:30 EAT restored active health and billing readiness; old plaintext joins
remain blocked. The replay table, dual-header controller and strict API are
deployed; live read-only replay/legacy denial passed at 21:35 EAT and again after
the 22:05 EAT customer/recovery release. A KES 10 Bitika purchase has a verified
86-sat receipt and acknowledged router access. The live `PENDING` adapter error
is fixed and the original purchase recovered without charging again. Browsing
works after the operator's retry; physical success/handoff acceptance remains pending.
[Payment recovery evidence](mesh/mesh-bitika-pending-ack-incident-2026-10-06.md).

**22:23 EAT pilot decision:** continue supervised single-device home testing.
Field cutover, full capacity/abuse acceptance, TV sponsorship and family-device
plans are not ready. The live catalogue has nine products and 50 Mbps lab caps,
versus the 15-product/3 Mbps reference. The Paystack/Engine fallback failed its
KES 450 read-only check; no charge was made. See
[pilot decision and product policy](mesh/mesh-pilot-readiness-and-device-plans.md).

| Product area | Evidence achieved | Remaining gate |
| --- | --- | --- |
| IP network | Two routing nodes, wired/radio paths and observed failover | Survey and load-test actual field links; enroll additional gateways |
| Captive and catalogue | Open Mesh SSID, local welcome, mobile pocket-ticket catalogue and payment UX deployed; secure join activated | Verify current unpaid-phone HTTPS handoff, latency, successful checkout exit and re-entry after expiry |
| M-Pesa to Bitcoin | Paystack collection/Bitcoin credit and post-outage Bitika KES 10/86-sat delivery verified; original Bitika pass acknowledged active | Accept revised payment progress, successful captive exit and recovery on the customer's phone |
| Router enforcement | Automatic no-credential activation and expiry accepted in the lab | Revalidate over HTTPS after recovery; complete outage/restart, device-binding and field-router acceptance |
| Vouchers | Six-digit flow implemented; HMAC lookups and hidden numeric suffixes deployed | Guessing/exhaustion, inventory, redemption recovery and scratch-ticket issuance controls at field scale |
| Free apps | Signal messages and Blink foreground refresh accepted on unpaid Mesh | Complete bounded push tests, negative browsing tests and dependency-change monitoring |
| Offline communication | Jami calls/texts and Berty foreground texts observed without WAN | Screen-off delivery, Bluetooth-off Berty and cross-node discovery/transport |
| Local content/storage | Portal, two-relay and verified media-copy experiments passed | Supervised local hosts, backups, storage limits and an explicit replication policy |
| Always-on control | Dedicated LunaNode commissioned; laptop billing worker disabled; pinned private tunnel and existing-TLS activation recovered | Monitor the intermittent path and prove sustained service/outage recovery |
| Security and operations | Body limits, keyed voucher lookup and scoped router policies deployed; nonce replay and voucher DoS fixes deployed; live replay checks passed | Credential rotation, abuse/load checks, management VLAN, monitoring, backups and independent security review |
| Multi-site accounting | Architecture and RADIUS trigger criteria documented | Router inventory, per-gateway credentials, usage/accounting and multi-router acceptance |
| TV and family products | Target-device and household enforcement requirements documented | Implement authenticated sponsorship, bounded device slots, aggregate/per-device queues and shared accounting before selling these products |

## Milestone 1 - accept restored paid home checkout

This is the immediate priority, before adding further customer features.

1. Retain the recovered private tunnel and pinned router check. Existing TLS
   activation and public forged-header/invalid attestation rejection have passed.
2. Retain the completed signed-request security release and accept the current
   unpaid-phone HTTPS catalogue. Keep billing fail closed if connectivity or
   attestation regresses.
3. Retain the operator-approved Bitika collection, verified delivery and router
   acknowledgment and reported working browsing on the recovered paid phone
   without typed credentials. Accept the published customer progress/completion flow.
4. Confirm a second unpaid device stays restricted and the purchased access
   expires correctly. Record the exact financial/reference and access evidence
   privately, without requesting a second payment after an ambiguous result.

Gate: one complete current phone journey passes; failed or pending payment
cannot authorize access. The installed TLS overlay must not be replaced with
an older plaintext handoff to bypass this gate.

[Connectivity investigation](mesh/mesh-controller-connectivity-2026-10-06.md),
[secure join recovery](mesh/mesh-secure-join.md),
[Bitika-first flow](mesh/mesh-bitika-primary.md).

## Milestone 2 - finish the free-access home pilot

- Confirm iPhone screen-off notifications through the scoped Apple push trial.
  A shared push-path test does not alone prove a Blink-specific notification.
  Android push is a separate commissioning step.
- Verify approved education links and the Bitcoin Diploma on an unpaid phone,
  alongside blocked unrelated browsing. Review shared-host IP exposure.
- Choose the scope of an offline communication pilot from evidence: Berty and
  Jami foreground delivery work in the lab; background and cross-node behavior
  are still open. Do not remove customer isolation globally to make an app work.
- Set a free-service bandwidth policy and measure link speed separately from
  the catalogue's configured per-user rate.

Gate: publish the exact supported app/features and tested platforms, with WAN
requirements stated clearly. No claim of offline background notifications is
made from a foreground messaging result.

[App and notification evidence](mesh/mesh-mobile-push-trial.md),
[Berty trial](mesh/mesh-berty-local-trial.md),
[production operations](mesh/mesh-production-operations.md).

## Milestone 3 - security and operational readiness

- Rotate credentials shared during commissioning and isolate production/test
  secrets and data. Use separate identities for each enrolled gateway.
- Complete device-binding, session-concurrency, voucher-guessing, callback
  replay, duplicate fulfillment and IPv6/QUIC bypass checks.
- Prove guest/management separation and review the scope of each free-service
  exception. Open-Wi-Fi MAC addresses alone are not strong device identity.
- Establish alerts for gateway/tunnel outages, failed activation, unresolved
  collections, treasury liquidity and low disk space.
- Exercise backup restoration and a bounded router/controller rollback.
- Reconcile gross KES, provider fees, credited sats, access orders and exceptions.
  Paystack settlement uses a prefunded Bitcoin treasury; it does not itself
  replenish that treasury from the Paystack KES balance.
- Finish operator support/search and a clear process for paid-but-unfulfilled
  orders. No customer should need to repay an unresolved collection.

Gate: all critical findings closed or explicitly accepted for the limited
pilot; recovery and financial reconciliation have evidence. Passing tests and
an automated dependency audit are not an independent penetration test.

[Security audit](mesh/mesh-security-audit-2026-10-06.md),
[device/access controls](mesh/mesh-device-access-security.md),
[settlement and liquidity](mesh/mesh-engine-bitcoin-settlement.md).

## Milestone 4 - controlled 3WEST field pilot

Match the current plan catalogue and rate profiles before migration. Obtain a
sanitized export and private backup of the actual serving router; inventory
APs, power, links, addressing and active customer workflows. Prepare additive
configuration and an operator-reviewed rollback.

Start with an isolated AP/SSID or designated customers. Prove payment, expiry,
free services, management isolation and outage recovery under representative
usage. Keep the existing billing service available until the canary and the
relevant expiry/reconciliation cycles pass. Do not reset or replace the whole
operating router as an installation shortcut.

Gate: the product owner and site operator accept the recorded canary results,
support workflow and rollback. Current home enrollment is specific to
`KM-LAB-001`; the operating 3WEST router is not commissioned by those tests.

[3WEST review](mesh/3west-production-readiness.md),
[home-to-field guide](mesh/mesh-production-operations.md).

## Milestone 5 - extend and decentralize

APs behind an existing gateway can extend that gateway's customer network.
Independent paid gateways require unique enrollment, policies and accounting;
the current single-gateway controller must be generalized first. Wireless
backhaul requires compatible bridge/radio roles, suitable mounting and a
surveyed link; arbitrary basic routers do not acquire mesh routing by sharing
an SSID. Capacity is established by measured airtime, CPU, uplink and client
load, not router count alone.

Add supervised local edge hosts for content and communication services. The
cloud controller cannot serve local applications during a WAN outage. Retain
local addressing/discovery, backups, explicit replication and independent
power where needed. Wi-Fi/IP remains the primary network; LoRa/Meshtastic is a
separate optional short-message track, not an internet/media backhaul.

Begin RADIUS/accounting work when there are more than two independent active
paid gateways, roaming across sites, data caps, PPPoE subscribers or a measured
router-API/accounting bottleneck. Deliver NAS registration, interim accounting,
disconnects, usage ingestion and multi-site authorization tests.

Gate: failure of one node or internet gateway has measured, documented effects
on neighboring routing and local services. Do not label a collection of APs a
resilient decentralized network without this evidence.

[IP/LoRa direction](mesh/mesh-ip-and-lora-direction.md),
[equipment and capacity](mesh/mesh-production-operations.md).

## Later product tracks

Sponsored-access budgets, learn-to-earn, cached education, local events and a
merchant directory remain planned. They should issue the same standard
entitlements and use the same expiry/audit model as purchased access. Paid
private storage remains deferred until privacy, abuse, recovery and operations
have a separate accepted design.

Work proceeds by acceptance gates rather than promised calendar dates. Each
milestone gets one focused physical acceptance check after relevant automated
verification; completed checks are repeated only after a relevant change or
failure.
