# Mesh / 3WEST production review

Reviewed 6 October 2026, Africa/Nairobi.

**Pilot decision, 22:23 EAT:** supervised single-device home testing can continue;
an unattended public deployment or 3WEST replacement is not approved. No real
many-client stress test has been accepted. Nine live products do not match the
15-product reference: TV sponsorship, uptime/validity semantics and rates remain
gaps. The lab's observed package cap is 50 Mbps, while the existing 3WEST
reference is 3 Mbps symmetric. The Paystack/Engine KES 450 readiness check failed;
Bitika is the preferred lane, with accepted KES 10 evidence. No live charge was
requested by these checks.
[Detailed security, capacity and TV/family handoff](mesh-pilot-readiness-and-device-plans.md).

Start with the [current status and remaining gates](mesh-status-and-roadmap-2026-10-06.md)
and the [product roadmap](../PRODUCT_ROADMAP.md). The private tunnel recovered
on its original UDP 51820 endpoint and pinned VM-to-router SSH passed. Existing
HTTPS overlay activation at **21:30 EAT** restored active controller health and
billing readiness while preserving the ledger and blocking old HTTP joins.
Public forged-header and invalid loopback attestation rejection passed. A later
operator-approved KES 10 Bitika purchase delivered 86 sats to `spira@blink.sv`.
Its rejected `PENDING` acknowledgement was recovered with the original key and
payload, without another charge. The original router allowance is now active
after phone reconnection. The fix and customer progress/success screens are
deployed; the operator reports browsing works after retry. Physical acceptance
of the new completion/handoff remains pending.
[Payment incident and release](mesh-bitika-pending-ack-incident-2026-10-06.md).

**Latest security status, 6 October:** the earlier application hardening release
is live, including webhook/passkey body limits and keyed voucher lookup. One
unusable legacy ticket was rehashed without changing its value or counters.
Fresh signed-request replay protection and the voucher blocked-client budget
fix are implemented and regression-tested. The additive replay table was
installed at **21:31 EAT** and the dual-header controller has active cloud
health after its upgrade. The strict API is deployed and live read-only replay
and legacy-denial checks passed at **21:35 EAT**.
These operational milestones do not approve a
3WEST cutover. [Security release and recovery](mesh-security-release-2026-10-06.md).

Berty foreground messages were received both ways on lab Wi-Fi with WAN absent
and cellular off. Bluetooth-off, screen-off and cross-node operation remain
pending. Blink wallet refresh is accepted and its core allowances were
rechecked enabled. Apple push rules are now installed and verified only for
the operator iPhone `10.30.0.197/32`. Locked-screen delivery and actual Blink
notifications remain pending. [Notification trial](mesh-mobile-push-trial.md).

## Historical checkpoints and field evidence

The following dated checkpoints describe earlier states. Their active-service
or deployment-waiting statements do not override the current status above.

**Published update, 6 October, 15:34 EAT:** project owner access is restored.
Pocket tickets and the pending checkout/security/Bitika parsing patches are
published at `wifi.afribit.africa`. All 78 current regression tests and the
production build pass; read-only live alias checks verify database health,
nine packages and disabled payment without trusted guest ownership. The
controller is cloud-connected with no stuck orders or unresolved collections.
Primary serves photo-led free resources, the original Diploma link and a
prominent free-Mesh option. Blink wallet refresh on unpaid Mesh is operator
accepted. No new payment or voucher issuance was initiated. Physical acceptance
of this new catalogue/PDF/entry is pending; this is not a 3WEST cutover approval.
See [release evidence and rollback](mesh-pocket-tickets-release.md).

**Welcome and catalogue update, 6 October:** Primary now serves the revised
welcome page, plain-language “What is Mesh?” content, local Bitcoin SVG and
learning links for Bitcoin Kenya, Afribit and Insats. Unpaid IPv4 HTTPS
allowances cover the named domains and their `www` variants. These are
destination-IP rules: shared hosting can permit unrelated hostnames on the
same address. Physical unpaid-client acceptance and stricter production domain
isolation remain open. No paid allowance or payment was created.

The catalogue delay was partly fresh SSH authentication on each join. A
transport-reuse fix is deployed on the dedicated controller, with a fresh
router/device observation for every request. See [timing evidence](mesh-catalogue-latency.md).
Three [catalogue design studies](mesh-catalogue-design-options.md) and delegated
[physical voucher proofs](mesh-physical-voucher-cards.md) are available for
review; they are not a deployed catalogue replacement or issued voucher stock.

