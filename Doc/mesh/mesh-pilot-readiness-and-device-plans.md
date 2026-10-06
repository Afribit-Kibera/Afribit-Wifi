# Mesh pilot decision, security and device plans

Updated 6 October 2026, 22:23 EAT. Owner handoff for the home lab.

**Go for a supervised home pilot of the existing single-device paid service.
No go for an unattended public rollout or replacement of 3WEST yet.** A small
field trial on an isolated test SSID is the next stage after the gates below;
it must not overwrite the existing paying-customer service.

## What is accepted now

The two-node IP network, tested wired/radio failover, open customer welcome,
free Signal foreground messaging and signed-in Blink wallet refresh have home
evidence. The latest KES 10 Bitika purchase has verified collection, direct
86-sat delivery, one acknowledged native allowance and an operator-reported
working browsing retry. The original `PENDING` acknowledgement error is fixed.
Customer progress and success screens are deployed, but their physical captive
dismissal still needs acceptance. See the [payment recovery record](mesh-bitika-pending-ack-incident-2026-10-06.md).

Read-only checks at 22:20–22:21 EAT found:

| Check | Result and limit |
| --- | --- |
| Enrolled home gateway | Fresh `KM-LAB-001` heartbeat; automatic lane ready for a home test |
| Payment backlog | Both-provider check found no unresolved initiated collections |
| Access backlog | No unexpired queued, claimed or failed orders; active sessions are separate |
| Provider | Bitika preferred and configured live; KES 10 quote responded. Readiness is not another completed purchase. |
| Fallback | Paystack/Engine KES 10 read-only readiness passed; KES 450 failed. The reason is not established by this check. Do not advertise full-price fallback coverage. |
| Catalogue | Nine active hotspot products, versus 15 reference products including six TV plans; catalogue comparison failed |
| Runtime dependencies | `npm audit --omit=dev` reports zero known advisories; this does not establish application or network security |

The field preflight deliberately remains `not_ready`. Its field TLS/startup/
security labels do not negate the completed Primary lab TLS, controller reboot
and application-security evidence; those controls are not commissioned on the
serving field gateway. The preflight's unresolved-payment count covers Paystack;
the separate Bitika-primary check supplies the both-provider backlog result.
Private evidence stays under `artifacts/mesh-lab/private/production-review/` and
`artifacts/mesh-lab/private/bitika-primary/`.

## Security and abuse: controls versus remaining risk

| Area | Implemented or observed | Remaining pilot/field work |
| --- | --- | --- |
| Payments | Verified provider amount/reference/recipient/delivery; signed callbacks; immutable purchases; atomic settlement/order creation; uncertain requests preserve their original key and destination | Customer recovery after losing the browser session; operator alerts and financial reconciliation; test outages without real duplicate collections |
| Duplicate purchases | Durable device reservation shared by Bitika and Paystack; new references cannot escape an unresolved collection | Explicit top-up and simultaneous voucher/payment policy; device transfer workflow |
| Prompt abuse | Durable counters; defaults are three new attempts per device and five per phone per 15 minutes | Verify deployed override values; distributed attempts, provider outages and support handling under load |
| Voucher guessing | Six-digit codes, keyed stored lookups, durable device/source/global gates; blocked clients cannot spend unrelated users' downstream budgets | Small issued inventory, controlled export/sales, distributed guessing and shared-NAT fairness tests before scaling stock |
| Gateway trust | Private WireGuard path, pinned router SSH identity, signed fresh nonces and persistent replay rejection | Separate identity/key enrollment for each serving gateway; rotate previously shared credentials and validate least privilege |
| Device enforcement | Native single-session account bound to the observed IP/MAC; product speed/data snapshot; local deadline and no reset on retry | DHCP change/private-MAC recovery; stolen/spoofed MAC scenario; target gateway packet paths |
| Guest separation | Lab VLAN/firewall configuration denies private targets and guest IPv6; management services have a restricted IP inventory | Prove isolation on real APs across both bands, wired ingress and AP-to-AP paths; dedicated management VLAN; remove plaintext administration and guard MAC management |
| Free internet apps | Scoped destination/port exceptions, separately tested foreground features | Shared hosting/CDN addresses can admit unrelated traffic; external push is shared infrastructure. These rules cannot guarantee only the named app uses them. |
| Operations | Dedicated controller and retained allowance ledger; Primary reboot recovery evidence | Monitoring, paging/escalation, encrypted backups and an accepted DB/router/controller restore; field power resilience |

MAC addresses identify a connection, not a person. Binding and hidden credentials
limit casual pass copying but do not eliminate MAC spoofing or downstream
tethering. Open Wi-Fi also does not encrypt ordinary unprotected application
traffic; use HTTPS and app-level encryption. Do not claim a penetration-test
certificate from automated checks. Nine development-tool advisory findings were
recorded in the earlier security review and remain separate remediation work.
[Security release](mesh-security-release-2026-10-06.md),
[audit](mesh-security-audit-2026-10-06.md).

## Have we stress-tested it?

**No full system or radio/forwarding stress test has been completed.** The latest
release passed 99 automated payment/access/guard checks plus typecheck, lint,
build and mobile fixtures. Disposable-database tests exercised twelve concurrent
replayed requests and twelve concurrent recovery workers. These prove bounded
race-control behavior, not twelve physical phones or a measured user capacity.
There is no accepted many-client throughput/latency soak, roaming, distributed
attack, large voucher inventory or loaded-router failure result.

Next capacity milestone, with no stress traffic sent to payment providers:

1. Record an idle baseline with the real HotSpot, queues, free-app rules and
   controller enabled. Measure the router/AP, uplink and local backhaul separately.
2. Use five consenting devices, then ten only if the five-device stage passes.
   Exercise repeated catalogue/status reads and synthetic payment outcomes in
   an isolated test environment; measure local transfers and legitimate paid
   browsing for 30 minutes per stage. This is a proposed test size, not today's
   validated admission capacity.
3. Record achieved throughput, latency/loss, join/catalogue/activation times,
   router CPU/free RAM, connection table, queue behavior and AP airtime. Measure
   per-device caps while another device consumes the link. Set acceptance
   targets before running; keep operational headroom and stop for rising loss,
   sustained CPU over the proposed 80% alert threshold or management stalls.
4. At the accepted load, interrupt one backhaul and restart the controller;
   verify no duplicate charge/order, original deadlines, expiry and unpaid-device
   restrictions. Schedule router/power recovery separately with backups ready.
5. Publish the measured client limit. Adding APs increases coverage and demand,
   not upstream bandwidth or gateway capacity. RB951Ui-2HnD ports are 100 Mbps;
   the tested uplink negotiated that rate. A higher ISP subscription cannot
   exceed the physical link, and guest goodput will be lower.

Do not launch an unbounded public API flood or generate live M-Pesa prompts for
load testing. [Capacity and topology guide](mesh-production-operations.md).

## What a pass covers today

**One purchase activates one observed customer device on Primary.** Each device
has a separate native account with `shared-users=1`. It gets the speed and data
limit snapshotted from its purchased product, plus the existing immutable
expiry. Increasing the number of APs does not make this a multi-device or
multi-gateway pass. Local services/free external exceptions have their own policy.

The lab catalogue currently has higher rate settings than 3WEST's reference
**3 Mbps down/up**. Prices alone are not parity: the reference includes connected
uptime within a validity period and calendar-month products. The present lab's
elapsed deadlines must not replace those semantics silently. No catalogue rate
or price was changed for this documentation task.
[Exact reference and remaining migration work](3west-production-readiness.md).

## TV, family and home-router products

These are design requirements, **not implemented checkout options**.

| Product | Proposed customer experience | Enforcement |
| --- | --- | --- |
| Personal pass | Buy on the connected phone/computer | One bound device; per-device rate/bytes/deadline; already implemented for the lab |
| TV pass | Join the TV to Mesh; approve a pairing/sponsorship code shown by that device, then pay on the phone | Authorize the verified TV, not the paying phone. Correct Wi-Fi or Ethernet MAC, one session, product rate and expiry. Never use an indefinite bypass. |
| Family pass for up to N devices | Buy once; approved household devices join and claim bounded pairing invitations | One parent entitlement with at most N registered device slots and an explicit simultaneous-device ceiling; separate single-session bindings; shared expiry and optional shared data budget |
| Home-router service | Explicitly buy service for a household router whose downstream devices share its connection | One visible upstream binding, aggregate household rate/data/expiry; downstream device count cannot be reliably enforced from the upstream gateway when that router performs NAT |

Family products need **both per-device and household limits**. Example only:
three registered devices, at most three online, up to 3 Mbps each and up to
6 Mbps combined. Three devices do not each receive the full household cap;
the shared queue enforces the total. Prices, rates and device count need owner
approval; no such product was added. Separate households must not accidentally
share one aggregate queue.

Pairing must prove control of the target device; a typed MAC or matching payer
phone number alone is insufficient. Do not publish a list of everyone's devices
to the payer. Invitations are short-lived, single-use and bound to the intended
gateway/product. Device replacement revokes the old binding without restarting
time, replenishing bytes or sending Bitcoin again. That workflow, household
authorization and atomic shared accounting across gateways still need building.

A customer's tethered phone or NAT router can make several downstream users look
like one authorized connection. The upstream cap still limits their combined
traffic, but MAC/session limits alone cannot reliably count or forbid those
downstream devices. Define sharing/resale terms and investigate abuse; do not
advertise perfect tethering prevention or use fragile TTL tricks as identity.
Managed Mesh expansion APs should preserve guest-device visibility through the
designed access network. A NAT router is a different product/topology choice.

RouterOS defines rate limiting and simultaneous-user counts separately:
[official HotSpot documentation](https://manual.mikrotik.com/docs/authentication-authorization-accounting/hotspot-captive-portal/).
For longer passes, support privacy-preserving device recovery. On supported
iPhones, Fixed keeps a private address for this network; Rotating can change it
on open Wi-Fi. Do not require disabling privacy globally.
[Apple private Wi-Fi guidance](https://support.apple.com/en-us/102509).

## Gates before the field

1. Accept revised iPhone/Android payment completion and popup handoff; confirm
   an unpaid second device remains restricted and paid expiry/re-entry work.
2. Rotate previously shared production/router secrets and commission target
   management isolation, guest isolation and every IPv4/IPv6/offload path.
3. Finish a measured small-client soak and a backup/restore/alert exercise.
4. For 3WEST, enroll the actual serving gateway, match all product semantics and
   preserve existing balances. TV/family products stay disabled until their
   target binding and accounting tests pass.
5. Start the isolated field pilot under operator supervision, with a tested
   rollback and retained financial records. Expand only from measured results.

No changes were made to serving-router configuration, pricing, active customer
allowances or payment-provider accounts in preparing this handoff.