**Always-on controller update, 6 October:** the dedicated LunaNode controller
is active at [mesh-core.afribit.africa](https://mesh-core.afribit.africa/health),
with a private WireGuard connection to the Primary lab router. The laptop
automatic-access task is disabled and its two acknowledged ledger records were
preserved. Reboot recovery passes at 13:57 EAT: systemd services, trusted HTTPS,
WireGuard and pinned router SSH recover automatically. Physical phone
acceptance is still pending;
this does not authorize a 3WEST cutover. See the
[commissioning and recovery record](mesh-lunanode-controller.md).

**Bitika recovery update:** the operator shared Bitika's notice that its
28 September–5 October collection-provider outage ended on 6 October. New
references use `qadi_`. Parsing, webhooks and retained commissioning receipts
are patched locally to accept these references; signature, environment,
purchase matching, delivered-Bitcoin and duplicate-delivery checks remain in
place. Thirty-six payment tests pass, including the new format through the
signed webhook and duplicate fulfillment path. A live read-only KES 10 quote
returns 86 sats with a 3% quoted fee at 13:52 EAT; no collection was initiated.
The website patch is not yet deployed because the current Vercel login cannot
access the owning team. Paystack remains the active collection lane until a
new Bitika collection/settlement is verified.

**Architecture direction:** the [IP and LoRa review](mesh-ip-and-lora-direction.md)
compares the original community-network goal with the deployed lab. Wi-Fi/IP
remains the primary infrastructure; Meshtastic would be a separate optional
short-message network. Paid-internet readiness does not establish multi-site
mesh resilience or solve offline phone notifications.

**Verdict: the automatic payment/access model has lab acceptance, but the
existing 3WEST customer service is not ready for a direct cutover.** The public
website is live; that does not mean the serving router has been commissioned.
Current enrollment is specifically `KM-LAB-001`, its pinned SSH key/serial,
`KM-MESH-001` and `10.30.0.0/24`.

**Preparation update, 6 October, 11:02 EAT:** the additive device-reservation
schema is installed on the existing Mesh database; prices and existing orders
are unchanged. Next.js is patched locally to 16.3.8 and source-map-js to 1.2.2;
the runtime-only dependency audit reports zero known findings. The new checkout
protections, legacy-controller isolation and corrected admin readiness are
tested locally but **not deployed**: the current Vercel login can access only
Insats, not the linked `bitcoin-valley-wifi` project. Owner login is requested.

The new `npm run mesh:preflight` performs database inspection, a signed cloud
configuration check and Engine GET quotes without charging, settling or issuing
access. It reports **ready for home test**, a fresh Primary heartbeat, no live
failed/stale handoffs and no unresolved initiated collections. Field status is
**not ready**, with named commissioning blockers; a healthy payment lane is not
a field go-ahead. The full private evidence is
`artifacts/mesh-lab/private/production-review/runtime-readiness.json`.

The documentation agent prepared the
[home-to-field operations guide](mesh-production-operations.md), including
equipment roles, capacity, app policies, communication limits and go/no-go tests.
The home router also now hosts a permanent purchase entry at
**http://10.30.0.1/mesh.html**. Four uploaded assets were read back byte-for-byte;
previous files are retained privately. Firewall, DHCP and site configuration
were preserved. Real phone access after dismissing the popup remains pending.

## Evidence checked today

| Check | Result |
| --- | --- |
| `https://wifi.afribit.africa/api/health` | HTTP 200; database connected |
| Live catalogue | Nine hotspot prices match screenshots; every current package has a **50,000 kbps** cap |
| Desktop and 390 px mobile browser | All nine prices, M-PESA logo, no horizontal overflow or browser exceptions; payment disabled outside an attested Wi-Fi session |
| Spoofed checkout MAC/IP without gateway session | HTTP 401, before provider collection |
| Spoofed voucher device without gateway session | HTTP 403, before voucher redemption |
| Unsigned gateway / unauthenticated admin | HTTP 403 / 401 respectively |
| Enrolled gateway | Only `KM-LAB-001` found; heartbeat fresh |
| Read-only Engine quotes | KES 10: 85 sats; KES 450: 3,942 sats; both readiness checks pass at 09:56 EAT. These are quotes, not new payments. |
| WispMan TV page | Public six-plan catalogue matches screenshot prices; source IDs 10–15 |
| WispMan API | `index.php?_route=api/v1/plans` returns an empty **PPPOE** list. Further API queries received Cloudflare 1010; no customer export was obtained. |
| Authenticated WispMan documentation | Getting-started, clients, plans, billing, M-Pesa, routers, troubleshooting and FAQ read successfully. These describe intended behavior; they do not establish actual security enforcement or resolve the current plans' exact clock semantics. |

Private raw evidence is in `artifacts/mesh-lab/private/production-review/`.
The WispMan key is in ignored `.env.wispman.migration`; no ticket, payment,
subscription, router setting or active-customer record was modified through it.
The key's read scopes do not grant permission or capability to enroll/control
the serving router. The supplied admin login was used only to read documentation;
no operational changes were made. The resulting independent Mesh design is in
[device access and abuse controls](mesh-device-access-security.md). WispMan is
not a dependency of that implementation.

## Catalogue to preserve

All products: **3 Mbps upload / 3 Mbps download**, no data cap, FUP off.
Screenshots label `0 MB` as unlimited data, not a zero-byte allowance.

| Hotspot plan | KES | Time limit shown | Validity shown |
| --- | ---: | --- | --- |
| 1hr 20mins | 10 | 80 minutes | 1 day |
| 2hours | 15 | 2 hours | 1 day |
| 4hours | 20 | 4 hours | 1 day |
| 24hours | 30 | 24 hours | 1 day |
| 2days | 55 | None | 2 days |
| 3days | 85 | None | 3 days |
| 1week | 140 | None | 7 days |
| 2weeks | 230 | None | 14 days |
| 1month | 450 | None | 1 month |

| TV/static plan | WispMan ID | KES | Validity shown |
| --- | ---: | ---: | --- |
| 24HOURS TV | 10 | 30 | 1 day |
| 2DAYS TV | 11 | 55 | 2 days |
| 3DAYS TV | 12 | 85 | 3 days |
| 1WEEK TV | 13 | 140 | 7 days |
| 2WEEKS TV | 14 | 230 | 14 days |
| 1MONTH TV | 15 | 450 | 1 month |

These terms are represented separately in
[`lib/production/3west-catalogue.ts`](../../lib/production/3west-catalogue.ts).
Importing it does not update any database or router. A read-only parity check is:

```powershell
npm run mesh:catalogue-check -- artifacts/mesh-lab/private/production-review/mesh-catalogue.json
```

The current snapshot deliberately fails: speed differs, TV products are absent,
and the existing package schema cannot independently express uptime and
validity. Missing fields are reported as unrepresented; they are not proof that
FUP is enabled. A passing catalogue check is only catalogue parity, not router
or payment readiness.

The documentation separates validity, time limits and TV/static provisioning,
but an exact current-plan export or operator confirmation is still needed.
Confirm how WispMan starts validity (purchase vs first use), counts connected
time, expires unlimited plans and interprets “1 month” before implementation.
Do not silently turn 80 usable minutes within one day into an 80-minute elapsed
deadline, or assume a month means 30 days. RouterOS `limit-uptime` and an absolute
expiry watchdog serve different purposes.
[RouterOS HotSpot reference](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal).

## Device binding and abuse controls

The current automatic lane derives the socket peer's IP at the local join agent,
looks up its live HotSpot MAC/server, and obtains a signed cloud session. Browser
MAC/IP/router fields cannot override that session. One-use join tickets, a
private browser cookie and browser-owned status queries limit receipt theft.
Native users have random hidden credentials, a specified MAC, one simultaneous
session, speed/byte limits and an immutable router-local expiry. Customer login
credentials are not handed out. Repeating a purchase reference cannot reset its
deadline or repeat Bitcoin settlement; six-digit vouchers have durable limits.

Today's local changes add streamed byte limits for checkout, vouchers, gateway
calls and the Paystack receiver. New attested M-Pesa attempts also share durable
15-minute counters: 3 per router/device and 5 per normalized phone by default.
Changing a request UUID, browser MAC or join cookie cannot reset these counters.
Existing-reference retries bypass this new-attempt counter. Invalid/unavailable
counter storage fails closed before requesting a payment. Counter keys are
hashed and use a namespace separate from voucher attempts. These controls are
deployed on the home lane; they do not prove traffic-level enforcement on 3WEST.

The follow-up adds an atomic per-router/device Paystack purchase reservation.
Different checkout UUIDs cannot initiate overlapping new collections; ambiguous
provider outcomes retain the original reference without age-based release.
Existing initiated payments from before the table installation also block new
references. A crash before the send marker can resume the same unstarted
purchase; unexpired queued/claimed/active access blocks a new purchase. Tests
use actual SQL in isolated PostgreSQL and mocked provider calls. The additive
table and checkout code are deployed; current device reservations cover both
Bitika and Paystack. Browser-session recovery, explicit top-ups and simultaneous
voucher/payment policy remain separate work.

MAC binding is operational identification, not cryptographic ownership. MAC
spoofing and downstream tethering remain possible. The RouterOS user `address`
field alone does not restrict the source IP; the helper's observed-host checks
are part of the binding. Open Wi-Fi also needs HTTPS and app-level encryption.
Validate client isolation and management-network separation on the serving APs.

Phones' private addresses need explicit handling. Recent iPhones default to
rotating MAC addresses on open networks, changing them approximately every two
weeks. A monthly pass can therefore outlive its original MAC. For a first pilot,
use **Fixed** private address for Mesh; do not require disabling privacy globally.
Production needs proof-based device transfer that closes the old binding while
preserving remaining time/bytes and the original expiry. This transfer flow is
not implemented. [Apple private Wi-Fi addresses](https://support.apple.com/en-ie/102509).

TV purchases need a sponsor-device flow: customer pays on a phone for the TV's
Wi-Fi MAC, confirmed against a live host on the intended router. Use Ethernet
MAC only for an Ethernet-connected TV. Our current self-device checkout cannot
yet sponsor a TV. Never replace its metered allowance with an indefinite
HotSpot `bypassed` entry.

## Remaining production gates

| Priority | Gap | Required result |
| --- | --- | --- |
| Blocking | Only the lab router is enrolled | Serving-router inventory, verified SSH key/identity, per-router configuration and separate credentials; no substitution of the lab serial/key |
| Blocking | Plan semantics and TV path differ | Verified source export, separate validity/uptime policy and calendar semantics, all 15 products at 3 Mbps |
| Blocking | Existing paid customers have no migration mapping | Preserve each expiry, remaining uptime/data, binding and rate; no fresh allowance on import |
| Required release acceptance | Reservation schema and tested application patch are published | Complete physical guest checkout/recovery acceptance across the new release. No active-customer cutover is implied. |
| Required customer recovery | New browser session or changed device binding | Proof-based recovery/transfer preserving limits and original expiry; define top-up and simultaneous voucher/payment policy |
| Blocking for field | Serving gateway's join TLS is not commissioned | Primary lab TLS is active. Enroll and verify the target field handoff; a signed ticket's integrity does not conceal an HTTP browser secret. |
| Blocking | Target packet-path enforcement is uninspected | Guest IPv6 cannot bypass IPv4 HotSpot; guest FastTrack/offload cannot bypass payment gates or queues; management remains inaccessible |
| Required pilot check | Reconnect and DHCP address changes | Same device resumes its remaining allowance; changed IP cannot reset limits or strand a paid customer |
| Required pilot check | Captive dismissal remains partially accepted | Actual iPhone/Android payment completion and reconnect UX; commission CAPPORT/certificate where needed |
| Required operations | Dedicated LunaNode worker and reboot recovery are commissioned for Primary | Complete monitoring/alerting, ledger backup/restore and per-router field enrollment; local controllers require a separate handoff |
| Required fallback treasury operations | Paystack/Engine Bitcoin is supplied from a funded treasury | Reconcile KES, fees and BTC receipts; monitor/replenish liquidity. KES 450 readiness failed in the latest read-only check. Bitika delivers directly and must not trigger a second Engine send. |

The gateway claim route already polls pending payments independently of the
customer browser. It uses the same purchase reference and Engine receipt; a
closed captive window does not require another M-Pesa request. Production load,
outage recovery and alert handling still need commissioning.

Validation after the documentation-led checkout patch: **72 tests pass** (8
production guards, 29 automatic access, 35 payments). Financial effects are
mocked and database tests use disposable instances. The initial review had 70
tests; the two new cases cover device reservation and HTTP checkout concurrency.
The production build and typecheck pass;
targeted lint passes. Full lint has one pre-existing unused-expression warning
in `scripts/mesh/reconcile-nostr-lab.mjs`. Python inventory syntax compiles.
The parity command exits 2 for the current live snapshot, as intended; no
package update/seed, Vercel deployment or serving-router import was performed.

The subsequent preparation adds two meaningful checks: legacy-controller
isolation and read-only preflight decisions. **74 tests now pass** (10 guards,
29 access, 35 payments), with Next 16.3.8 build/typecheck and full lint passing
apart from the existing Nostr warning. Local captive browser checks cover the
permanent purchase entry at 320/390/430 px, fresh attestation, local assets and
existing entry/voucher gates. The public website still passes mobile/desktop
read-only checks, but remains on the earlier deployment.

Dependency fixes address the
[Next ImageResponse advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)
and [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
The current icon uses static values; this review does not establish exploitability
of the old application. Nine development-tool dependency warnings remain
(five high in the braces dependency chain, four moderate in the older esbuild
loader used by Drizzle Kit). Compatible fixes were applied; a forced downgrade
was not accepted as a production fix. Keep development tools private and review
their supported replacements separately. Zero runtime audit findings is not
proof of overall security.

FastTrack can bypass HotSpot and simple queues. HotSpot's IPv4 NAT enforcement
does not provide equivalent IPv6 authorization.
[MikroTik packet flow](https://help.mikrotik.com/docs/spaces/ROS/pages/328227/Packet+Flow+in+RouterOS),
[HotSpot IPv4 limitation](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal).

## Serving-router migration sequence

1. Obtain its private management/Tailscale address, SSH port/user and verified
   host fingerprint. Put credentials in ignored `.env.3west.router` with
   `ROUTER_HOST`, `ROUTER_PORT`, `ROUTER_USERNAME`, `ROUTER_PASSWORD`, and
   `ROUTER_HOST_KEY_SHA256`. Confirm whether this is a separate device from
   `KM-LAB-001`. The read-only collector is ready:
   `py scripts/mesh/collect-production-router.py`. It saves configuration
   sections privately and omits HotSpot passwords, RADIUS secrets and script
   bodies. Its syntax is checked; it has not run against 3WEST.
2. Obtain a read-only plan and remaining-customer-entitlement export through the
   operator's dashboard or verified API queries. The documentation review did
   not establish hotspot/static API query syntax. Compare the export against
   the manifest and live router profiles; preserve source payment records.
3. Take an encrypted router backup, private configuration export and copies of
   the existing captive assets. Verify a local recovery path and preserve the
   existing billing owner. Backup creation/recovery has not happened yet.
4. Stage Mesh on a separate test VLAN/SSID or spare router, with 3WEST catalogue
   rules and a separate enrolled gateway. Keep WispMan handling current paying
   clients; do not let two controllers issue conflicting allowances for the
   same production HotSpot.
5. Pilot one operator device: existing KES 10 price, **3 Mbps**, automatic
   activation, browser-close completion, reconnect, correct uptime/validity and
   expiry. Check an unpaid second device remains blocked. A live charge needs
   the operator ready to approve it; none was initiated by this review.
6. Cut over new purchases after the pilot passes. Let old paid allowances expire
   under WispMan, or migrate their exact remaining values after accounting
   checks. Switch the existing captive profile only after this mapping is ready.
7. Roll back only the staged Mesh assets/rules/controller enrollment if needed.
   Preserve all real payment and Bitcoin receipts; rollback must not send again,
   revive expired users or erase settled liabilities.

The router can host static captive HTML, logo, image and CSS. The Next.js
application, payment secrets, database and controller run on a server. The
RB951Ui-2HnD is MIPSBE; RouterOS container support is for other architectures,
so uploading the full Node application to that router is not the deployment
model. [MikroTik container requirements](https://help.mikrotik.com/docs/spaces/ROS/pages/84901929/Container).
The older `mikrotik/bitcoin-valley-hotspot.rsc` and current lab overlays are not
safe turnkey imports into the existing 3WEST service.

## Separate communication milestone

6 October home-pilot update: [Bitika-first checkout](mesh-bitika-primary.md)
is deployed with Paystack as backup, device reservations shared across both
providers, and verified Bitika receipts entering automatic router-bound
orders. Live read-only checks show both provider configurations ready, a
fresh controller heartbeat, and no unresolved customer collections or
outstanding activation jobs. A post-outage Bitika KES 10 purchase has verified
direct Bitcoin delivery, acknowledged access and reported working browsing
after recovery; this is not a field-cutover signoff. Official Blink/Signal
logos and the navigation fixes are installed on Primary. See
[app downloads and offline limits](mesh-app-installation-and-offline.md).

Jami foreground text/calls work in the offline pilot. Locked-screen offline
iPhone delivery needs an integrated Local Push Connectivity extension and
Apple's granted entitlement. Mac/Xcode and Developer-team availability are
still awaiting an operator response. See
[background-delivery options](mesh-background-delivery-options.md). This service
milestone does not block preserving prices or auditing paid internet access.
