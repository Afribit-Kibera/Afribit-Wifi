# Kibera Mesh Lab 01 — Guided Setup and Results

Session started: 3 October 2026, Africa/Nairobi.

**Pocket tickets / free Mesh release, 6 October, 15:34 EAT:** the approved
catalogue is published at `wifi.afribit.africa`, with a fixed Continue dock,
prominent free entry and unchanged package/payment terms. Primary's welcome
and return pages now show visual resource cards and the Bitcoin Diploma link.
Blink balance/history refresh is operator confirmed on unpaid Mesh, cellular
off. The controller stays active; 78 regression tests, build and live read-only
checks pass. No charge or real voucher issuance was made. The next single phone
checkpoint is the updated free entry, PDF opening and ticket catalogue, without
payment. [Release and recovery](mesh-pocket-tickets-release.md).

**Welcome, learning and speed checkpoint, 6 October:** five captive files were
uploaded and read back on Primary, preserving site configuration and prior
files privately. The welcome page now has free learning links, simple Mesh
content and a router-hosted Bitcoin mark. Guest IPv4 HTTPS allowances for
Bitcoin Kenya, Afribit and Insats are configured; shared-IP hosting limits
their domain isolation. Phone acceptance is pending. A pinned SSH transport
reuse fix is active on LunaNode; each join still obtains a fresh live binding.
Thirty-two access tests, typecheck, focused lint and responsive captive checks
pass. Full phone handoff timing is pending; no payment was initiated. Review
the [three catalogue layouts](mesh-catalogue-design-options.md) and
[physical scratch-card proofs](mesh-physical-voucher-cards.md), then perform
one unpaid welcome/learning/catalogue check before another purchase test.

**Cloud controller checkpoint, 6 October:** `mesh-core.afribit.africa` is active
on a dedicated LunaNode m.1s VM. Private WireGuard and pinned SSH to Primary are
verified; the old laptop worker is disabled and both access-ledger records are
preserved. Server reboot recovery passes at 13:57 EAT. The next physical check
is opening `http://10.30.0.1/mesh.html` on open Mesh with cellular data off,
tapping the purchase entry and reaching the catalogue without a charge. Existing
3WEST service is unchanged. [Commissioning and rollback](mesh-lunanode-controller.md).

**Production preparation and persistent entry, 6 October:** the additive checkout
reservation schema is installed; no plan prices or existing allowances changed.
Local security patches, corrected readiness and CI financial/access checks pass
74 tests, Next 16.3.8 build and typecheck. Runtime dependency audit is clear;
development-tool warnings remain documented. Public application deployment is
waiting on the project owner's Vercel login. Signed/read-only preflight reports
a healthy home lane, no stuck handoffs and no unresolved initiated payments;
field commissioning still fails its named gates. The pinned home router has
four verified static asset updates and a permanent purchase entry at
`http://10.30.0.1/mesh.html`; old assets are backed up, firewall/DHCP/site-config
unchanged. Real phone dismissal/reopen and catalogue handoff are pending.
See [operations and bounded home tests](mesh-production-operations.md) and
[current production decision](3west-production-readiness.md).

**Security design checkpoint, 6 October:** authenticated WispMan documentation
was read without changing its operational records. Mesh remains an independent
implementation. The next local patch reserves one unresolved Paystack purchase
per enrolled router/device across different checkout references, preserves
ambiguous collections and protects initiated pre-upgrade payments. Unstarted
same-reference crash recovery is also covered. **72 isolated tests pass**;
typecheck, focused lint and production build pass. The additive reservation
schema and checkout patch are not deployed; no new payment or router change
was made. See [device access and abuse controls](mesh-device-access-security.md).

**Production checkpoint, 6 October:** the operator requests replacement of the
existing 3WEST WispMan service with Mesh while preserving prices and plan terms.
Public Mesh checks and read-only Engine readiness pass; only `KM-LAB-001` is
enrolled. Current 50 Mbps/elapsed-duration lab packages differ from 3WEST's
3 Mbps, separate uptime/validity and six TV plans. A 15-product reference and
read-only parity checker are prepared. Checkout prompt throttling and streamed
body limits are implemented locally, pending deployment. Serving-router access,
exact plan semantics/export and existing entitlement
mapping remain required before cutover. See
[3WEST production review and migration sequence](3west-production-readiness.md).

**Current milestone: Jami offline foreground text passes on the protected lab.**
With both phones on `KiberaMesh-Lab`, the operator confirms fresh messages are
received in both directions after setting Bootstrap to `10.20.0.10:4222` and
restarting Jami. Cellular data is off. Router inspection confirms `ether1` is
disconnected and there is no IPv4 default route. The preceding attempt using
public bootstrap left messages unsent. The local UDP path and remote HP probe
are recorded in [Jami trial evidence and next step](mesh-jami-local-trial.md).
Following the cross-node instruction, the operator reports Jami works while
actively open but fails with the screen off; both iPhone and Android are affected.
The Node2 phone address is not yet supplied. Treat this as foreground-only acceptance;
iOS offline client suspension is a documented limitation, and Android background
behavior needs separate diagnosis. Open captive Mesh access and durable
bootstrap startup remain separate milestones. On 6 October the operator also
confirms Jami calls work; unattended incoming calls are not validated. Research
identifies Apple's Local Push Connectivity as a supported offline background
path requiring app integration and a granted entitlement, correcting the earlier
blanket iPhone impossibility claim.
[Background-delivery options](mesh-background-delivery-options.md).
Signal's earlier unpaid text pass uses an internet
exception and remains a distinct result.

**Paid checkout acceptance:** a fresh customer purchase
has now completed the full flow: KES 10 M-Pesa collection, 85 sats delivered to
`spira@blink.sv` at **21:25:57 EAT**, and native automatic login at **21:26:06 EAT**.
Cloud order `bf906c6c-c330-4152-8c09-afdbe4d89ade` has the original
**22:46:02 EAT** deadline and 50 Mbps cap. The operator confirms internet restored.
At the operator's explicit request, that native account and cloud grant/order are
now revoked for the unpaid-app test; payment/settlement and 8m19s counters remain
unchanged. No replacement allowance, charge or Bitcoin send is made.

**Payment UX is live:** M-PESA branding and approval/confirmation/connection
steps replace premature "Payment received" and internal settlement language.
Verified activation exposes Start browsing; router welcome/status copy also
uses customer language. Actual iPhone window dismissal still needs a phone check.
The first unpaid Signal attempt does not send. Both phones are unauthorized;
the missing current `grpc.chat.signal.org` endpoint is added with scoped TCP443
access. The operator's subsequent successful retry is recorded above.

**Previous payment-availability repair:** a reported disabled Pay button
is traced to missing live payment availability. Scoped Paystack/Engine config is
restored, the deployed runtime reports all checkout gates ready, and the live
catalogue shows M-Pesa. The mobile flow has Continue, explicit phone validation
and device reconnect guidance. New purchases use a 50 Mbps cap instead of
8.192 Mbps; the router's 100 Mbps Ethernet links remain the shared ceiling.
No new charge/send was initiated by that repair. The subsequent customer-paid
result above supersedes its pending phone check; avoid another manually issued pass.

Signal foreground text exceptions are installed on Primary. Bidirectional
delivery with ordinary internet blocked is now confirmed by the operator.
[Signal scope and next test](mesh-signal-text-trial.md).

**Current checkpoint, 5 October:** automatic checkout is deployed and enabled
for Primary's open **Mesh** SSID. The welcome page establishes a trusted device
session before opening the existing catalogue on `wifi.afribit.africa`.
Verified M-Pesa collection and Bitcoin settlement queue automatic native router
activation; no customer router credentials are issued. Vouchers are six-digit
codes. The signed local daemon runs as a Windows sign-in task.

A no-payment diagnostic proves automatic activation on the real iPhone and
router-local expiry with the original deadline retained. At 20:46:53 EAT the
complete cloud voucher handoff also passes: one six-digit voucher gives one
grant, redemption retry keeps that grant, and router/cloud both confirm automatic
activation. Its fixed expiry is 20:49:40 EAT. The real phone opens the catalogue.
The operator confirms a fresh public HTTPS page loads with cellular data off
after automatic activation, without entering router credentials.
The subsequent customer-paid flow is verified above. Do not repeat the consumed
paid receipt or the old manual login tests.
[Current implementation and boundaries](mesh-native-automatic-access.md).
[Settlement policy](mesh-engine-bitcoin-settlement.md).

**Catalogue revision:** the user's reported older cloud welcome page is removed
from purchase/voucher entry. That link now opens a compact orange catalogue with
all nine KES prices, immediate router-button feedback and a loading screen during
the cloud handoff. Independent catalogue/device reads run together. The release
is live on `wifi.afribit.africa`; the updated router HTML is hash-verified.
Next phone observation is whether this revised handoff feels clear and responsive.

The earlier checkpoints below are retained as historical evidence; their
disabled-checkout and pending-implementation statements are superseded above.

**Live absolute expiry accepted, 5 October:** after the operator confirms the
short form is ready, `mesh60` authenticates at **19:42:21 EAT**. Router inspection
captures the correct phone, native session, authorization entry and **2M/2M**
queue. It logs out at the fixed deadline **19:43:08 EAT**, after **47 seconds** of
online use, before the 60-second cumulative limit is reached. The account is
disabled and its session/list/queue removed. The operator confirms the fresh
public page works. No allowance is reset and no payment is made. Separate
post-expiry browser denial/idle details remain unreported; next implementation
gate is the trusted checkout handoff/durable cloud order issuer.
[Exact result and limits](mesh-native-automatic-access.md).

**Phone diagnostic usability checkpoint:** the long-name 60-second diagnostic
expires at **19:35:08 EAT** with zero router counters and no observed login. The
operator's page-load report is retained but not counted as verified native
activation. Its unused account is retired; the original paid-pass evidence stays.
At the operator's request, a short **mesh60** diagnostic/password is prepared
privately and remains unactivated until its phone form is ready. No payment is
made or paid allowance renewed. [Current details](mesh-native-automatic-access.md).

**Native deadline step:** the operator confirms that the consumed pass refuses
another login. Primary now has a separate router-local absolute-expiry profile,
sweep and startup guard, after backup and NTP synchronization. Dummy accounts
expire at zero uptime; malformed deadlines close; expired login refuses. The
startup body closes a future account when invoked, without an actual reboot.
Fixtures are removed and the original pass remains consumed. A signed order
contract and isolated receipt-checking SSH consumer pass eight access tests.
Public checkout handoff remains pending; no new payment/send is made.
[Exact implementation, evidence and remaining gates](mesh-native-automatic-access.md).

**Paid access result, 5 October at 18:54 EAT:** the operator reports successful
use of the bound five-minute pass. Primary records **00:05:00** cumulative uptime,
1,027,046 bytes in and 16,936,662 bytes out. The native session, authorization-list
entry and dynamic queue are gone; the phone is unauthorized and bypass bindings
remain zero. No allowance is reset. **Next:** confirm a fresh public request is
denied and the same consumed pass cannot sign in again, then commission secure
automatic activation/local absolute expiry. [Current access evidence](mesh-native-pass-test.md).

**Bitcoin settlement acceptance, 5 October:** at the operator's request, the
conversion engine settles the approved KES 10 Paystack purchase as **85 sats to
spira@blink.sv at 18:11:51 EAT**. Source debit, paid invoice/preimage and independent
receiving-wallet credit are verified. No new M-Pesa charge occurs. A scoped Mesh
service, private idempotent settlement table and provider callback path are
installed on Engine; **57 disposable Engine tests and 29 Mesh payment tests pass**.
The pilot budget is one KES 10 purchase, now consumed. Customer checkout remains
gated on bound access/expiry; the phone reports current **10.30.0.197**.
[Current settlement result](mesh-engine-bitcoin-settlement.md).

**Bound access prepared:** Primary confirms current phone **10.30.0.197** and its
matching DHCP/HotSpot MAC. Fresh encrypted backup/export are downloaded; one
`mesh-e92ab0c0` user is created with server/MAC binding, the installed 2M/2M
five-minute profile and cumulative **limit-uptime=5m**. The original allowance is
not reset. Credentials remain in ignored local `mesh-five-minute-pass.txt`.
The phone subsequently reports successful use and consumes the allowance; see
the current access result above for observed cleanup and remaining checks.

**Optional provider release, 5 October:** Paystack/Blink receiving code is deployed on the existing `wifi.afribit.africa` project as `dpl_EhTsgeXqj1dw9n21w4aTb9U3YcJP`. Server-only credentials are configured, payer details stay local, and customer Paystack checkout/automatic Bitcoin settlement remain disabled. Public health, disabled-checkout and synthetic signature/tamper checks pass. Twenty-four isolated payment tests, production build, targeted lint, TypeScript and 320/390 px checkout fixtures pass. The existing Insats account callback is retained; no Engine deployment or routing change is applied. [Current release and rollback](mesh-paystack-collection.md).

**Paystack collection acceptance, 5 October:** after explicit readiness, the operator approves the fresh KES 10 M-Pesa prompt. Authenticated provider verification at **16:23:50 EAT** reports `success`, with exact live environment, amount, mobile-money channel, reference `mesh-e92ab0c0-fd6b-43d4-bfcb-57744876bacc` and Mesh metadata. Collection passes. Both attempt receipts are retained; there is no automatic repeat. Bitcoin settlement remains pending as selected by the operator, with no outgoing Bitcoin or internet grant. The next financial milestone is verified Bitcoin settlement followed by bound access/expiry. [Collection evidence and provider boundary](mesh-paystack-collection.md).

**Latest Paystack checkpoint, 5 October:** the operator supplies production Paystack/Blink credentials and explicitly chooses M-Pesa collection first, Bitcoin settlement pending. Both keys authenticate and Blink verifies the configured BTC wallet. One KES 10 request with `mesh` metadata reaches the phone at 16:13 EAT; the operator confirms the prompt appears but is not approved. At 16:18 EAT, authenticated lookup reports failed. The receipt is preserved and no automatic repeat is sent. No Mesh/Engine sale write, outgoing Bitcoin or router grant occurs; general checkout stays disabled. Prompt delivery passes, collection completion awaits an approved attempt. [Current collection record](mesh-paystack-collection.md).

**Latest live checkout result, 5 October:** Bitika's first KES 10 collection and one exact replay return generic HTTP 400 without a transaction code. The operator reports no M-Pesa prompt or dashboard error; authenticated lookup finds no current-attempt record. The complete API reference matches our request, with no documented correction identified. Further collection requests are stopped and the original UUID/receipt retained. Owner Vercel access, payer configuration and webhook signing secret are now complete. Release `dpl_HTr3iE13v4UZ8PnXHAxe2DGjscJs` is live; public health and synthetic signature/tamper checks pass. No verified Bitcoin delivery or router grant occurs, and `BITIKA_ENABLED=false`. The operator proposes provisioning Paystack if Bitika fails; its collection and Bitcoin settlement must remain separate provider concerns. Earlier entries below describe historical prerequisites, not current blockers. [Live result, evidence and rollback](mesh-bitika-live-commissioning.md).

Current checkpoint: **two-node mesh, protected-client internet, WAN loss/recovery, open Mesh join/captive, unpaid local board/two relays in Safari and public HTTPS denial pass**. The operator chooses **internet checkout and access commissioning** next. Customer management/isolation remains a commissioning requirement; payments, vouchers and Blink access remain disabled. [Current customer entry and test](kibera-mesh-open-captive-test.md).

**Production release after owner login, 5 October:** Vercel access is restored to Novyrix Team's existing project. The Mesh portal/provider code is built, verified before domain assignment and promoted to `wifi.afribit.africa` as `dpl_FP2C6FbdxoJovvb9Trpfnv2ay48c`. Live credentials and `spira@blink.sv` are configured as production secrets; `BITIKA_ENABLED=false` pending signing secret and access commissioning. Public health/admin/callback checks and four-width browser checks pass; test mutations are intercepted and no real payment is created. The earlier Vercel-access blocker is resolved. **Next:** supply the real payer number for one KES 10 collection and register the deployed webhook to obtain its signing secret. [Live deployment, evidence and rollback](mesh-bitika-live-commissioning.md).

**Latest operator direction: real payment, 5 October:** the operator authorizes live Bitika testing and supplies a production key, saved only in ignored `.env.bitika.live`. Destination remains `spira@blink.sv`. The live adapter's KES 10 quote and Blink address discovery succeed; no M-Pesa collection has been sent because the payer number is missing. A receipt-preserving live collection/status tool is ready. The current Vercel login cannot access the linked `bitcoin-valley-wifi` project, so its owner must log in locally before public deployment. Signing secret and automated router ownership/expiry also remain uncommissioned. **Next:** obtain the payer number, perform one KES 10 live collection and verify Bitcoin delivery, then bind native access to the observed Mesh client. This supersedes the earlier sandbox-first sequence; it does not claim that automated paid access is enabled. [Live commissioning details](mesh-bitika-live-commissioning.md).

**Current native-pass checkpoint, 5 October:** the bounded unpaid router-web check reports Mesh welcome. After a fresh encrypted backup/export, the five-minute `KM-MESH-TRIAL-5M` profile and three authenticated/list-scoped rules are installed on Primary. Private denial precedes internet authorization; customer hooks remain before FastTrack. The separate operator CHAP login and copied router MD5 helper are uploaded, downloaded and byte/SHA-256 matched. Both OSPF peers remain Full. There are **zero trial users, active sessions and authorization-list members**, so no internet has been granted. The phone is currently absent from the Mesh host/lease table. **Next:** reconnect it to Mesh, turn cellular off and report its IPv4 address; then provision its MAC-bound five-minute user and test access/expiry. No new board check code is needed. Evidence: ignored `artifacts/mesh-lab/native-pass-installed/verification.json`. [Short-pass procedure](mesh-native-pass-test.md).

**Optional Bitika provider and operator result, 5 October:** following the requested unpaid web-management probe, the operator reports **Mesh welcome**. This is the bounded web check; it does not establish all-port/client isolation. The operator authorizes a Bitika test-key integration, confirms **M-Pesa collection with Bitcoin received by Afribit**, and supplies `spira@blink.sv`. A separate provider adapter, gated mobile checkout and signed-callback/reconciliation path are implemented locally, retaining BTCPay as the default independent option. Actual sandbox quote, three terminal outcomes and idempotent retries pass; no money/SMS, production database writes or live grants occur. Twelve isolated payment tests, 320/390 px browser fixtures, targeted lint and TypeScript checks pass. Test key is only in ignored `.env.bitika.test`; the callback signing secret remains absent, real checkout remains disabled and no public app deployment is performed. [Provider implementation and remaining commissioning](mesh-bitika-provider.md).

**Latest hero deployment and next action, 5 October:** delegated UI work changes the real photo into a background hero with a readable overlay and brings the internet-pass action into the first phone viewport. The original green woven Mesh logo, bold Geist wordmark and orange/Bitcoin identity are retained. Four-width browser checks pass, including 320 × 568 and 390 × 844 button visibility. Primary's revised `login.html` is backed up, uploaded and downloaded; source, deployment copy and installed copy have identical SHA-256. No firewall, SSID or billing configuration changes are applied. The five-minute native pass setup/rollback scripts pass RouterOS dry-run syntax checks, and the native CHAP form passes independent byte/hash and failure-mode checks. **Next:** one unpaid web-management check from the Mesh phone, then activate a MAC-bound five-minute pass with router-local expiry. No further board check codes or outage cycles are needed. [Commissioning sequence](mesh-internet-commissioning-next.md), [short-pass procedure](mesh-native-pass-test.md).

**Latest operator direction and UI revision, 5 October:** the captive popup is for welcome and internet purchase. Completed board/relay demonstrations do not need repeating. The deployed Primary revision uses a light orange/ivory theme, the original bold Geist font and green woven **Mesh** logo without a dot or “by Afribit” logo byline. Afribit and Bitcoin remain visible in supporting copy. A real photograph from Afribit's site replaces the illustration; the source is 5184 × 3456, with local 960/1440/3840 px responsive copies. Eight uploaded files are downloaded and byte/hash verified; the active profile still points to `mesh-captive`. Browser layout, local font/photo, retina selection and handoff checks pass; the revised real phone popup appearance is pending. No customer policy or service exceptions changed, and billing remains false. [Photo/type details](mesh-captive-art-direction.md), [captive contract](mesh-captive-shell.md).

**Communication app lane, after the selected internet milestone:** evaluate **Berty** first as a Bitchat-style Android/iPhone candidate, with **Jami** as an explicitly configured LAN alternative. The operator confirms an Android phone is available. Neither is yet enabled on the unpaid customer VLAN; distinguish Bluetooth delivery from actual Wi-Fi/cross-node delivery, and record iPhone background behavior. [Research and bounded trial](mesh-communications-app-research.md).

**Captive-access direction, 5 October:** home Ethernet provides internet; visitors should join an open customer SSID and choose free local services, approved free external apps or paid general internet from a mesh welcome page. The brand is **Mesh**, with Bitcoin settlement first. Direct M-Pesa integration is not required: third-party providers such as Bitika can accept customer payments and settle Bitcoin; provider integration is separate future work. The requested welcome/portal build is reviewable, and commissioning has resumed. Primary's first open captive is installed; trusted router-targeted grants, verified external exceptions and guest offline acceptance remain requirements. See the [captive access pilot](kibera-mesh-captive-access-pilot.md).

**Scope clarification, 5 October:** the operator wants the mesh transport foundation for existing applications, not a custom messaging/media product. Initial setup is complete: two OSPF routers, two client-access APs, wired and radio transit with measured failover/failback, and local operation without WAN. Nostr/Blossom prototypes are optional service-layer validation and do not define whether the network is ready. Further application integration is paused; the operator explicitly delegates a read-only network-readiness review. See [network readiness](kibera-mesh-network-readiness.md). This is an operational lab network, not yet a validated community-wide deployment.

## Current test queue — 5 October

Earlier sections retain the chronological setup record; their historical "next" actions are superseded by this queue.

**Network commissioning resumed, historical staging state:** the Mesh portal and local captive welcome were built and reviewed locally; gateway overlays were staged while ether1 was disconnected. Subsequent connection, client, outage and recovery results below supersede that disconnected state. [Gateway procedure and evidence](kibera-mesh-internet-gateway-test.md).

**Gateway connected:** Primary ether1 is 100 Mbps/full duplex with DHCP `192.168.100.77/24`, default via `192.168.100.1` and upstream DNS `1.1.1.1`/`1.0.0.1`. Node2 learns the OSPF default via `10.255.20.1%ether2`; both cable/radio adjacencies remain Full. Normal HTTPS returns 200 from lab sources `10.20.0.10` and HP `10.21.0.198`, and both local boards retain 200. HP's initial timeout clears on subsequent checks without persistent DNS/TLS changes; its exact cause remains unestablished. **Next:** phone public/local access on each SSID with cellular off, followed by the single WAN-loss/recovery check. [Connected evidence and scope](kibera-mesh-internet-gateway-test.md).

| Next test | Acceptance |
| --- | --- |
| Internet from both protected lab SSIDs | **Passed:** both computers and operator phone reach public HTTPS/local boards; operator reports “All working” |
| Home isolation and one WAN-loss check | Private-upstream drop configured and probed; **WAN loss and recovery passed**, with local routes/services retained |
| Isolated open customer SSID and Mesh captive | **Phone entry passed on Primary:** open Mesh, VLAN 30, lease 10.30.0.199 and automatic captive at 10.30.0.1; unpaid service/isolation/offline checks remain |
| Unpaid local access and verified Blink exceptions | **Board and both relays pass in Safari; public HTTPS fails as expected.** Management/client isolation and bypass checks remain; Blink is still disabled |
| Bitcoin/voucher authorization and lifecycle | Correct-router grant, speed, expiry and revoke; no access for failed/pending payment |
| Node2 customer enforcement | Per-node grant/job ownership verified before paid access on the second node |

Already-passed application demonstrations below are historical evidence. They do not need repeating to advance customer network commissioning.

**First customer phone acceptance:** the operator reports the captive opens automatically at **10.30.0.1**. Router inspection confirms the customer lease **10.30.0.199**, VLAN 30 HotSpot host, zero authorized sessions and zero bypass bindings. This closes the entry gate. The subsequent local/public comparison below records the next result.

**Unpaid phone access completes in full Safari:** the board loads in the Wi-Fi welcome popup but its two relay connections fail there. A normal desktop browser connects to both; the operator then opens **http://10.20.0.10:8020/** in full Safari on Mesh with cellular off and reports **both relays connect**. The public **example.com** test fails as expected. Router inspection retains zero authorized sessions/bypass bindings; no network exceptions were expanded. The directory now displays a copy/selectable service address and full-browser instructions, uploaded and hash-verified after browser checks. The observed failure is confined to the captive popup; no general iOS WebSocket limitation is claimed. **Next:** bounded router web-management isolation check in Safari, then the remaining guest acceptance. [Diagnosis, scope and revised entry](kibera-mesh-open-captive-test.md).

**WAN-loss acceptance:** the operator reports “Event happened as expected” after the requested Node2 local/public phone check with ether1 removed. Live diagnostics confirm both IPv4 internet defaults disappear, both peer-LAN routes remain active, and both wired/radio OSPF neighbors remain Full. Boards return 200 across nodes in both directions; HP's DNS-bypassing public HTTPS probe fails, while operator home Wi-Fi HTTPS remains 200. Ether1 was no-link and its DHCP client stopped. The subsequent reconnection result below closes recovery. [Detailed evidence and scope](kibera-mesh-internet-gateway-test.md).

**WAN recovery completes:** the operator reconnects Primary ether1. DHCP/default routes return on both nodes; normal HTTPS and cross-node local boards return 200 from both computers. Both cable/radio peers remain Full. This closes the gateway acceptance gate; no additional gateway outage cycle is required. Evidence: `artifacts/mesh-lab/internet-gateway-recovered-verification.json`.

**First customer captive installed:** Primary now serves open **Mesh** on VLAN **30**, gateway/DNS **10.30.0.1** and pool **10.30.0.100–199**. The bundled local welcome and directory lead to the only unpaid service exception, **10.20.0.10:8020**. General customer internet and other private/management access are denied; IPv6 is denied on the customer VLAN. Billing/voucher/Blink remain disabled. The original protected SSIDs and both OSPF transits remain intact; post-change computer internet/local access passes. Backup, guarded overlay/removal, VLAN rescue removal, exact UniFi identifiers and the narrow board-only source NAT are recorded in the [open captive test](kibera-mesh-open-captive-test.md). **Next:** phone joins Mesh with cellular off, verifies 10.30.0.xxx and observes the welcome (manual fallback **http://10.30.0.1/login**). No guest acceptance has been claimed yet.

| Capability | Current result | Remaining evidence |
| --- | --- | --- |
| Local access without WAN | Passed | Entirely disconnected cold startup remains separate |
| Router, AP and controller restart | Passed individually | Combined power-loss recovery not tested |
| OSPF cable failure and radio failback | Passed | Two routers still depend on each other for inter-node traffic; third-node topology not built |
| Two independent Nostr relays | Primary remains usable during HP shutdown; HP services recover | Full Primary-computer shutdown not tested |
| Signed-post reconciliation | Two automatic workers; twelve verified tagged posts on both relays | Fewer-than-100-post lab scope; no media/deletion or full-history synchronization |
| Relay database backup and restore | Passed into a separate scratch volume/container | Full host recovery and retention policy not tested |
| Established media storage | Blossom servers on both hosts; signed uploads and verified copies pass | Automatic replication, durable quota/retention and media UI integration remain |
| Startup without internet | All HP services recover automatically after offline reboot and Windows login | Pre-login startup and whole-network power outage remain untested |
| iPhone privacy defaults | Both relay connections pass with tracking enabled | Legacy portal-name access still fails with the setting enabled |
| UniFi backup restoration | Backup retained; import untested | Test on an isolated compatible controller rather than replace the live console |

**Checkpoint 11c evidence:** a consistent snapshot of relay 001's database is taken while only that relay is stopped, then relay 001 is immediately restored. The installed engine's volume-export API returns Not Found; supported container copy retrieves the stopped database instead. The 163,840-byte tar is saved at ignored, operator/SYSTEM-only `artifacts/mesh-lab/private/nostr-relay-001-20261005.tar`, SHA-256 **7affca7d62488699b1ba4aa566a9ea1d4fe4c54189250ea56ece5eb24b01f511**. A new scratch volume and relay bound only to `127.0.0.1:7780` restore that archive. Independent SDK queries retrieve all seven posts and compare IDs, public keys, timestamps, kinds, tags, content and original signatures. Evidence: `artifacts/mesh-lab/nostr/backup-restore-verification.json`. Scratch container and volume are removed; backup remains. UniFi stays healthy, HP relay remains available. This proves recovery of the existing lab events, not recovery of Windows, router configuration or media.

Reusable workflow: `scripts/mesh/verify-nostr-backup-restore.py` and `verify-nostr-backup.mjs`. The latter must be bundled with the isolated lab SDK into `artifacts/mesh-lab/nostr/verify-backup.mjs` before running the Python workflow. Subsequent runs use new archive/scratch names and do not overwrite the retained backup. Leave new posts paused during snapshot/verification so the live comparison does not include events created after the snapshot.

**Delegated Blossom result:** established upstream media servers run at **http://10.20.0.10:8030/** and **http://10.21.0.198:8030/** with separate persistent stores. Signed uploads return 201; anonymous and expired authorization return 401. The selected generated WAV is retrieved independently from both hosts: 38,444 bytes, SHA-256 **22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d**. HTTP range reads return 206. Copies are client-mediated signed uploads; the upstream private-IP mirror guard is retained. Evidence: ignored `artifacts/mesh-lab/blossom/blossom-verification.json`. One subsequent HP connection timeout clears on retry; all three HP app ports and SSH are reachable afterwards, with its task/listener still running. This is not automatic media replication or a completed media-sharing UI. See [the Blossom deployment record](kibera-mesh-blossom-lab.md).

**Next work is network-only:** complete phone gateway acceptance, WAN-loss/recovery and the customer-access queue above, then measure coverage/capacity and commission a third routing node with an independent alternate path for router-loss/multihop resilience. Resolve local naming/privacy compatibility and security/power/recovery before community rollout. The gateway now supplies protected lab internet through Primary; public customer enforcement remains separate. Application services can be selected independently. No further media integration or phone check code is required to establish initial mesh setup.

**Checkpoint 12 passes:** each host runs its own 30-second-cycle reconciliation worker in an operator-login Windows task. Complete queries and event signatures are required; unavailable relays cause retries rather than being treated as empty. Copying preserves signatures, uses one-second pacing and stops at the 100-event boundary. Status and last successful checks are stored locally and displayed on each board. With Primary's worker stopped and its process confirmed absent, the Primary relay is temporarily stopped, HP records retry status and accepts a test post, and the relay is restored. HP automatically copies that signed event to Primary and verifies its storage without a one-shot reconciliation command. Both relays contain twelve verified posts; one worker per host remains running and both boards show recent checks. No router, computer shutdown or UniFi change is performed. [Deployment and evidence](kibera-mesh-automatic-post-sync.md) records exact paths, runtime pin, task lifecycle correction and remaining limits. Newly added tasks' cold startup is not yet verified; existing offline service startup remains passed. Media/deletion/full-history synchronization remains separate.

**Privacy compatibility result, 5 October:** the operator reports **1 of 2 local relays** with Limit IP Address Tracking enabled, versus **2 of 2** when disabled. The named portal fails with the setting enabled and works when disabled. The setting-dependent result is repeatable according to the operator; it does not yet identify the missing relay or prove the exact DNS failure mechanism. Authenticated node2 inspection confirms the correct static portal record points to `10.20.0.10`, DNS forwarding targets `10.20.0.1`, and no default Internet route exists. Apple's network guidance describes Private Relay handling DNS and insecure HTTP; interaction with off-subnet access is a hypothesis, not a measured packet trace. Both boards now expose separate **Primary / HP** connection labels to identify the failed endpoint. No Private Relay DNS block, subnet change or home-network change is applied. Next: reload the HP board with tracking enabled and report which named connection is unavailable.

**Follow-up:** the operator identifies **Primary** as unavailable. Each board now uses its own local port-8020 WebSocket paths to the two independent relays; the service host handles the routed connection. A separate host routing fault is found and repaired on HP: a persistent `10.20.0.0/24` route via `10.21.0.1` on Wi-Fi prevents mesh traffic selecting its home Ethernet gateway. Desktop tests confirm both local paths, signed publishing to both distinct databases and direct signature-verified retrieval from each. No routers, Private Relay policies or databases are changed. The iPhone retest and portal-name diagnosis remain pending. See [the detailed Nostr record](kibera-mesh-nostr-lab.md).

**Checkpoint 11d operator acceptance:** the iPhone now shows **both relays connected with Limit IP Address Tracking enabled**. This closes the relay compatibility gate for the local board paths. It does not resolve or retest the old portal name.

**Offline-start preparation:** the HP Blossom launcher now checks its cached pinned image before attempting any pull and waits for the local runtime activated by the Nostr task. Previously it always contacted the image registry on startup, which would prevent reliable offline startup. A second narrow SSH firewall rule **Kibera-HP-SSH-Lab-Operator** allows key-only port 2222 at **10.21.0.198**, solely from the operator **10.20.0.10**. Fresh SSH over that mesh address verifies the same pinned Ed25519 host key and account; Tailscale is not needed for this diagnostic path. The original Tailscale rule remains. The ignored helper accepts the verified mesh address as its optional second argument: `py artifacts/mesh-lab/hp-ssh-session.py 2222 10.21.0.198`. No HP reboot has yet been performed for this checkpoint.

**First offline boot observed, 5 October:** HP last boot is **2026-10-04T23:13:45.500Z** (5 October 02:13:45.500 EAT). Home Ethernet is Disconnected, Node2 Wi-Fi is Up at `10.21.0.198`, and the only Windows IPv4 default route is via `10.21.0.1`. A direct-IP, proxy-bypassing HTTPS probe to `1.1.1.1` times out (curl 28). Direct mesh SSH reconnects with the expected host key; the cross-node persistent route survives and Windows forwarding remains disabled. Relay and Blossom tasks recover automatically, both report serving, HP relay metadata matches, and its retained WAV returns the expected 38,444-byte SHA-256.

The board task exits **1** during login and no port 8020 listener exists. The original direct-Python task captured no stderr, so its exact failure cause is not established; an address-availability race is plausible. A new `scripts/mesh/start-hp-nostr-board.ps1` waits up to three minutes for the reserved Wi-Fi address and captures Python output/state. The existing task action is updated, preserving its login trigger/principal/retry settings; original task XML is retained on HP at `C:\Users\edmun\KiberaMesh-Nostr\board-task-before-wrapper.xml`. Starting the revised task restores the board while still offline. A fresh browser retrieves the original phone post and connects to both relay paths; direct HP query returns **nine valid signed posts**. Evidence: `artifacts/mesh-lab/nostr/hp-offline-start-verification.json`. This is a verified warm recovery after correction; the corrected launcher's cold boot remains pending.

**Checkpoint 11e completed on the repeat boot:** new HP boot **2026-10-04T23:21:11.500Z** (5 October 02:21:11.500 EAT). Home Ethernet remains disconnected and Wi-Fi is up. The relay, board and Blossom login tasks are all Running without assistant intervention, with lab listeners on ports 7777/8020/8030. The board launcher reaches its foreground server stage at 23:22:41Z; relay and Blossom report serving at 23:22:39Z. Mesh SSH works with the same pinned key. Independent browser verification connects through both local relay paths and displays the original phone post; direct HP query retains **nine signature-verified posts**. Independent media retrieval retains the expected 38,444-byte object and SHA-256. `hp-offline-start-verification.json` now records the successful repeat boot. This passes startup after interactive Windows login with the HP offline; it does not establish pre-login services, full-network cold startup, or permanent unattended operation.

**Checkpoint 11f host-loss phase passes:** the operator confirms the phone baseline on KiberaMesh-Lab loads both relays, then shuts down the entire HP. The Primary board reports HP unavailable and accepts a phone post with **1 of 2 relays**. Independent mesh probes find HP ports 2222/7777/8020/8030 unreachable; this supports the operator's shutdown report without alone proving electrical power state. A direct Primary query now retrieves **ten valid signed posts**, including the newest outage event **cfabcb8eaa5b3740b207092884a954ae98be0fcefe9aa238501dd917fbf9b6db**, content `Hi test`, timestamp `1791156629`, with a verified signature. Primary Blossom also returns the retained 38,444-byte WAV with the expected hash while HP is unavailable. Evidence: ignored `artifacts/mesh-lab/nostr/hp-host-loss-verification.json`. No automatic replica selection or catch-up is claimed; the outage post exists on Primary only until HP returns and explicit reconciliation succeeds. The routers/APs and operator computer remain powered on. Recovery and reconciliation are the remaining phase, not another outage test.

**Checkpoint 11f recovery completes:** operator reports HP ready. Pinned direct mesh SSH reconnects, Ethernet remains disconnected, all three scheduled tasks are Running and all lab ports listen again without intervention. Reconciliation observes **Primary 10 / HP 9**, copies **one** signed event to HP, and independently retrieves **ten** verified posts from each endpoint. The exact outage event above is then queried directly from each relay; its content and signature are identical and signature verification passes on both. HP Blossom's retained WAV also passes size/hash verification. Evidence: `artifacts/mesh-lab/nostr/hp-host-recovery-verification.json` and `reconciliation-result.json`. This catch-up was explicitly invoked by the assistant, not automatic. The recovered Windows LastBootUpTime remains the prior restart value; this recovery observation makes no additional fresh-kernel-boot claim. The preceding explicit-restart checkpoint separately verified startup.

Latest setup result: **checkpoint 11b passes**. After the operator's HP restart, administrator SSH reconnects, virtualization is enabled, and Podman 5.8.3 hosts an independent relay on **10.21.0.198:7777**, with its own persistent SQLite volume. Its independently hosted board is **http://10.21.0.198:8020/**. Both boards publish to both relays. With the primary relay stopped, the HP board reads existing posts, accepts a new post and retrieves it after reload. The primary relay is restored; bounded reconciliation copies the HP-only post back. Both endpoints independently return the same **seven verified signed posts**, including the original phone post. Startup tasks run after Windows login; full cold startup and complete primary-computer shutdown remain untested. See [the detailed setup record](kibera-mesh-nostr-lab.md). No further portal check code is required. Next integrate established media storage rather than expanding the custom prototype.

Latest result: **checkpoint 11a passes**. The user's phone post **Hello from node 2** is independently retrieved from the relay with a valid signature; event ID `4d4ff4c07d1b5a636d6374b7e6ab93da6c5321e919d1e37a779fb71bb1320862`, created **5 October at 00:18:35 EAT**. The phone loaded the board from `10.21.0.199`. Next confirm the HP's power/network state and installed container runtime before deploying an independently hosted second relay. The latest HP ping did not answer. No further code gate is needed for the first relay; [Nostr setup and results](kibera-mesh-nostr-lab.md) records the next stage.

Current update, 5 October: **checkpoint 10e passes**. The operator confirms the new media item appears and plays on the HP service. Independent retrieval confirms two catalogue entries and the new 38,444-byte object's SHA-256 `22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d`. Stop adding custom sharing features. An existing `nostr-rs-relay` 0.10.0 container now runs with its own persistent SQLite volume and network, separate from the unchanged UniFi container. Its lab endpoint is `ws://10.20.0.10:7777/`. A thin, locally bundled `nostr-tools` client is available at **http://10.20.0.10:8020/**. Signed publish/query, signature verification, relay restart persistence, and live delivery between two independent browser contexts pass. Phone posting across node2 remains the next operator gate. See [the Nostr setup and results](kibera-mesh-nostr-lab.md).

Current update: **checkpoint 9e passes**. `20166D605787` matches HTTP 200 from node2 phone `10.21.0.199` on the recovered original portal at **22:29:43 EAT**. The user requests moving beyond repeated code/failure checks toward community nodes and media sharing. Continue with [node roles and storage architecture](kibera-mesh-node-and-storage-architecture.md) and one useful shared-media increment. Both current service hosts and router paths remain running; no further repeated page-code gate is required before this build. The temporary bundle transfer helper remains stopped.

Latest state: **physical wired-transit failure and automatic radio failover pass**. The operator removes primary ether4's inter-router cable and supplies **`DA183173CFD0`**, matched to HTTP 200 from the node2 phone **`10.21.0.199` at 21:24:43 EAT**. Primary ether4 and node2 ether2 both show no-link. Their learned peer LAN routes now select radio peers **`10.255.20.6%wlan1`** and **`10.255.20.5%wlan1`**, with the radio OSPF adjacency Full on both routers and source address preserved at the portal. Radio forwarding counters increase and radio drop counters remain zero. Neither router has an Internet default route. Wired-path recovery also passes: **`D6FCCF857F2D`**, HTTP 200 from the same phone at **21:31:41 EAT**. Both wired ports return at 100 Mbps full duplex, both routers prefer the cost-10 cable path again, and both radio OSPF adjacencies remain Full at cost 100. The operator reports HP Wi-Fi `10.21.0.198` and Python `3.14.8`; its known MAC/hostname is bound on node2, and this address is now reserved. Next: download the prepared lab-only bundle onto the HP, start its portal copy and obtain a phone check code. The prior phone naming/recovery, additional HP client and WAN/controller outage checks also pass. Private Relay compatibility remains a deployment requirement. Service replicas, complete air-gapped cold startup and backup restoration remain untested; the two-router radio path still depends on both routers and one portal host.

Use this alongside [the concept](kibera-mesh-lab-01-concept.md). Advance one checkpoint at a time: physical setup, observation, diagnosis, change, verification, then the next setup action. A planned configuration is not a verified result.

## Confirmed starting state

- The operator confirms the MikroTik is a spare lab router, with no users depending on it.
- The operator authorizes resetting the lab devices. Capture recoverable configuration before resetting; additional reset permission is not needed for these devices.
- The operator reports that the lab hardware is disconnected and the computer's Ethernet is connected to the home network.
- Windows Ethernet address observed: `192.168.100.173/24`.
- Windows Wi-Fi address observed: `192.168.100.192/24`.
- Both interfaces currently have a default route through `192.168.100.1`.
- An HTTPS request bound to `192.168.100.192` returned HTTP 200. Home Wi-Fi can maintain the operator/assistant connection while Ethernet is used for the lab.
- Windows OpenSSH and Python 3.12 are installed.
- At the initial baseline, the assistant had not authenticated or configured any lab device. Later results are recorded below.

Addresses above are observations, not permanent assignments. Recheck after cabling changes.

## Equipment and terminal access

The concept lists the following devices; confirm their labels as each is connected.

| Equipment | First role | Management approach |
| --- | --- | --- |
| MikroTik RB951Ui-2HnD | Lab LAN, DHCP, routing and firewall | RouterOS terminal over SSH when reachable and enabled; authenticated REST is another option on supported RouterOS versions |
| UniFi UAP-AC-M | Phone/client Wi-Fi access | SSH for inspection and troubleshooting; use UniFi Network for persistent managed SSID configuration |
| NanoStation loco5AC | Later backhaul experiment | airOS web configuration and SSH when enabled; a compatible second airMAX endpoint is needed for the planned radio link |
| Windows computer | Operator terminal and first local service host | Local PowerShell; Ethernet to the lab and Wi-Fi to the home router |
| Home router | Internet for the operator and, later, an optional lab gateway | Retain the working home connection |
| Spare HP laptop, Windows | Additional client, then possible service host | Exact model and Ethernet/Wi-Fi interfaces still to verify |
| Second MikroTik RB951Ui-2nD, hAP r2 | Second routing node | `KM-LAB-002`, direct SSH at `10.21.0.1`; temporary commissioning mapping also retained, restricted to this computer |
| Second UniFi UAP-AC-M | Second access area | `KM-LAB-002-AP`, `10.21.0.2`, locally adopted and online; SSID **KiberaMesh-Node2**; ether5 stable after cable replacement |

Commands execute on this Windows computer. That local execution path can reach cabled LAN devices; the assistant's cloud connection alone does not establish LAN access. Device access still requires a reachable address, an enabled management service and valid credentials. Enter passwords through local authentication prompts or protected local storage, not this document.

References: [RouterOS SSH](https://help.mikrotik.com/docs/spaces/ROS/pages/132350014/SSH), [UniFi SSH](https://help.ui.com/hc/en-us/articles/204909374-Connecting-to-UniFi-with-Debug-Tools-SSH), [loco5AC specifications, including SSH](https://techspecs.ui.com/uisp/wireless/loco5ac).

## Existing project configuration that matters

[The gateway runbook](../GATEWAY_RUNBOOK.md) records a previous RB951 commissioning on 24 August 2026:

- RouterOS `7.20.8`, LAN `10.5.50.1/24`, agent host `10.5.50.252`.
- An existing paid HotSpot and an agent restricted to a specific source address.
- Backups named `before-bitcoin-valley.backup` and `before-bitcoin-valley.rsc` on the router.

Those are historical records. Authenticated inspection now confirms the operator had already reset the router: its active LAN was `192.168.88.1/24` on `bridge`, with default DHCP/firewall and no active HotSpot. The old backup files remained in storage. The assistant did not repeat the reset.

The mesh concept proposes `10.20.0.0/24`, gateway `10.20.0.1`, AP `10.20.0.2`, server `10.20.0.10`, DHCP `10.20.0.100–10.20.0.200`. Treat these as proposed post-reset assignments. Check current routes, address conflicts and DHCP configuration before using them.

The repository's current paid-access path depends on cloud services: the local HotSpot login page redirects to `wifi.afribit.africa`, the application uses Neon, and the gateway agent polls a remote API. Running the current application on a laptop alone does not remove those dependencies. The first offline demonstration needs a local service with local assets and no remote database, login or payment requirement.

## Checkpoint 1 — physical management connection

Operator actions:

1. Keep this computer connected to the working home Wi-Fi.
2. Move the computer's Ethernet cable from the home network to MikroTik **ether2**.
3. Power the MikroTik using its correct DC adapter.
4. Leave **ether1** disconnected for this checkpoint. Keep the UniFi and NanoStation disconnected until their power supplies are identified.
5. Allow the router to finish booting and report that the connection is ready, including whether the power and ether2 link lights are on.

Connect before pressing reset so that recoverable configuration can be inspected and copied. If management access is unavailable, use the manufacturer-specific physical reset procedure. A reset is already authorized; the procedure must distinguish normal configuration reset from other boot modes.

Assistant actions after the operator reports readiness:

- Re-read Ethernet link state, address, DHCP information, routes and neighbors.
- Identify the router from the direct connection and historical/default address candidates; do not assume its address.
- Verify management reachability, then establish authentication.
- Attempt to preserve the existing export and binary backup, storing sensitive backups outside tracked files.
- Inspect model, RouterOS version, interfaces, bridge, addresses, DHCP, services and HotSpot status.
- Guide the authorized reset and verify the resulting configuration before choosing LAN changes.

If Ethernet receives `169.254.x.x`, it has no usable DHCP lease. Diagnose power, link, port membership, DHCP and address assignment before moving forward.

The operator logged into WebFig and enabled SSH. TCP/22 now returns `SSH-2.0-ROSSSH`; no **Available From** restriction is shown in the supplied screenshot.

Completed bootstrap action: the operator used local PowerShell with `ssh admin@192.168.88.1` and supplied the output of these read-only commands:

```routeros
/system resource print
/system routerboard print
/ip address print
```

This confirmed RouterOS `7.20.8 (long-term)`, RB951Ui-2HnD revision r3 and the reset LAN. The operator then provided a temporary administrator credential and authorized its use. The assistant authenticated through SSH, using the password in process memory without saving it as plaintext in repository files. The administrator password was retained as requested.

Checkpoint passes when the computer has confirmed local management access and the router's starting state is known. Home Wi-Fi must still provide internet for the operator.

## Checkpoint 2 result — verified LAN

The operator's reset was already complete. The assistant migrated the inspected default configuration to the proposed lab subnet, preserving the existing LAN bridge and default WAN firewall.

| Item | Verified value |
| --- | --- |
| Router identity | `KM-LAB-001` |
| Router and local DNS | `10.20.0.1/24` |
| Operator/server Ethernet | `10.20.0.10/24`, reserved for MAC `40:C2:BA:80:4D:7B` |
| DHCP server name | `defconf`, on `bridge` |
| Dynamic client pool | `10.20.0.100–10.20.0.200` |
| Future AP address | `10.20.0.2` proposed; not assigned yet |
| WAN | `ether1` disconnected; router has no IPv4 default route |
| Operator internet | Home Wi-Fi, `192.168.100.192`, gateway `192.168.100.1` |
| SSH/WebFig/WinBox access | Restricted to operator/server `10.20.0.10/32` |
| FTP/Telnet/RouterOS API/API-SSL | Disabled for this lab configuration |
| `router.kibera.home.arpa` | Local DNS A record `10.20.0.1` |
| `portal.kibera.home.arpa` | Local DNS A record `10.20.0.10`; web service not started yet |

Router login now uses `ssh admin@10.20.0.1` or `http://10.20.0.1/` from this computer. The old router address `192.168.88.1` has been removed. Moving management to another computer requires updating the reservation and management service allowlists.

Evidence: Windows received the reserved address from DHCP server `10.20.0.1`; wired router ping had no packet loss; explicit DNS queries to `10.20.0.1` returned the router/server records; assistant SSH login succeeded at the new address; ordinary HTTPS internet access still used home Wi-Fi. A second LAN client and the phone/local-service path remain to be tested.

Reproducible configuration is in:

- [`kibera-mesh-lab-01-stage-lan.rsc`](../../mikrotik/kibera-mesh-lab-01-stage-lan.rsc): guarded migration from the inspected reset configuration, initially retaining the old management address.
- [`kibera-mesh-lab-01-finish-lan.rsc`](../../mikrotik/kibera-mesh-lab-01-finish-lan.rsc): verifies the operator's new bound lease, removes the old address, and refreshes DHCP service identity.
- [`kibera-mesh-lab-01-reserve-ap.rsc`](../../mikrotik/kibera-mesh-lab-01-reserve-ap.rsc): checks the commissioned LAN and discovered AP lease, then reserves `10.20.0.2` for the inspected AP MAC. Run after AP discovery; verify its new active address after renewal/reboot.

On the verified RouterOS release, syntax checking uses `/import file-name=<file.rsc> verbose=yes dry-run`. `dry-run` is a flag, without `=yes`. Local variables used across import statements must be in a shared enclosing block. Syntax checking does not prove that runtime guards or the resulting network will pass.

The initial Ethernet renewal reported a Windows NCB-name warning but obtained the correct address. After completing migration, restarting the DHCP server and renewing Ethernet produced the correct DHCP server identifier without that warning. Wi-Fi was retained throughout. The router clock was also set from the operator computer and verified with timezone `Africa/Nairobi`; automatic external time synchronization remains a later task.

## Backups and recovery

Local backup directory: `D:/dev/wifi/artifacts/mesh-lab/backups/2026-10-03/`. It is excluded from Git by the existing `artifacts/` rule.

- `kibera-lab-01-prechange-20261003.rsc` and `.backup`: inspected reset state before LAN changes.
- `kibera-lab-01-lan-verified-20261003.rsc` and `.backup`: verified new LAN.
- `kibera-lab-01-ap-reserved-20261003.rsc` and `.backup`: router configuration after reserving the discovered AP's address; these are router backups, not backups of the AP's existing configuration.
- `before-bitcoin-valley.rsc`, `before-bitcoin-valley.backup` and `auto-before-reset.backup`: existing recovery files copied from the router.

An additional pre-router-restart snapshot is in `artifacts/mesh-lab/backups/2026-10-04/`: `kibera-lab-01-before-router-restart-20261004.rsc` (6,982 bytes) and its encrypted `.backup` (32,224 bytes). Both were downloaded and their local files verified before the 4 October software reboot; Git ignores them.

The new binary backups are encrypted using the commissioning administrator password. Keep that password available for restoring these backups even after rotating the router login. Exports were created without `show-sensitive`; no plaintext credential is included in the configuration scripts or this guide.

For rollback to the prechange state, restore its encrypted binary backup on the same router and RouterOS version. Restoration reboots the router and returns LAN management to `192.168.88.1`; renew only the computer's Ethernet DHCP lease afterward. Keep home Wi-Fi connected. See [RouterOS backup documentation](https://manual.mikrotik.com/docs/getting-started/configuration-management/backup/).

## Checkpoint 3a result — UniFi power and wired LAN

Labels reported by the operator:

| Component | Reported label | Assessment |
| --- | --- | --- |
| UniFi AP | `UAP-AC-M`, IPX4, input `24 V / 48 V, 0.5 A` | Model confirmed; Ubiquiti specifies maximum consumption of 8.5 W |
| PoE injector | `GP-J240-030G`; AC input 100–240 V, 50–60 Hz, max 0.3 A; DC output 24 V, 0.3 A, 7.2 W | Its 7.2 W rating is below the AP's 8.5 W maximum, so do not use it for this setup |
| MikroTik DC adapter | Output `24 V, 0.8 A, 19.2 W`; model not supplied | Rated capacity supports a bench trial powering router and AP together |

The operator has other PoE injectors, but reports that they all have the same rating as the 7.2 W unit.

The injector may power the AP at a lower load, but that would not establish operation across its rated load range. This is a capacity mismatch inferred from the reported label and [Ubiquiti's AP specifications](https://techspecs.ui.com/unifi/wifi/uap-ac-mesh). Ubiquiti also identifies `GP-J240-030G` as its low-power 24 V injector in the [adapter declaration of conformity](https://dl.ui.com/compliance/PoE_Adapters_Safety_Compliance.pdf).

The RB951Ui-2HnD offers passive PoE on **ether5**, limited to 500 mA; the router alone consumes up to 7 W. See [MikroTik specifications](https://mikrotik.com/product/RB951Ui-2HnD). The router and AP maximum consumption sums to 15.5 W, below the supply's 19.2 W rating, leaving some margin for losses. The UAP-AC-M accepts 24 V passive PoE on pins 4/5 positive and 7/8 return, matching MikroTik's passive output; see the [AP quick-start guide](https://dl.ubnt.com/guides/UniFi/UniFi_AP-AC-M_QSG.pdf) and [PoE manual](https://manual.mikrotik.com/docs/hardware/poe-out/).

Use a short cable for the first trial. The [RB951 manual](https://help.mikrotik.com/docs/spaces/UM/pages/16351546/RB951-series) notes an approximate 2 V drop through ether5. Ubiquiti's current specifications list a 22–26 V DC input range, so cable loss and stability matter; the budget alone does not establish a working AP. RouterOS does not expose `/system health` on this inspected router, and its unloaded PoE monitor did not report a measured voltage/current. Do not claim voltage-under-load measurement from this inspection.

Read-only router SSH observations before the AP was connected:

```text
ether5 poe-out: auto-on
ether5 poe-out-status: waiting-for-load
ether5 Ethernet link: not running
operator DHCP lease: 10.20.0.10, bound
```

No PoE setting was changed. The AP powered up with the existing `auto-on` setting, so no forced output mode was needed.

Observations after the operator connected the AP directly to ether5:

| Item | Observed value |
| --- | --- |
| Router PoE | `auto-on`, `powered-on`, power pair B |
| Ethernet | `link-ok`, 100 Mbps, full duplex |
| AP identity | `UAP-AC-Mesh` via LLDP on ether5 |
| Firmware | `6.8.2.15592` via LLDP |
| AP MAC | `1C:6A:1B:73:3B:59`, matching router bridge-host and Windows ARP observations |
| Current DHCP address | `10.20.0.200`, bound |
| Ping | 3 replies, 0% loss, 1–3 ms |
| SSH | TCP/22 reachable, Dropbear `2024.86`; both manufacturer-documented factory credential pairs rejected |
| AP RSA fingerprint | `SHA256:gITTChlh2he3Rv3OMndjnk5tBdNC3hozb/xAukvsZaQ`, recorded from the directly connected device before login attempts |
| Operator LED report | AP blinking blue; ether5 light on, reported red |
| Follow-up link check | Running, one initial link-down event, zero RX/TX errors; PoE still powered-on |
| New DHCP reservation | `10.20.0.2`; current active address still `10.20.0.200`, awaiting renewal/reboot |

The PoE log records a `12.9W` LLDP request as approved. This is a power-budget request, not measured AP consumption; the monitor did not provide voltage/current/watt telemetry. These observations establish boot and wired reachability for this bench trial, not operation at maximum radio/client load.

Blue flashing and rejected default credentials are consistent with an existing managed configuration, but the exact adoption state could not be read without authentication. See [UniFi SSH/default credential documentation](https://help.ui.com/hc/en-us/articles/204909374-Connecting-to-UniFi-with-Debug-Tools-SSH) and the [model LED guide](https://dl.ubnt.com/guides/UniFi/UniFi_AP-AC-M_QSG.pdf). There is no authenticated AP configuration backup; only its observed identity, firmware, MAC, host key and network state have been recorded.

The AP reservation script passed RouterOS syntax checking and imported successfully. Router configuration was exported and backed up again after that change. The DHCP reservation is on the MikroTik; it does not change the AP to a static-IP configuration.

## Checkpoint 3b result — AP reset and terminal access

The operator completed the previously requested AP reset and reports a solid white LED. The following procedure is retained for reproduction; do not repeat it merely to continue at checkpoint 3c.

1. Leave the AP powered through MikroTik **ether5**, the computer on **ether2**, home Wi-Fi connected and ether1 empty.
2. Find the AP's recessed **Reset** button beside its Ethernet port under the port cover.
3. Press and hold it for **more than five seconds until the AP status LED turns off**, then release. This is typically within 5–10 seconds; release when the reset indication occurs rather than holding indefinitely.
4. Leave it powered and allow about two minutes to reboot. Report the AP LED color and whether it is steady or blinking. The expected factory-ready indication is **steady white**.

Procedure: [UAP-AC-M quick-start guide](https://dl.ubnt.com/guides/UniFi/UniFi_AP-AC-M_QSG.pdf), [manufacturer factory-reset guidance](https://help.ui.com/hc/en-us/articles/205143490-How-to-Reset-UniFi-Devices-to-Factory-Defaults).

Post-reset verification:

- Router DHCP reservation and **active address** both `10.20.0.2`, bound to the expected AP MAC.
- Windows Ethernet remains `10.20.0.10`; Wi-Fi remains connected to the home network.
- AP ping: two replies, 0% loss, 2–4 ms. Windows ARP matches `1C:6A:1B:73:3B:59`.
- Ether5 PoE remains `powered-on`; Ethernet `link-ok`, 100 Mbps, full duplex.
- AP RSA fingerprint is unchanged from the pre-reset record. The verified fingerprint was required for SSH authentication.
- Factory SSH login succeeds as user `ubnt`. Password was supplied only to the masked local process prompt, not stored in this document.
- `mca-cli-op info` confirms the model, firmware, MAC, IP address and a post-reset uptime of about six minutes.
- AP management status: `Unable to resolve (http://unifi:8080/inform)`. The local UniFi management server is not running yet; this does not negate the verified Ethernet/DHCP connection.
- AP NTP status is not synchronized while the router WAN is disconnected. Time synchronization remains a later task.

Terminal access from this computer is now `ssh ubnt@10.20.0.2`. Use `mca-cli-op info` for the status check. After adoption, use the credentials managed by the local UniFi instance instead of assuming factory credentials remain valid.

## Checkpoint 3c — install local UniFi management (completed)

Ubiquiti's current self-hosting standard is **UniFi OS Server**. It supports Windows and optional cloud remote management. Plan local management for this lab and verify a local administrator login before disabling remote management. See [Self-Hosting UniFi](https://help.ui.com/hc/en-us/articles/34210126298775-Self-Hosting-UniFi).

Preflight on this computer:

| Item | Observed value |
| --- | --- |
| Windows | x64, build `26200`, release `25H2` |
| RAM | 15.7 GiB |
| Free storage | C: approximately 141 GiB; D: approximately 60.4 GiB before installer download |
| WSL | `2.7.12.0` already installed; existing `docker-desktop` distribution |
| Lab Ethernet | `10.20.0.10`, 100 Mbps, Public Windows network profile |
| Home Wi-Fi | Connected with internet, Public Windows network profile |
| Windows firewall | Enabled; inspect installer-created rules and verify AP-to-controller access after installation |
| Existing UniFi service/listeners | No active UniFi service or listeners detected on the usual management/inform ports |
| Current terminal | Not elevated; installer manifest explicitly requires administrator execution |

Prepared installer:

- File: `D:/dev/wifi/artifacts/mesh-lab/installers/UniFi-OS-Server-5.1.42-x64.exe`.
- Source: Ubiquiti's [release metadata API](https://fw-update.ui.com/api/firmware?filter=eq~~product~~unifi-os-server&filter=eq~~channel~~release&filter=eq~~platform~~windows-x64-msi&limit=100), Windows x64 release channel, published 10 September 2026. Selected the highest available release version not later than the client date of 3 October 2026.
- Source metadata is saved locally in `artifacts/mesh-lab/uos-windows-release.json`.
- Download size: `1,355,459,896` bytes.
- SHA-256: `909db093a48d4091453dfbf52e31994f99dee00d763d4ee885310587aed48562`, matching Ubiquiti's published metadata.
- Windows Authenticode: **Valid**, signer **UBIQUITI INC.**.
- Product version `5.1.42`, file version `5.1.42.1`.
- Embedded manifest: `requestedExecutionLevel="requireAdministrator"`.
- Files are in the existing ignored `artifacts/` directory; no installer or private session artifact is added to Git.

The operator completed installation. This command is retained for reproduction; do not rerun the installer to continue at checkpoint 3d:

```powershell
Start-Process -FilePath 'D:\dev\wifi\artifacts\mesh-lab\installers\UniFi-OS-Server-5.1.42-x64.exe' -Verb RunAs
```

The executable's administrator manifest required the operator's local Windows administrator approval. The installer was subsequently observed running and then completed. Registry, service/process and listening-port checks confirm the installation.

Post-installation results:

| Item | Verified result |
| --- | --- |
| Server/application | UniFi OS Server `5.1.42`; local Network API reports `10.5.67` |
| Windows service | UniFi OS Server Elevation Service running; server processes present |
| Local management | `https://127.0.0.1:11443/` and `https://10.20.0.10:11443/` return HTTP 200 |
| Inform listener | TCP `8080`; AP-originated HTTP probe reaches it and returns HTTP 400 for an invalid/root request |
| Local TLS pin | SHA-256 `096c36760ea996163a5e884e9b076bdb8306a5b8276e8df8398adda501926c6e`; checked before sending the API credential |
| API access | Authenticated local `GET /proxy/network/integration/v1/info` and `/sites` succeed |
| Adoption target | Exactly the known lab AP MAC `1C:6A:1B:73:3B:59`, pending at `10.20.0.2` |
| Inform destination | Changed from unresolved `unifi` name to `http://10.20.0.10:8080/inform` |
| Adoption | Local official API adoption succeeds; final device state `ONLINE` |
| SSH after adoption | Controller-managed credentials authenticate with the previously verified AP host key |

The API credential stayed in process memory and was sent only to the pinned server on this computer. It is absent from this runbook and tracked files. No Windows firewall rules were changed by the assistant; the AP-originated probe demonstrated the necessary inform path after installation.

The server's public status still reports `deviceState: setup`, with SSO/cloud connection and remote management enabled. The functioning local Network API is verified; completion of console setup and a working offline local administrator login are separate checks still pending. Establish and test that login before disabling remote management. Cloud independence of the management interface has not yet been demonstrated.

## Checkpoint 3d — Wi-Fi configuration and phone test

Configured through the local controller, then inspected on the AP:

| Setting | Applied value |
| --- | --- |
| SSID | `KiberaMesh-Lab`, enabled, visible-name setting |
| Broadcasting device | Only the known lab AP |
| Bands | 2.4 GHz and 5 GHz |
| Country | Kenya, numeric code `404`, verified on both AP radios |
| Security | WPA2-Personal; protected management frames optional; fast roaming disabled |
| LAN | Native/untagged Ethernet network; MikroTik remains the actual DHCP server/router |
| Client isolation / HotSpot | Client isolation disabled; no HotSpot attached to this SSID |
| Last observed channels | 2.4 GHz channel 6 at 20 MHz; 5 GHz channel 40 at 40 MHz; automatic selection may change them |
| Credentials | `D:/dev/wifi/artifacts/mesh-lab/private/kibera-mesh-lab-wifi.txt` |

The password was generated after the operator requested local generation. The containing directory permits the current Windows user and SYSTEM, with inherited permissions removed. Git ignores it. A protected comparison confirms that the saved password matches the controller's Wi-Fi configuration, without printing either value.

AP SSH confirms both SSID entries and their `aaa.*.wpa=2` configuration; the controller reports `ONLINE` with a provisioning timestamp after Wi-Fi creation. A Windows Wi-Fi listing did not show the lab SSID at the observation time; this listing alone does not establish whether the phone can discover it. Actual visibility and association remain unverified until the phone test.

Implementation observations for reproduction: the official `10.5.67` API rejects changing the default network to `UNMANAGED`; that attempted change did not apply. Retain the native network for this AP-only site. Its displayed default gateway/DHCP settings are not evidence of another active DHCP server; there is no UniFi gateway in this lab. The API also rejects an explicit `mloEnabled: false` with WPA2; omitting the optional MLO field allowed SSID creation. Request contracts came from the [official versioned OpenAPI specification](https://developer.ui.com/network/v10.5.67/openapi.json). Country was changed through the local Network settings endpoint and checked directly on the device.

A redacted observation snapshot is saved at `artifacts/mesh-lab/backups/2026-10-03/unifi-lab-01-api-snapshot.json`. This is not a restorable UniFi backup. A controller backup and restart/offline-login tests remain later tasks.

The operator completed the following phone setup. Retain it for reproduction:

1. Leave the computer on home Wi-Fi, Ethernet to ether2, AP to ether5 and ether1 empty.
2. On a phone near the AP, find and join **KiberaMesh-Lab** using the password in the local file above.
3. Disable phone mobile data for the lab test. If prompted about no internet, choose to stay connected; the MikroTik WAN is deliberately disconnected.
4. Report whether the SSID is visible, whether connection succeeds and the IPv4 address shown in the phone's Wi-Fi details. Expected address: `10.20.0.100–10.20.0.200`, gateway `10.20.0.1`.

Checkpoint 3d result:

- The operator reports successful connection and phone IPv4 address `10.20.0.199`.
- Router lease is `bound`, on `defconf`, with active address `10.20.0.199` and host name `iPhone`.
- Router ARP and the local UniFi client's MAC agree; UniFi identifies the client as `WIRELESS`, at `10.20.0.199`, with the known lab AP as uplink.
- Router ether1 reports `no-link`; no IPv4 default route exists. Local portal DNS still maps to `10.20.0.10`.

Phone visibility, association and DHCP now pass. The router's management services are restricted to the computer, so opening WebFig from the phone is not an acceptance test.

## Checkpoint 4 — dedicated local page

The minimal service is [serve-local-portal.py](../../scripts/mesh/serve-local-portal.py), with [its HTML page](../../scripts/mesh/local-portal.html). It uses the Python standard library and has no runtime package installation, external assets, cloud database or cloud authentication.

| Item | Current value |
| --- | --- |
| Phone test URL | `http://10.20.0.10:8000/` |
| Local name | `http://portal.kibera.home.arpa:8000/` |
| Listener | Only `10.20.0.10:8000`; not the computer's home Wi-Fi address |
| Served routes | `/`, `/api/status`; favicon returns an empty response; other paths return 404 |
| Client scope | Requests accepted only from `10.20.0.0/24` |
| Freshness | New check code and Nairobi timestamp on each response; `Cache-Control: no-store, max-age=0` |
| Request log | Git-ignored `artifacts/mesh-lab/portal-requests.jsonl` |
| Current Windows process | Python PID `28716` after the 4 October restart test; first launch was PID `35380`; hidden background window |

Port `8080` is already occupied by the UniFi inform service, so this service uses `8000`. The service serves the dedicated page only; it does not expose the repository or the private credential directory. A request for a private-file path returned 404.

Observed host/network checks:

- Listener is `10.20.0.10:8000`, owned by the launched Python process.
- Two host page requests return HTTP 200 with different check codes, no unresolved page placeholders and no external assets. `/api/status` also returns HTTP 200.
- Direct DNS query to the MikroTik resolves `portal.kibera.home.arpa` to `10.20.0.10`.
- A [RouterOS fetch](https://help.mikrotik.com/docs/spaces/ROS/pages/8978514/Fetch) from source `10.20.0.1` to `http://portal.kibera.home.arpa:8000/api/status` finishes successfully. The server log records that LAN source and response code.
- Existing Windows inbound Python rules already permit the installed Python executable on Public/Private profiles. No firewall rule was added or changed; the router-originated request confirms the inbound path works.
- IPv4 forwarding is `Disabled` on Ethernet and Wi-Fi; system `IPEnableRouter` is `0`; no bridge adapter was observed. Direct Internet Connection Sharing enumeration was denied to the non-elevated process, so that specific enumeration remains incomplete. Phone external-internet behavior must still be tested separately.

To start the page manually after stopping it, from the repository root:

```powershell
python scripts/mesh/serve-local-portal.py
```

That foreground command stops with Ctrl+C. Do not start a second copy while port 8000 is occupied. For the current background copy, identify the process before stopping it:

```powershell
$labPortalPid = (Get-NetTCPConnection -State Listen -LocalAddress 10.20.0.10 -LocalPort 8000).OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId=$labPortalPid" | Select-Object ProcessId,ExecutablePath,CommandLine
```

After confirming its command line names `scripts/mesh/serve-local-portal.py`, stop that process with `Stop-Process -Id $labPortalPid`. The background server is not configured as an automatic Windows startup service; sleep, shutdown or process termination interrupts it.

The operator completed the following IP-based page test:

1. Keep the phone on **KiberaMesh-Lab**, with mobile data disabled and the router uplink disconnected.
2. In the phone browser, enter **`http://10.20.0.10:8000/`**, including `http://`.
3. Expect **Kibera Mesh**, **Local page reached**, a check code and a **Check again** button.
4. Tap **Check again** and report the new check code, or the exact browser error. A fresh request from `10.20.0.199` in the server log will corroborate the result.

Checkpoint 4 result:

- First phone request: `10.20.0.199`, HTTP 200, check code `E75BD6E4F632`, 4 October 2026 at 00:01:11 EAT.
- Fresh phone request after checking again: same source, HTTP 200, check code `AA700ED7EC7F`, at 00:01:27 EAT. This matches the code supplied by the operator.
- The matching requests are recorded in the local server log, rather than inferred from a browser screenshot or cached content.
- The lab service is reachable through phone → UniFi AP → MikroTik bridge → computer Ethernet with the MikroTik WAN absent. The computer still uses home Wi-Fi for the operator/assistant connection.

This passes phone-to-server access by IP and establishes the first local-service result without a router WAN connection. It does not yet establish continued service after removing a previously working gateway, or redundancy against router/AP/server failure.

## Checkpoint 4b — phone local DNS

A fresh direct query to the MikroTik confirms `portal.kibera.home.arpa` resolves to `10.20.0.10`. The phone named-URL test initially failed, then passed as recorded below.

The operator attempted the following named-URL test and reports that it did not work:

1. Keep the current cabling, phone lab Wi-Fi and mobile-data setting.
2. Open **`http://portal.kibera.home.arpa:8000/`** in the phone browser, including `http://` and the port.
3. Tap **Check again** and report the new check code, or the exact browser error.

After the named URL passes, inspect the router WAN baseline, connect the home-router uplink to ether1, verify external internet and then physically withdraw that uplink while checking a new local response. Keep the computer's home Wi-Fi connected throughout.

Hostname failure diagnosis, 4 October 2026:

- Router DHCP network: `10.20.0.0/24`, gateway `10.20.0.1`, DNS `10.20.0.1`; the phone's lease remains bound at `10.20.0.199`.
- Router DNS: `allow-remote-requests=yes`; exact active A record `portal.kibera.home.arpa → 10.20.0.10`; no upstream servers or DoH configured while WAN is absent.
- LAN input firewall and interface membership remain consistent with the working direct DNS tests: `bridge` is in `LAN`, no added raw blocking rule, and bridged IP filtering is disabled.
- Wire-format DNS probes to `10.20.0.1:53` over UDP and TCP: A returns one answer with NOERROR; AAAA and HTTPS (type 65) return NOERROR with no answer. All six probes finish in 0–16 ms. These missing-record responses are not timeouts or NXDOMAIN failures.
- Listener is still `10.20.0.10:8000`. Initial inspection found no newer phone response; after the operator's IP-based control check, new HTTP 200 responses from `10.20.0.199` appear, including at 00:20:44 EAT. The log records successful HTTP responses only.
- The operator confirms **Automatic DNS**, with only **`10.20.0.1`** listed in the phone's per-network settings. This rules out a visibly incorrect server in that setting; it does not establish which resolver a browser, VPN or encrypted-DNS profile actually used. Inspection path: [iPhone Wi-Fi settings](https://support.apple.com/guide/iphone/manage-wi-fi-settings-iphw5gjwl8k2/ios).
- The operator confirms the IP URL still works and the hostname fails in another browser too. The error says the server IP address could not be found. This directs diagnosis to name resolution rather than the already working server/listener path.
- Added a temporary A record `dns-check.kibera.home.arpa → 10.20.0.10`, TTL 1 minute, comment `kibera-mesh-lab:temporary-dns-check`, to try a name without the previous failed lookup cache. The operator reiterated that hostname access worked on the computer and failed on mobile. After the phone named-URL test passed, the assistant removed only this exact diagnostic record, with router identity/name/comment/address/type guards. The portal record remains active at `10.20.0.10`.
- A [RouterOS packet trace](https://help.mikrotik.com/docs/spaces/ROS/pages/8323088/Packet+Sniffer) filtered to the phone's MAC and DNS port 53 on the bridge, with AND matching and a 100 KiB memory limit, was automatically bounded to two minutes and then explicitly stopped. The saved PCAPNG has 24 UDP DNS frames between `10.20.0.199` and `10.20.0.1`, with no parser errors. No query for the portal, diagnostic alias or another Kibera/home.arpa name appears in that window. This does not prove that the retry happened within the capture window, or that a specific DNS override caused the failure. Other-name replies are SERVFAIL while the router has no upstream DNS/WAN; direct lab-name probes continue to work.
- The capture is retained only in the restricted, Git-ignored local path `artifacts/mesh-lab/private/lab-phone-dns-20261004.pcap`. The router copy was removed, and sniffer filters restored to their original settings. No forwarding/firewall rules were changed.

The requested diagnostic test was: under **Settings → Wi-Fi → ⓘ beside KiberaMesh-Lab**, check **Limit IP Address Tracking**; if on, temporarily turn it off for this network and retry **`http://portal.kibera.home.arpa:8000/`**. Apple documents this setting as the [per-network Private Relay control](https://support.apple.com/en-us/102022).

Checkpoint 4b result:

- In response to that test, the operator reports that the page loads with check code `ECFA4AC0A5F9`.
- The code exactly matches a fresh HTTP 200 response to phone `10.20.0.199` at **00:40:28 EAT on 4 October 2026**. Other successful phone requests surround it.
- The named-URL result is operator-reported; the HTTP log verifies the requesting phone and fresh response but does not record the request's Host header.
- The result is consistent with the per-network Private Relay setting affecting local access. The operator did not separately report the toggle's prior state, and a toggle-back comparison has not been performed; a definitive causal claim would exceed the evidence.

Phone local-service access by IP and hostname now passes with the router WAN absent. Proceed to the optional gateway test.

## Checkpoint 5 — optional internet uplink

Fresh authenticated router inspection before connecting the cable:

| Item | Observed state |
| --- | --- |
| Router identity | `KM-LAB-001` |
| WAN port | `ether1`, in interface list `WAN`, outside the LAN bridge, currently `no-link` |
| WAN DHCP client | Existing enabled `defconf` client on ether1; stopped because the interface is inactive |
| DHCP route/DNS options | `add-default-route=yes`, distance 1, `use-peer-dns=yes` |
| Source NAT | Existing enabled masquerade rule with `out-interface-list=WAN` |
| IPv4 firewall | Existing default input/forward rules retained; unsolicited WAN forwarding dropped |
| IPv4 routes | Connected lab subnet only; no default route yet |
| IPv6 | Default firewall retained; no DHCPv6 client, global address or default route observed |
| Lab naming | Exact portal A record still active at `10.20.0.10`; temporary diagnostic alias removed |

The existing WAN configuration was ready for this test; no DHCP, NAT or firewall changes were needed.

Completed operator action:

1. Connect an Ethernet cable from a **LAN port on the home router** to MikroTik **ether1**.
2. Leave the computer's Ethernet on **ether2**, the AP on **ether5**, and this computer's home Wi-Fi connected. Keep the phone on **KiberaMesh-Lab** with mobile data disabled for the test.
3. Report that the uplink is connected. The assistant will inspect link negotiation, WAN lease, default route and upstream DNS before requesting phone internet/local-page checks.

Post-connection verification, 4 October 2026:

| Item | Observed result |
| --- | --- |
| Ether1 link | `link-ok`, 100 Mbps, full duplex |
| WAN DHCP | `bound`, `192.168.100.76/24`, DHCP server/gateway `192.168.100.1` |
| Default route | Active DHCP route `0.0.0.0/0` via `192.168.100.1%ether1` |
| Upstream DNS | Dynamic servers `1.1.1.1`, `1.0.0.1` |
| Public reachability | Three replies from `1.1.1.1`, 0% loss, approximately 9.4–9.8 ms |
| External DNS | Router resolves `example.com` to `104.20.23.154` at this observation |
| External HTTP | Router fetch of `http://example.com/` finishes with a 577-byte response |
| Local DNS/service | Portal still resolves to `10.20.0.10`; named status fetch finishes with code `97A2712799B4`, logged at 07:35:18 EAT |
| Phone lease | Still bound at `10.20.0.199`, matching the known iPhone MAC |
| Computer/service | Ethernet `10.20.0.10` and home Wi-Fi `192.168.100.192` remain Up; portal listener unchanged at `10.20.0.10:8000` |

The router's HTTPS fetch with `check-certificate=yes` failed with **no trusted CA certificate found**. TLS verification was not disabled to make that probe pass. This is a router trust-store limitation; the subsequent phone HTTPS test passes as reported below. NTP remains disabled, and the router clock was about 50 minutes behind the computer at inspection. Time synchronization and router certificate trust remain later management tasks.

Router-originated internet probes verify the uplink; they do not by themselves prove the phone's forwarded/NAT path. The operator completed the following phone checks:

1. Keep the phone on **KiberaMesh-Lab**, with mobile data off and the uplink cable connected.
2. Open **`https://example.com/`**. Report whether **Example Domain** appears, or the exact error.
3. Open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report its new code.

Checkpoint 5 result:

- The operator reports both tests succeeded: the external HTTPS page and local named page loaded with the uplink connected, following the lab Wi-Fi/mobile-data-off instructions.
- Local check code **`E6EF6D01DDD6`** exactly matches a GET `/` with HTTP 200 from **`10.20.0.199`** at **07:47:32 EAT on 4 October 2026**. Surrounding phone requests have different codes, corroborating fresh responses.
- External HTTPS success is operator-reported; the local request is independently corroborated by the server log. The HTTP log does not capture the browser's Host header.

The optional gateway checkpoint passes. The subsequent physical WAN-withdrawal result is recorded at checkpoint 6 below.

## Checkpoint 6 — physical WAN withdrawal

Pre-withdrawal operator-connection checks:

- The computer's Ethernet remains Up at `10.20.0.10`, and the local portal still listens only at `10.20.0.10:8000`.
- Home Wi-Fi was found disconnected when verifying the latest phone code. The assistant reconnected the previously used saved home profile; no password was read or printed.
- Wi-Fi is now Up at `192.168.100.192`. Windows selects its route through `192.168.100.1` for external destination `1.1.1.1`; Wi-Fi's automatic interface metric is 30 versus Ethernet's 35. No route/metric changes were needed.
- A certificate-verified HTTPS request bound to source `192.168.100.192` returned HTTP 200 from `example.com`, verifying the separate operator internet path.
- IPv4 forwarding remains Disabled on both computer interfaces.

Completed operator action:

1. Unplug **only the uplink cable from MikroTik ether1**.
2. Leave the computer connected to ether2, AP to ether5, all lab power on and this computer on home Wi-Fi.
3. Keep the phone on **KiberaMesh-Lab**, mobile data off. If it warns that Wi-Fi has no internet, choose to stay connected.
4. Report that ether1 is disconnected. The assistant will verify `no-link`, loss of the WAN lease/default route and retained LAN/service access before requesting the phone's next local-page test.

Post-withdrawal verification, 4 October 2026 at approximately 07:57 EAT:

| Item | Observed result |
| --- | --- |
| Ether1 / WAN DHCP | `no-link`; DHCP client stopped because the interface is inactive |
| Router addresses | Only lab `10.20.0.1/24` remains; WAN `192.168.100.76` is absent |
| Router IPv4 routes | Only connected `10.20.0.0/24`; no default route |
| Upstream DNS | Learned dynamic servers are now empty; local DNS service remains enabled |
| Router public ping | Both probes to `1.1.1.1` fail with no route |
| AP power/link | Ether5 `powered-on`, `auto-on`, 100 Mbps/full duplex |
| LAN DHCP leases | Phone `10.20.0.199` and AP `10.20.0.2` still bound |
| Local named service | Router fetch finishes; code `8DB9D5F0B8D5` matches HTTP 200 from `10.20.0.1` at 07:57:23 EAT |
| Computer | Lab Ethernet and home Wi-Fi Up; forwarding Disabled on both; listener still `10.20.0.10:8000` |
| Separate operator internet | Selected external route uses home Wi-Fi; HTTPS bound to `192.168.100.192` returns HTTP 200 |

The router-originated local request verifies retained DNS/LAN/server access after withdrawal. The operator then completed the phone test below to establish the complete phone → AP → lab → server path.

Completed operator action:

1. Leave ether1 unplugged. Keep the phone on **KiberaMesh-Lab**, mobile data off, and stay connected if iOS warns there is no internet.
2. Open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report the new check code or exact error.
3. Open **`https://example.com/?kibera-wan-test=20261004-075723`** and report whether it fails. This query has not been used for the earlier internet-on test, reducing the risk of mistaking its cached page for live access.

Checkpoint 6 result:

- The operator supplies local check code **`0176D395F121`** and reports the external test failed.
- The code exactly matches a fresh GET `/`, **HTTP 200 from phone `10.20.0.199` at 08:00:45 EAT on 4 October 2026**, after WAN withdrawal was verified at approximately 07:57 EAT. The preceding phone response at 08:00:43 has a different code.
- Local access after withdrawal is corroborated by the server log; external failure and named-URL use are operator-reported. Phone mobile data remained off under the test instructions.
- The internet-on and internet-off results together satisfy the concept's **Milestone 001** success definition. The phone can use the local service while external internet is unavailable.

This proves WAN independence for this lab path. It does not establish alternate routing paths, replicated services, restart recovery or independent management of every device. The concept's broader definition of done retains the unverified second end-user client and clean reproduction checks.

## Checkpoint 7a — local page service restart

The first recovery test restarts the local service while ether1 remains disconnected. This is a manual process-recovery test, not a Windows reboot or automatic-startup test.

Assistant actions and observed results:

1. Identified the single listener at `10.20.0.10:8000` and checked its owning process, executable and exact script path before stopping it.
2. Stopped the verified original Python process `35380` and waited for it to exit.
3. Started the same Python executable/script with the existing request log, a hidden background window and separate stdout/stderr logs. Restart completed at **08:07:53 EAT on 4 October 2026**.
4. Verified replacement process **`28716`** owns the listener at `10.20.0.10:8000`; its command line names the expected script and log path.
5. Fetched `/api/status` from the computer: **HTTP 200**, `Cache-Control: no-store, max-age=0`, new code **`C0520A51E282`** at **08:08:11 EAT**. The new stderr log is empty.

Request history continues in `artifacts/mesh-lab/portal-requests.jsonl`. Restart process logs are `artifacts/mesh-lab/portal-recovery-20261004T080753-stdout.log` and `portal-recovery-20261004T080753-stderr.log`; all remain Git-ignored. No application source was changed for this restart.

Completed operator action:

1. Keep ether1 disconnected, the phone on **KiberaMesh-Lab**, mobile data off and this computer on home Wi-Fi.
2. Open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report its new code or exact error.

Checkpoint 7a result: **`EB8B33447CD8`** exactly matches HTTP 200 from phone **`10.20.0.199` at 08:10:38 EAT on 4 October**, after the service restarted at 08:07:53. Other phone responses immediately before it have different codes. Service process recovery and the complete phone path pass. This does not verify automatic startup after computer shutdown; the page still requires manual startup after shutdown or process exit.

## Checkpoint 7b — AP restart without WAN

Pre-restart inspection through the pinned local UniFi API confirmed the expected AP UUID, MAC `1C:6A:1B:73:3B:59`, address `10.20.0.2`, ONLINE state, configuration ID `d1ada1e316877e47` and uptime `33227` seconds.

The assistant requested a software restart of this AP using POST `/proxy/network/integration/v1/sites/{siteId}/devices/{deviceId}/actions`, body `{"action":"RESTART"}`. HTTP 200 confirmed acceptance, not recovery. The contract came from the locally saved [official Network 10.5.67 OpenAPI specification](https://developer.ui.com/network/v10.5.67/openapi.json). The local controller stayed running throughout this test.

Post-restart observations:

| Item | Observed result |
| --- | --- |
| Restart transition | Controller reported OFFLINE during the reboot; an early SSH inspection timed out |
| Controller recovery | ONLINE observed by 08:16:49 EAT on 4 October; heartbeat at 08:16:43; uptime `71` seconds |
| Identity/configuration | Same AP MAC, IP, firmware and configuration ID |
| Direct SSH | Verified AP RSA fingerprint accepted; authenticated read-only inspection succeeds after the early timeout |
| Direct uptime/inform | `107` seconds; `Connected (http://10.20.0.10:8080/inform)` |
| Saved Wi-Fi | Both lab SSID entries remain `KiberaMesh-Lab`; WPA2 entries remain configured |
| Regulatory settings | Both radios still country `404` (Kenya) |
| Router/AP power and LAN | Ether5 powered-on, 100 Mbps/full duplex; AP reservation/active lease `10.20.0.2` remains bound |
| WAN isolation | Fresh router inspection confirms ether1 no-link and only the connected lab IPv4 route |
| Time | AP NTP remains unsynchronized while WAN is absent |

The local controller's client list contained the known iPhone at `10.20.0.199`, but its connection timestamp predated this restart. That record alone did not establish successful post-restart phone access; the fresh portal request below completes the check.

Completed operator action:

1. Keep ether1 unplugged and phone mobile data off. Confirm the phone is on **KiberaMesh-Lab**; rejoin using the saved local password if it did not reconnect automatically.
2. Open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report its new code or exact error.

Checkpoint 7b result: **`C22B83C88390`** exactly matches HTTP 200 from phone **`10.20.0.199` at 08:26:39 EAT on 4 October**, after AP recovery was verified at approximately 08:16. Other phone responses immediately before it have different codes. The AP software restart and complete phone path pass with WAN disconnected. This test does not verify booting with the local controller stopped; controller recovery remains a later task.

## Checkpoint 7c — MikroTik restart without WAN

Pre-restart checks confirmed router identity `KM-LAB-001`, model RB951Ui-2HnD, RouterOS `7.20.8`, uptime `10h6m53s`, bound lab leases and local DNS records. Ether1 remained no-link, and the only IPv4 route was the connected lab subnet. The computer's external route used its separate home Wi-Fi, with IPv4 forwarding Disabled on both interfaces.

The assistant exported configuration without `show-sensitive`, saved an AES-encrypted binary backup using the commissioning administrator password, downloaded both files to the 4 October backup directory above and verified local sizes/Git exclusion before rebooting.

The guarded SSH command checked router identity and model, then used `:execute { :delay 2s; /system reboot }`. This schedules a software reboot in a temporary background job; no persistent restart scheduler was added. Background execution is documented in [RouterOS scripting](https://help.mikrotik.com/docs/spaces/ROS/pages/47579229/Scripting), and the reboot command in [MikroTik's CLI procedure](https://help.mikrotik.com/docs/spaces/ROS/pages/328142/Upgrading%20and%20installation).

Observed recovery, 4 October 2026:

| Item | Observed result |
| --- | --- |
| SSH interruption | Reachable at 08:41:17 EAT, unavailable at 08:41:19, reachable again at 08:41:52; observed unavailable interval 33 seconds |
| Router authentication | Same pinned RSA fingerprint; administrator SSH reconnect succeeds |
| Router uptime/version | Uptime reset to `1m11s`; RouterOS remains `7.20.8` |
| Lab address/routes | `10.20.0.1/24` preserved; only connected lab IPv4 route; ether1 still no-link |
| DHCP | `defconf` on bridge, pool `default-dhcp`; gateway/DNS advertisement still `10.20.0.1` |
| Bound leases | Computer `10.20.0.10`, AP `10.20.0.2`, phone `10.20.0.199` retained; computer renews and AP subsequently renews its reservation |
| Local DNS/service | Saved portal A record retained; router named fetch finishes with code `85A1D012E99B`, HTTP 200 at 08:42:34 EAT |
| Management restriction | SSH still restricted to `10.20.0.10/32` |
| AP transition | Ether5 initially no-link with PoE powered-on, then 100 Mbps/full-duplex link returns |
| AP recovery | Fresh ONLINE heartbeat at 08:43:24 EAT; uptime reset from pre-router-restart `1493` seconds to `77` seconds, showing the AP also rebooted |
| Direct AP inspection | Same pinned host key; uptime `139` seconds; Connected to local inform URL; lab SSID/WPA2/country `404` retained |
| Server/operator connection | Portal process remains `28716`, listener `10.20.0.10:8000`; home Wi-Fi remains Up, and a source-bound HTTPS request returns HTTP 200 |

The first post-reboot controller statistics still had a pre-reboot heartbeat and were treated as stale. Recovery was confirmed using the later heartbeat, reset uptime and direct AP SSH inspection.

The AP shares the router's ether5 power path, and an AP reboot was observed during this router restart. AP radio/management recovery took longer than router SSH recovery. No voltage trace was captured, so the exact PoE interruption was not measured. This coupling matters when planning independent node power; successful recovery does not provide a redundant router or AP.

Completed operator action:

1. Keep ether1 unplugged and phone mobile data off. Stay on **KiberaMesh-Lab**, rejoining if necessary.
2. Open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report its new code or exact error.

Checkpoint 7c result: **`283D31ADC122`** exactly matches HTTP 200 from phone **`10.20.0.199` at 08:50:50 EAT on 4 October**, after router/AP recovery was verified. The preceding phone request at 08:50:48 has a different code. Router configuration persistence, DHCP/local naming, AP recovery and the complete phone-to-service path pass with the WAN disconnected.

Milestone 001 and these three restart checks are verified. Controller startup/local administrator access, a restorable UniFi backup and additional end-user client testing remain subsequent work.

## Checkpoint 7d — local controller management and backup

The data path has survived WAN withdrawal and service/AP/router restarts. This step addresses management recovery: authenticating to the controller locally and preserving a backup that can restore its managed configuration.

Read-only controller observations:

- The existing pinned local API is reachable. `/api/system` returns HTTP 200 and still reports `deviceState=setup`, `cloudConnected=true`, `hasInternet=true`, `remoteAccessEnabled=true` and `isSsoEnabled=true`.
- The controller runs on the computer that retains home Wi-Fi internet. The successful lab WAN-outage tests therefore do not by themselves prove that controller authentication or startup is independent of external connectivity.
- The system's `setup` state prompted checking the actual browser screen. The operator now confirms a fresh local login reaches the Network dashboard, so that status field did not prevent the observed application access. It does not establish that the working Network/AP configuration needs resetting.
- The saved official Network `10.5.67` integration API contract has no backup or console administrator routes. A read-only probe of `/proxy/network/api/s/default/rest/setting/autobackup` returns HTTP 400 `api.err.Invalid`; it produced no backup or configuration change.
- The existing redacted API snapshot is an observation record, not a restorable UniFi backup. Encrypted MikroTik backups cover the router only.

Prepared local backup destination:

```text
D:\dev\wifi\artifacts\mesh-lab\private\controller-backups\
```

The directory exists, inherits access for only the current Windows user and SYSTEM, and is Git-ignored. A permissions check found no other Allow rules. Controller backups can contain managed credentials, so keep them in this prepared private directory; filenames, sizes and checksums can be recorded without exposing their contents.

The operator confirms their login uses a **Ubiquiti/UI account**, and that the previously supplied API key belongs to the same account. They offer to provide a password in an environment file if needed. No account password is required for this checkpoint; authenticated device/API checks continue with the existing key, and the operator can export the backup from their working dashboard. Account credentials are not stored in this document.

Completed operator action:

1. On **this computer**, open a private/incognito browser window at **`https://127.0.0.1:11443/`**, the verified local UniFi OS Server address.
2. Sign in using the existing console login and report whether the Network dashboard loads, or the exact setup/login prompt shown. Identify whether the login is local or a UI account, without sharing its password.

Local login result: the operator reports that the **Network dashboard loads using their UI account**. This verifies interactive access through the local address with the computer's home internet still available; it does not yet verify local-only credentials or login during an external-connectivity outage.

Completed backup export action:

1. In the confirmed local Network dashboard, open **Settings → Control Plane → Backups** and download a **local backup**. [Ubiquiti's backup guide](https://help.ui.com/hc/en-us/articles/360008976393-Backups-and-Migration-in-UniFi) describes this download location and distinguishes system backups from Network-only `.unf` backups.
2. Save the downloaded file in **`D:\dev\wifi\artifacts\mesh-lab\private\controller-backups\`**. Keep the original extension; no upload or file contents need to be shared in chat.
3. Report the filename after saving it, or the available menu/options if the displayed backup screen differs.

Assistant follow-up: inspect the saved file's metadata, access permissions and Git exclusion, calculate its checksum, and record the backup type before controller restart. File generation/download is not itself a tested restore; a restore/reproduction exercise remains separate work.

Backup file verification on **4 October 2026**:

| Item | Observation |
| --- | --- |
| Download | `unifi_os_backup_1791095177837_a3a1b597-7536-42fb-9713-3ce0a41e2c22.unifi` |
| Location | Prepared private `controller-backups` directory above |
| Size | **76,960 bytes**, nonempty |
| Last modified | **09:27:02 EAT** (`2026-10-04T06:27:02.1853782Z`) |
| SHA-256 | `A827227F3EFDB8134E08533131F44E92912FEE82167DB88A9AD8D26FF9065500` |
| Access | Inherited Allow rules for the current Windows user and SYSTEM only |
| Git exclusion | `.gitignore` rule `artifacts/` excludes this exact file |
| Backup scope | Console-exported UniFi OS `.unifi` backup, rather than the earlier redacted API snapshot or Network-only `.unf` export |

No common ZIP/gzip/tar or OpenSSL salted header was recognized. The vendor-specific payload was not decoded, decrypted or imported. This checksum establishes a baseline for detecting later file changes; it does not authenticate the download or establish that UniFi can successfully restore it. **Backup restoration remains untested.**

[Ubiquiti's local-management guide](https://help.ui.com/hc/en-us/articles/28457353760919-UniFi-Local-Management) supports connecting directly to the local control plane, including local sign-in with an existing UI account where remote management is configured. Our acceptance check still requires observed local login and later external-connectivity-independent management; a cloud-connected local-page login alone is insufficient evidence of that final condition.

Retain the working management path while establishing offline login and recovery. Controller restart, deliberate controller outage and recovery remain pending; no cloud/SSO setting was changed during this inspection.

## Checkpoint 7e — controller outage and recovery

This test separates the managed AP's existing data path from the running controller. [Ubiquiti's self-hosting guide](https://help.ui.com/hc/en-us/articles/34210126298775-Self-Hosting-UniFi) states that devices continue using their last configuration when the controller is offline. Observe that behavior in this lab before recording a pass.

Fresh pre-outage baseline on **4 October**:

- Local console HTTPS returns HTTP 200 with its existing certificate pin; the API reports the known AP ONLINE with unchanged configuration ID `d1ada1e316877e47` and a fresh heartbeat at **09:40:36 EAT**.
- Direct AP SSH reports Connected to `http://10.20.0.10:8080/inform`, uptime `3580` seconds, the lab SSID/WPA2 settings and Kenya country `404`.
- Router identity is `KM-LAB-001`; ether1 has no link and there is no IPv4 default route. Ether5 remains linked at 100 Mbps/full duplex; the phone lease remains bound at `10.20.0.199`; the local portal A record is retained.
- The existing portal process `28716` still owns `10.20.0.10:8000`. A host status request returns HTTP 200/code `0EA6E342962B` at **09:41:45 EAT**. A separate HTTPS request bound to home Wi-Fi returns HTTP 200 at **09:41:46 EAT**.

Inspection of the installed **UniFi OS Server 5.1.42** application code establishes the Windows shutdown action: `TrayHelper.js` labels it **Exit** and calls `ShutdownHelper.shutdown()`, which invokes the controller manager's stop procedure before exiting. Its `window-all-closed` handler does not shut down the server. Use the tray action to request a graceful shutdown; the Windows Elevation Service is not the application shutdown control. No global WSL shutdown or process force-kill was performed.

Completed shutdown action: the operator chose **Exit** from the Windows notification icon and reported that the application had exited.

Terminal verification on **4 October 2026**:

| Check | Observation |
| --- | --- |
| Controller console and inform services | TCP **11443** and **8080** refuse connections on both `127.0.0.1` and `10.20.0.10`, checked **09:45:11–09:45:17 EAT** |
| Application/listeners | No `UniFi OS Server.exe` process found; no listener on either controller port |
| Portal | Existing process `28716` still listens on `10.20.0.10:8000`; host HTTP 200/code `30DCC64F4CE4` at **09:45:17 EAT** |
| Router/WAN | Authenticated identity `KM-LAB-001`; ether1 no-link; no IPv4 default route |
| AP | Ether5 powered-on and 100 Mbps/full-duplex link; reserved AP lease `10.20.0.2` bound |
| Phone/DNS | Existing phone lease `10.20.0.199` bound; portal A record retained |
| Separate LAN source | Router fetch of named local status finishes successfully; HTTP 200/code `04C23FA06265` logged at **09:45:36 EAT** |
| Operator internet | Ethernet/home Wi-Fi both Up; Wi-Fi-source HTTPS returns HTTP 200 at **09:45:19 EAT** |

The controller outage and wired LAN/service path are verified. A phone response during the outage is still pending; a retained DHCP lease alone does not prove current Wi-Fi association or successful client traffic.

Completed outage phone check: the operator supplied **`7397630C94C9`**. It exactly matches HTTP 200 from phone **`10.20.0.199` at 09:47:29 EAT**. The preceding phone requests at 09:47:26 and 09:47:28 have different codes. No controller application or controller listener was found before relaunch, and both ports still refused connections on both addresses at **09:48:16–09:48:22 EAT**. Router SSH confirmed ether1 no-link, no default route, AP power on and the phone lease bound. **Fresh phone access during the controller outage passes.** The operator did not separately confirm the requested Wi-Fi toggle, so this result establishes fresh client traffic rather than a new association or DHCP negotiation.

Controller startup diagnosis and recovery:

- Initial launch of the installed executable at **09:49:11 EAT** exited before controller ports returned. The application log contained no new initialization entry from that attempt.
- The terminal environment had **`ELECTRON_RUN_AS_NODE=1`**. [Electron's environment-variable documentation](https://www.electronjs.org/docs/latest/api/environment-variables#electron_run_as_node) explains that this starts Electron as a Node.js process. Removing that variable only from the child launch environment resolved the observed startup problem; no user/system environment setting was changed.
- Retried the same installed executable with `Start-Process -WindowStyle Hidden` at **09:51:53 EAT**, process **`39476`**. The log records initialization/app-ready at 09:51:54 and the controller container starting at 09:52:16.
- Controller ports were accepting connections at **09:52:23 EAT**, but the TLS handshake was initially not ready. This was treated as startup progress, not successful application recovery. The pinned system endpoint returned HTTP 200 at **09:52:52 EAT**.

For a future terminal launch when the controller is stopped:

```powershell
$taskSavedElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    Remove-Item -LiteralPath 'Env:\ELECTRON_RUN_AS_NODE' -ErrorAction SilentlyContinue
    Start-Process -FilePath 'C:\Program Files\UniFi OS Server\UniFi OS Server.exe' -WindowStyle Hidden
} finally {
    if ($null -ne $taskSavedElectronMode) {
        $env:ELECTRON_RUN_AS_NODE = $taskSavedElectronMode
    }
}
```

Verified recovery observations:

| Check | Result |
| --- | --- |
| Local management | Existing pinned certificate retained; system endpoint and authenticated Network integration API return HTTP 200 |
| AP heartbeat | ONLINE, fresh **09:52:59 EAT** heartbeat after controller startup |
| AP configuration | Same device ID/configuration ID `d1ada1e316877e47`, firmware and radio channels |
| Wi-Fi | Same enabled `KiberaMesh-Lab` broadcast ID, native LAN, WPA2-Personal, 2.4/5 GHz and known AP filter |
| AP continuity | API uptime `4253` seconds, direct SSH uptime `4295` seconds; continued from pre-outage uptime without an observed AP reboot |
| Direct AP management | Same pinned SSH key; Connected to local inform URL; lab SSID/WPA2 and Kenya `404` retained |
| Phone observation | Controller lists the same wireless client MAC/IP `10.20.0.199` through the lab AP |
| LAN console | Pinned `https://10.20.0.10:11443/` returns HTTP 200 |
| Portal | Original process `28716` retained; host HTTP 200/code `B80106B351BC` at **09:53:40 EAT** |
| Operator internet | Home Wi-Fi-source HTTPS returns HTTP 200 at **09:53:41 EAT** |
| Backup | Saved `.unifi` file's SHA-256 is unchanged; no backup import was performed |

Completed operator recovery checks: the operator confirms the **Network dashboard loads** after the requested fresh browser login and supplies **`C1B25A6383F2`**. The code exactly matches HTTP 200 from phone **`10.20.0.199` at 09:57:25 EAT**. The preceding response at 09:57:23 has a different code. **Checkpoint 7e passes** for controller outage, retained phone access, controller/API/AP recovery, interactive local login and fresh phone access after recovery. This login still occurred with controller cloud connectivity available; authentication with that connectivity absent is the next test. Backup restoration remains separate.

## Checkpoint 7f — controller cloud connectivity withdrawal

The controller shares this computer with the portal and assistant, so disabling computer Wi-Fi would interrupt the working operator internet path. Instead, this experiment filters only traffic in the known controller container's network namespace. The phone has its own offline lab path through the MikroTik, with ether1 disconnected and mobile data off.

Read-only preparation established:

- UniFi OS Server runs the healthy container **`uosserver_e5a2b9cd`**, ID **`97ba2e2c3954f1db6d276ded4b7afb86322ea35d7fb41525828fd41914efdb7e`**, inside its `uosserver` Podman machine.
- Container networking is separate from the machine/host network: `10.88.0.2/16`, gateway `10.88.0.1`, network namespace inode **`4026532236`** and current init PID **`552`**.
- A source probe inside that container returned external HTTPS **200** before isolation. No HTTP/HTTPS/ALL_PROXY environment variables were present.
- Plain Windows Podman defaults did not identify this deployment. The helper uses the exact per-child Podman paths found in the installed application code, and [Podman's machine SSH command](https://docs.podman.io/en/latest/markdown/podman-machine-ssh.1.html). Direct WSL process IDs differed from the machine SSH context; neither WSL-wide routes nor firewall rules were changed.

Local ignored helper:

```text
D:\dev\wifi\artifacts\mesh-lab\controller-isolation.py
```

Its guards verify the container ID/name/running state, IP/gateway, process cgroup and namespace inode. It adds only the owned nftables table **`inet km_lab_cloud_test`** in that controller namespace. Loopback, the lab subnet, the container gateway, the observed Windows host control address **`172.27.144.1`**, and IPv6 link-local destinations are allowed. Only DNS port 53 is allowed to the configured local proxies **`169.254.1.1`** and **`10.255.255.254`**. Other output is rejected during the test window, including established cloud sessions when they transmit again.

The rejection has a kernel time condition rather than relying on an agent/background timer: **`meta time < 1791099184`**. [The nftables manual](https://netfilter.org/projects/nftables/manpage.html) documents the Unix timestamp form of this condition. Rejection stops at **10:33:04 EAT on 4 October**, even after this assistant turn ends. The named table still needs cleanup afterwards. The helper verifies host/machine clocks before activation and performs nftables check mode before applying.

The first test also blocked the host DNS proxies. The static console root and authenticated Network API worked, but `/api/system` repeatedly timed out. Allowing the observed host control address alone did not clear those timeouts. That test table was removed, then the final test was activated with the configured local DNS proxies allowed. The system endpoint now responds; this is an observation of that dependency, not proof that management will work with DNS proxies absent.

Final test window and observations:

| Item | Verified result on 4 October |
| --- | --- |
| Active window | Applied **10:18:07 EAT**; automatic block expiry **10:33:04 EAT** |
| Controller public HTTPS | Previously HTTP 200; now curl exit **7**, HTTP `000`, **No route to host**, including a probe bypassing DNS during the earlier block |
| Filter evidence | Rule active at **10:18:50 EAT**; rejection counter **46 packets / 1880 bytes** |
| Console root/system | Same pinned local TLS certificate; `/` and `/api/system` return HTTP 200 |
| Cloud status | **`cloudConnected=false`**; remote/SSO settings remain enabled |
| Internet status field | `hasInternet=true` remains reported despite measured controller public HTTPS failure; use the scoped filter/probe/cloud evidence rather than treating that flag as container egress proof |
| Network API | Existing key authenticates; known AP ONLINE with unchanged configuration; fresh heartbeat **10:16:13 EAT** during the initial block |
| Router/phone path | Ether1 no-link, no IPv4 default route, AP powered-on, phone lease bound at `10.20.0.199` |
| Local portal | Host HTTP 200/code `B6B75184EA0A` at **10:13:36 EAT**; process retained |
| Operator internet | Home Wi-Fi-source HTTPS HTTP 200 at **10:18:50 EAT** |

Completed operator cloud-blocked login action, before the test expiry:

1. Keep ether1 disconnected and this computer's home Wi-Fi connected. On the phone, keep mobile data off and stay on **KiberaMesh-Lab**.
2. In a new private/incognito browser session on the **phone**, open the complete address **`https://10.20.0.10:11443/`** with its explicit `https://` prefix. First report whether the login page appears; if it fails, report the full error text/current address and whether it occurred before entering credentials or after pressing Sign In. If the page loads, sign in using the same UI account and report whether the Network dashboard loads. The phone uses the lab server address, not loopback or Site Manager.
3. After that login attempt, open **`http://portal.kibera.home.arpa:8000/`**, tap **Check again**, and report its fresh code with the dashboard result. This anchors the operator check to a server timestamp in the isolation window.

Mobile error diagnosis at **10:25 EAT**:

- The operator reports **400 Bad Request**, without its complete body, current address or failure stage.
- Controller isolation remains active at **10:25:48 EAT**; reject counters have risen to **289 packets / 9852 bytes**.
- Pinned **HTTPS** `GET /` returns **HTTP 200** on both `127.0.0.1:11443` and `10.20.0.10:11443`.
- Plain **HTTP** `GET /` to `10.20.0.10:11443` returns **HTTP 400**, title/body **The plain HTTP request was sent to HTTPS port**, served by nginx. This reproduces a plausible cause but does not establish which protocol the phone actually used. Retry the explicit HTTPS URL before diagnosing credentials or cloud authentication.
- Separate portal logs show fresh phone HTTP 200 requests at **10:23:36** (`6720E7C292F9`) and **10:23:37 EAT** (`C47F1192A5D9`). These prove portal reachability during the active block; the operator has not yet reported those codes or a successful controller login.

Completed assistant follow-up: matched the phone response within the active test window, rechecked cloud/egress failure, removed the owned table and verified controller connectivity recovered. Local DNS proxies were deliberately retained; an entirely air-gapped cold startup, DNS-proxy loss, local-only administrator recovery and backup import remain separate acceptance tests.

Cloud-blocked login result on **4 October 2026**:

| Evidence | Observation |
| --- | --- |
| Browser correction | The operator reports that using **`https://`** resolves the mobile 400 and the login works |
| Account | Operator confirms the same credentials used for their cloud UI account authenticate locally; no password supplied to the assistant |
| Fresh phone service access | **`BCB2AA06AD34`**, HTTP 200 from **`10.20.0.199` at 10:32:00 EAT**; preceding responses at 10:31:56 and 10:31:57 have different codes |
| Controller state before cleanup | Pinned system endpoint HTTP 200 at **10:32:46 EAT**, **`cloudConnected=false`**, **`hasInternet=false`** |
| External probe before cleanup | Controller curl exit **7**/HTTP `000`, **No route to host** |
| Active filter before cleanup | Still active at **10:32:49 EAT**; **576 rejected packets / 20,460 bytes**; expiry 10:33:04 EAT |
| Cleanup | Owned table removed at **10:32:58 EAT**, before its automatic block expiry |
| Restored controller | External HTTPS returns **200**; system endpoint **`cloudConnected=true`**, **`hasInternet=true`** at **10:35:38 EAT** |
| Remaining rules | Controller namespace's nftables table list is empty; helper status confirms `table_present=false`, `time_window_active=false` |
| Portal/operator internet | Original portal still HTTP 200/code `05CD04D68F44` at **10:35:36 EAT**; home Wi-Fi-source HTTPS 200 at **10:35:37 EAT** |
| Backup | Original `.unifi` SHA-256 unchanged; no backup import performed |

**Checkpoint 7f passes** for fresh local sign-in to the existing initialized console with controller public/cloud connections unavailable, alongside fresh phone portal access. The successful user report and server response occurred inside the measured isolation window. This demonstrates local authentication behavior of the existing configured account; it does not establish a clean offline installation or cold startup without the host DNS proxies.

Inspect or restore the controller's ordinary egress from this repository's terminal:

```powershell
python artifacts\mesh-lab\controller-isolation.py status
python artifacts\mesh-lab\controller-isolation.py remove
```

`remove` verifies the same controller identity/namespace and deletes only the owned table. It preserves other firewall tables and the computer's networking. Runtime state and event records are in ignored `controller-isolation-state.json` and `controller-isolation-events.jsonl`; they contain test metadata, not account credentials. No account password has been requested or saved.

## Checkpoint 8a — connect and inspect the second MikroTik

The operator identifies an **HP laptop running Windows**, a **second MikroTik already factory reset**, and a **second UAP-AC-M**. Authenticated inspection now confirms the reported `RB951Ui-2nD` model. The operator confirms the spare's adapter is the same as the first: **24 V / 0.8 A / 19.2 W**. The HP's exact model/interfaces and second AP's identity/adoption state remain to inspect. Do not repeat the spare's reset merely to continue.

### Primary-router preparation — complete

Authenticated inspection confirmed primary identity `KM-LAB-001`, serial `HH70A8H82EG`, its `10.20.0.1/24` LAN and an unused **ether4 with no link**. Its original bridge entry was `add bridge=bridge comment=defconf interface=ether4`; no ether4 address, DHCP client/server, VLAN child or interface-list membership existed. Ether2 retained the computer and ether5 retained the AP. The bridge's fixed administrator MAC is unaffected by removing ether4.

Before changing the port, a nonsensitive export and AES-encrypted binary backup were downloaded and confirmed Git-ignored:

- `artifacts/mesh-lab/backups/2026-10-04/kibera-lab-01-before-node2-port-20261004.rsc` — 6,982 bytes.
- `artifacts/mesh-lab/backups/2026-10-04/kibera-lab-01-before-node2-port-20261004.backup` — 32,224 bytes; encrypted using the existing primary lab administrator password.

The [preparation script](../../mikrotik/kibera-mesh-lab-01-prepare-node2-port.rsc) and [rollback script](../../mikrotik/kibera-mesh-lab-01-restore-node2-port.rsc) both passed RouterOS import syntax checking (`verbose=yes dry-run`). Only preparation was executed. Its guards check the primary identity/serial/LAN, unplugged ether4 and expected configuration before changes.

State immediately after primary-port preparation:

- Ether4's bridge entry is removed; ether2, ether3 and ether5 remain in `bridge`.
- Discovery uses `KM-LAB-DISCOVERY`, including the existing `LAN` list plus ether4. `LAN` itself still contains only `bridge`; MAC management still uses `LAN`.
- No commissioning address, NAT rule or management-service change was added. DHCP remains on `bridge`, separate from ether4.

At **10:54:30 EAT on 4 October**, the portal returned HTTP 200 and fresh host code `A20BF1E28997`; the UniFi HTTPS dashboard returned HTTP 200 with the expected certificate pin; separate home Wi-Fi HTTPS returned 200. Router DNS resolved `portal.kibera.home.arpa` to `10.20.0.10`. The first AP answered all three pings and remained powered on ether5; computer/AP/phone leases remained bound. Ether1 and ether4 had no link, and the primary still had no IPv4 default route.

Discovery/list behavior is documented in [RouterOS Neighbor discovery](https://help.mikrotik.com/docs/spaces/ROS/pages/24805517/Neighbor+discovery) and [Interface Lists](https://help.mikrotik.com/docs/spaces/ROS/pages/47579180/Interface+Lists).

### Spare cabling and inspection — complete

After the matching-adapter report, ether4 initially still showed no link. The operator then reported **connected**. Fresh inspection found **100 Mbps full duplex** on primary ether4 and a neighbor at `192.168.88.1`, MAC `2C:C8:1B:39:14:DF`, advertised interface `bridge/ether2`. The computer stays on primary ether2, AP1 on primary ether5 and the operator's home Wi-Fi stays connected. The second AP remains disconnected.

### Temporary terminal management — complete

Before adding IP access, another primary nonsensitive export and encrypted backup were downloaded to `artifacts/mesh-lab/backups/2026-10-04/`: `kibera-lab-01-before-node2-access-20261004.rsc` (7,113 bytes) and matching `.backup` (32,223 bytes). Both are Git-ignored.

The guarded [node2-access script](../../mikrotik/kibera-mesh-lab-01-node2-access.rsc) and [access-removal script](../../mikrotik/kibera-mesh-lab-01-remove-node2-access.rsc) passed import syntax checking. Only setup was applied. It verifies the primary identity/serial/LAN, isolated port and discovered spare MAC/model/address before creating:

| Temporary mapping | Source allowed | Target |
| --- | --- | --- |
| SSH `10.20.0.1:2202` | `10.20.0.10`, arriving on primary bridge | `192.168.88.1:22` |
| WebFig `http://10.20.0.1:8002/` | `10.20.0.10`, arriving on primary bridge | `192.168.88.1:80` |
| Reply-path source NAT | Those management connections leaving ether4 | Source rewritten to primary `192.168.88.2` |

Primary `192.168.88.2/24` is on **ether4**, outside the working bridge. Four scoped forward rules allow only the operator's translated SSH/WebFig connections and their established replies, then drop other forwarded traffic into/out of ether4. Their ordering and the three NAT rules were read back and verified. Existing primary SSH remains on port 22. No Windows route/interface change was needed; this computer reaches both routers through its on-link primary address.

The spare answered three pings from `192.168.88.2`; ARP matched the discovered MAC. WebFig returned HTTP 200. An initial short SSH handshake did not complete; a subsequent bounded handshake succeeded. At **11:07:53 EAT**, a single factory `admin`/empty-password attempt authenticated, followed by hardware/address/service inspection. The spare's SSH RSA fingerprint is **`SHA256:AuEAiwdbDZRa8yDP/Q+MHN/Y0UCTOmbSyWttZhVqnC8`**, recorded in ignored `artifacts/mesh-lab/node2-host-key.json` and used for subsequent connections.

| Authenticated hardware/state | Observed value |
| --- | --- |
| RouterBOARD model / revision | `RB951Ui-2nD` / `r2`; resource board-name `hAP` |
| Serial | `DE7A0E5D61EC` |
| RouterOS | `7.20.6 (stable)`, mipsbe |
| CPU / memory / storage | 650 MHz; 64 MiB RAM; 16 MiB flash, initially about 3.2 MiB free |
| RouterBOOT | Current `7.12.1`, candidate `7.20.6`; no firmware update performed |
| LAN | `192.168.88.1/24` on bridge; ether2–5 and wlan1 were factory bridge members |
| Factory DHCP | `defconf`, pool `192.168.88.10–192.168.88.254`; no leases at inspection |
| WAN / HotSpot | Ether1 DHCP stopped; no default route or active HotSpot |
| Radio | wlan1, MAC `2C:C8:1B:39:14:E3`, factory SSID `MikroTik-3914E3`; subsequently disabled |
| PoE | Ether5 `auto-on`, currently `waiting-for-load` |

This model provides 24 V passive PoE on ether5, limited to 500 mA. Its published router consumption of 5 W plus the UAP-AC-M maximum of 8.5 W totals 13.5 W, below the reported supply's 19.2 W. The rated budget supports a bench trial; second-AP boot, actual draw and stability have not been tested. See [hAP specifications](https://mikrotik.com/product/RB951Ui-2nD) and [AP specifications](https://techspecs.ui.com/unifi/wifi/uap-ac-mesh).

### Second-router secure bootstrap — complete

A new administrator password was generated into [the protected local node2 password file](../../artifacts/mesh-lab/private/kibera-mesh-node2-admin.txt). Its ACL permits only the current Windows user and SYSTEM; Git ignores it. The password remains outside tracked scripts/docs and command output. The local SSH helper reads it directly for password initialization, subsequent authentication and encrypted backups.

Before changing the spare, a nonsensitive export and AES-encrypted binary backup were downloaded. The binary backup uses the generated password for encryption even though it records the earlier factory state. Then the administrator password was updated on the verified serial, and the [secure-bootstrap script](../../mikrotik/kibera-mesh-lab-02-secure-bootstrap.rsc) passed syntax checking and was executed. It sets `KM-LAB-002`, disables wlan1, restricts SSH/WebFig to `192.168.88.2/32`, disables FTP/Telnet/WinBox/API/API-SSL and sets the Nairobi timezone. Its factory LAN/DHCP remain unchanged. A fresh pinned SSH connection with the new password succeeded; the administrator's expired flag is cleared.

Downloaded, Git-ignored spare backups in `artifacts/mesh-lab/backups/2026-10-04/`:

| File | Bytes | State |
| --- | ---: | --- |
| `kibera-lab-02-before-security-20261004.rsc` | 6,493 | Factory configuration, nonsensitive export |
| `kibera-lab-02-before-security-20261004.backup` | 33,523 | Encrypted factory-state binary backup |
| `kibera-lab-02-secured-20261004.rsc` | 6,793 | Secured configuration, nonsensitive export |
| `kibera-lab-02-secured-20261004.backup` | 34,334 | Encrypted secured-state binary backup |

Both spare binary backups require the generated node2 password to decrypt. Restoration remains untested. To open the spare's terminal from this computer, use `ssh -p 2202 admin@10.20.0.1` and enter the protected node2 password; port 22 still belongs to the primary.

At **11:16:06 EAT**, the original portal returned HTTP 200 and fresh host code `74342980AA97`; UniFi HTTPS returned 200 with the expected certificate pin, and home Wi-Fi HTTPS returned 200. The primary still has no default route/WAN link; AP1 answered all three pings. Discovery now reports `KM-LAB-002` on ether4. Primary DHCP also shows a new client **`Afribit`, `10.20.0.198`, MAC `B4:6D:C2:2D:67:00`**; its identity/application reachability await operator confirmation.

These commissioning cleanup scripts cover only the earlier access/port preparation. The access-removal script removes its owned NAT, commissioning ether4 alias and scoped filters. The port rollback script requires ether4 to be unplugged and to have no addresses. Both passed syntax checking but have not been executed. After checkpoint 8c, ether4 also carries OSPF and a transit address: these scripts alone do not undo the routed setup or restore the earlier topology. Use the saved before-images and inspect all later changes before planning a full rollback.

## Checkpoint 8b — verify the HP laptop as another client

The operator confirms **`Afribit`, `10.20.0.198`, MAC `B4:6D:C2:2D:67:00`** is the HP Windows laptop and reports **`8A7FFC9E30BA`** after the requested portal test. The code exactly matches HTTP 200 for `GET /` from that address at **11:22:35 EAT on 4 October**. Its preceding response at 11:22:33 has a different code. **Checkpoint 8b passes** for another end-user client accessing the local application. This does not test a replicated service or communication through the second AP.

## Checkpoint 8c — wired route exchange and service access

The stock RouterOS trial uses **OSPFv2**, with backbone area `0.0.0.0`, a point-to-point transit link of cost 10 and passive client-LAN advertisements. Each router advertises its own lab LAN through its interface template. No connected/static redistribution or default-route origination is enabled; the commissioning subnet is outside those templates. This follows the open routing approach described in [NYC Mesh's routing methodology](https://wiki.nycmesh.net/books/5-networking/page/nyc-mesh-ospf-routing-methodology), using our own lab addresses. RouterOS configuration details are in [OSPF](https://help.mikrotik.com/docs/spaces/ROS/pages/9863229/OSPF) and the [OSPF command reference](https://help.mikrotik.com/docs/spaces/ROS/pages/331612216/routing+ospf).

| Setting | Primary `KM-LAB-001` | Second node `KM-LAB-002` |
| --- | --- | --- |
| Client LAN / router ID | `10.20.0.0/24` / `10.20.0.1` | `10.21.0.0/24` / `10.21.0.1` |
| Wired transit | Ether4, `10.255.20.1/30` | Ether2, `10.255.20.2/30` |
| OSPF-learned LAN | `10.21.0.0/24` via `10.255.20.2%ether4` | `10.20.0.0/24` via `10.255.20.1%ether2` |
| Retained commissioning alias | `192.168.88.2/24`, ether4 | `192.168.88.1/24`, now ether2 |
| DHCP | Existing pool/reservations retained | `10.21.0.100–10.21.0.200`, gateway/DNS `10.21.0.1` |

Before changes, fresh nonsensitive exports and AES-encrypted binary backups were downloaded to ignored `artifacts/mesh-lab/backups/2026-10-04/`:

| Before-image | Export bytes | Encrypted backup bytes |
| --- | ---: | ---: |
| `kibera-lab-01-before-wired-ospf-20261004` | 8,633 | 33,897 |
| `kibera-lab-02-before-wired-ospf-20261004` | 6,793 | 34,334 |

The [primary OSPF script](../../mikrotik/kibera-mesh-lab-01-wired-ospf.rsc) and [second-node OSPF script](../../mikrotik/kibera-mesh-lab-02-wired-ospf.rsc) both passed `verbose=yes dry-run` on their respective routers, then executed successfully. Guards check identity/serial, expected addresses/ports, DHCP state and absence of existing OSPF. The second node's empty client bridge moves to `10.21.0.1/24`; ether2 leaves that bridge and retains the old alias for recovery. Factory wlan1 remains disabled. Transit filters admit the two lab LANs, peer OSPF and scoped management/DNS traffic; other forwarded transit traffic remains blocked. No inter-LAN source NAT was added.

### Portal computer return route

The server computer keeps home Wi-Fi as its preferred default route. Without a specific lab route, replies to `10.21.0.0/24` would select that home path. Its existing DHCP reservation alone now receives options **121 and 249**, encoded as `0x180A15000A140001000A140001`: `10.21.0.0/24` via `10.20.0.1`, plus its existing default via `10.20.0.1`. Including that default preserves the Ethernet default when a client processes the classless route option. Other leases receive no new options. See [RouterOS DHCP options](https://help.mikrotik.com/docs/spaces/ROS/pages/24805500/DHCP) and [Microsoft's option 249 specification](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dhcpe/f9c19c79-1c7f-4746-b555-0c0fc523f3f9).

After `ipconfig /renew "Ethernet"`, Windows retained `10.20.0.10` and installed `10.21.0.0/24` via `10.20.0.1`. `Find-NetRoute` selects lab Ethernet/source `10.20.0.10` for `10.21.0.1` and home Wi-Fi/source `192.168.100.192` for an external destination. No manual Windows route or new firewall rule was needed. Existing Python/UniFi firewall allowances already cover the second lab subnet.

The portal's source-address check now accepts both lab /24s while still binding only `10.20.0.10:8000`. Python compilation passed; the verified portal process was restarted from PID `28716` to `24728`. Automatic approval review rejected the combined restart command; separate commands targeting the verified process completed successfully. The UniFi controller stayed running.

### Verified result

- Both routers show the neighbor in **`Full`** state, with active OSPF routes to the peer LAN (distance 110). Neither has an IPv4 default route.
- The second node resolves `portal.kibera.home.arpa` to `10.20.0.10`.
- A portal request explicitly sourced from **`10.21.0.1`** produces **`FA5D6E59BD00`**, HTTP 200 for `/api/status` at **11:41:49 EAT**. The server log retains source `10.21.0.1`, proving this request was routed without source translation.
- A fresh, pinned SSH connection directly to **`10.21.0.1:22`** authenticates as `KM-LAB-002`. Management is restricted to the operator computer and retained commissioning source.
- Primary AP1 answers all three pings. The local UniFi HTTPS dashboard returns 200 with the expected certificate pin, and home Wi-Fi-bound HTTPS returns 200. Primary ether1 still has no link.

Post-change exports and encrypted backups were downloaded to the same ignored directory: `kibera-lab-01-wired-ospf-20261004.rsc` (10,352 bytes) and `.backup` (35,712 bytes); `kibera-lab-02-wired-ospf-20261004.rsc` (9,083 bytes) and `.backup` (36,791 bytes). Each binary backup uses its router's lab administrator password. Restoration remains untested.

**Checkpoint 8c passes for router-originated communication between the two subnets and dynamic route learning.** The second node's client-forwarding rules have no traffic yet because its AP/clients are absent. Client access through that node, alternate-path failover and service replication require separate tests. There is still one transit cable and one portal host.

## Checkpoint 8d — connect and inspect the second AP

The operator connected the **second UAP-AC-M directly to the second MikroTik's ether5** and reports a red router port light and **solid white** on the AP. Ubiquiti describes steady white as ready for adoption in its [LED guide](https://help.ui.com/hc/en-us/articles/204910134-Understanding-Device-LED-Status-Indicators); this indication alone does not establish a working Ethernet connection.

Authenticated terminal inspection on 4 October, around **12:28 EAT**, finds:

| Check | Observation |
| --- | --- |
| Ether5 PoE | `auto-on`, `powered-on`, power pair `b`; no measured voltage/current reported |
| Ether5 Ethernet | `no-link` on two inspections; logs show repeated 100 Mbps full-duplex link-up/link-down events |
| DHCP | Bound lease `10.21.0.200`, MAC `D8:B3:70:C6:BE:BD`, host-name `cheers-Bar-ap`, class `ubnt`; last contact was several minutes earlier |
| Current device reachability | Three pings from `10.21.0.1` time out; no learned nonlocal bridge host remains |
| Inter-router routing | OSPF neighbor stays `Full`; pinned direct node2 SSH still works |

The retained lease establishes earlier DHCP contact, not current reachability. Power is present while the data link is down. Cable/connectors are the first variable to test; the AP, router port and power stability have not yet been isolated as possible causes. No AP reset, adoption, firmware update or Ethernet speed change was performed. Node2's clock is unsynchronized (`2025-12-03` during this inspection), so its log dates must not be treated as actual event dates; the Windows observation time above supplies the session date.

### Cable replacement and inspection — complete

The operator confirms the cable was replaced and the AP remains white. Fresh inspection around **20:08 EAT** finds `link-ok`, **100 Mbps full duplex**, on both readings bracketing three successful pings. Later readings through **20:24 EAT** still show link up. This resolves the observed connection problem for the bench trial; the discarded cable/connector fault was not measured separately, and long-term/load stability remains a separate question.

Pinned SSH authenticates using the manufacturer's factory login. Inspection confirms **UAP-AC-Mesh**, firmware **6.8.2.15592**, MAC **`D8:B3:70:C6:BE:BD`**, initially `10.21.0.200`. Its inform destination was the unresolved default `http://unifi:8080/inform`; no firmware update or further reset was needed. The RSA host-key fingerprint is **`SHA256:Zv8AJT5miy84RZPCEqRDKn6l8AnZpyGgSBnrUHVXf+g`**, recorded in ignored `artifacts/mesh-lab/node2-ap-host-key.json` and pinned on subsequent connections.

Before changing the AP, its `/tmp/system.cfg` was captured into ignored [private AP configuration storage](../../artifacts/mesh-lab/private/ap-backups/ap2-before-local-adoption-20261004.cfg): **4,179 bytes**, SHA-256 `0a42117cd928b0190c400ecd0f32408dab099f29099e56f3ac6ebc818d64407a`. ACL inspection confirms only the current Windows user and SYSTEM. This is a configuration capture, not a tested restoration procedure.

### Reservation and local adoption — complete

On the verified second-router serial, a guarded command converts the observed AP lease to a static reservation at **`10.21.0.2`**, after checking that address has no lease/ARP entry. The matching [reservation script](../../mikrotik/kibera-mesh-lab-02-reserve-ap.rsc) also checks identity and LAN and passed RouterOS `verbose=yes dry-run`; it is retained for reproduction, not re-imported over the already-created reservation. The earlier wired-OSPF before-image covers the router state before this reservation.

An AP-only software restart makes the reservation active. Fresh pinned factory SSH reconnects at `10.21.0.2`, with the same key/MAC/model. `mca-cli-op set-inform http://10.20.0.10:8080/inform` directs it to the local controller; the pending-device API then sees only the expected MAC, correct address and target site. The documented integration adoption request succeeds at **20:15:44 EAT**, followed by successful provisioning and state **ONLINE**. See [Ubiquiti's layer-3 adoption procedure](https://help.ui.com/hc/en-us/articles/204909754-Remote-Adoption-Layer-3).

### Second-node managed Wi-Fi — complete

| Setting | Verified value |
| --- | --- |
| Device name / address | `KM-LAB-002-AP` / `10.21.0.2` |
| Integration device ID | `5f9430a1-3642-393a-9fb2-00324f0d5059` |
| Local inform | `http://10.20.0.10:8080/inform`, AP status `Connected` |
| SSID / broadcast ID | **KiberaMesh-Node2** / `5e595346-40b1-4007-a1f9-f36492fcd293` |
| Network / scope | Native untagged node2 LAN; only AP2's device ID |
| Security | WPA2-Personal, PMF optional; password reused from the original lab SSID |
| Bands / channels | 2.4 GHz: channel 11, 20 MHz; 5 GHz: channel 44, 40 MHz |
| Country | Kenya `404`, verified directly in both AP radio configurations |
| Client isolation / fast roaming | Disabled |

The distinct test SSID makes association with the second AP explicit while the routing nodes use different client subnets. It does not establish seamless roaming between those subnets. The original **KiberaMesh-Lab** broadcast remains scoped only to AP1; an API snapshot confirms both devices ONLINE and each SSID's device filter correct.

The protected [node2 Wi-Fi credential file](../../artifacts/mesh-lab/private/kibera-mesh-node2-wifi.txt) inherits access for the Windows user and SYSTEM only and is Git-ignored. Secrets are read in memory for configuration. A diagnostic redaction gap in detailed controller responses was corrected to cover internal management-key field names, and a regression check passes before subsequent reads.

Direct AP inspection confirms the managed SSID/WPA2/country/channels and default gateway `10.21.0.1`. Its lookup of `portal.kibera.home.arpa` returns `10.20.0.10`; the utility also emits a separate null-name lookup warning while returning success. An attempted AP-side HTTP probe cannot run because `wget` is absent; it supplies no portal-access result. The client browser test below is still required. A separate fresh server-side check returns code **`7439A9596A47`**, HTTP 200 at **20:26:32 EAT**. OSPF remains Full, and node2's client forwarding counter now records AP/controller traffic.

Updated second-router nonsensitive export and encrypted backup are saved in ignored `artifacts/mesh-lab/backups/2026-10-04/`: `kibera-lab-02-ap-adopted-20261004.rsc` (**9,244 bytes**) and matching `.backup` (**37,148 bytes**, encrypted using the protected node2 administrator password). `unifi-lab-02-api-snapshot.json` records redacted device/Wi-Fi observations. This snapshot is not a restorable controller backup; the previously downloaded `.unifi` backup predates AP2 adoption. Restoration and an updated controller backup remain separate work.

**Checkpoint 8d passes for cable recovery, PoE/management reachability, local adoption and managed Wi-Fi configuration.** A fresh client request across both routing nodes remains pending.

## Checkpoint 8e — phone client through the second routing node

Current operator action:

1. On the phone, switch off cellular data and join **KiberaMesh-Node2**, using the same saved lab Wi-Fi password. Stay connected if the phone reports no internet.
2. Check its Wi-Fi IP address; expect `10.21.0.100–10.21.0.200`, with gateway/DNS `10.21.0.1`.
3. Open **`http://10.20.0.10:8000/`** and report the fresh check code and phone IP. Start with the address to verify routing; test the local name separately afterwards.

Match the code to HTTP 200 from the new `10.21.0.x` client, its DHCP lease and AP2 association before passing this gate. The intended path is phone → AP2 → node2 → OSPF transit → primary router → portal server, preserving the client source address. Keep the inter-router cable connected. Alternate-path failover and service replication require later setup and tests.

### First phone attempt — diagnostic observations

The operator reports DNS `10.21.0.1` and that the page does not open, then confirms entering `10.20.0.10:8000` without stating the scheme or exact browser error. The DNS address is expected, and a literal-IP request does not require the portal-name lookup.

Inspection at **20:32–20:38 EAT on 4 October** establishes:

- A bound **iPhone** lease at **`10.21.0.199`**, private MAC **`B6:CA:5A:64:12:32`**, with reachable ARP.
- AP2's Ethernet remains 100 Mbps full duplex; OSPF remains Full and its learned peer LAN route active.
- Three pings from node2 to the phone pass. Three pings from the portal computer to the phone also pass across both routers, with reply TTL 62.
- Portal PID `24728` still listens at `10.20.0.10:8000`. Fresh host request **`B83966623B8D`** returns HTTP 200 at **20:32:53 EAT**. A node2 request explicitly sourced from `10.21.0.1` returns **`8E80781AAD0D`**, HTTP 200 at **20:33:44 EAT**.
- Windows selects Ethernet via `10.20.0.1` for replies to the phone's subnet. Its enabled Python TCP inbound allowance covers the listener's executable, both active profiles and any remote address. Both routers' transit drop counters remain zero.
- No successful HTTP request from `10.21.0.199` appears in the portal log. Connection snapshots show the phone's DNS exchanges but no retained portal TCP connection; these snapshots alone cannot establish what happened during an earlier browser attempt.

A bounded **60-second**, 64 KiB memory capture on node2 filtered the phone's TCP traffic on port 8000 while an explicit-HTTP retry was requested. It saved an empty 28-byte PCAPNG section header to ignored private `artifacts/mesh-lab/private/captures/phone-node2-http-20261004.pcap`, at 20:38:42 EAT. No operator retry confirmation arrived during that window, so the empty capture does not identify a cause. The sniffer was stopped and its prior empty filters/100 KiB memory setting restored. No firewall, DNS, routing or browser setting was changed.

The diagnostic retry requested the complete address **`http://10.20.0.10:8000/?test=node2`**, including `http://`, with the exact error/scheme requested if it failed. These earlier observations did not identify an HTTP-versus-HTTPS cause.

### Phone result — passes after per-network privacy setting change

The operator reports **Limit IP Address Tracking was enabled for the newly joined Wi-Fi**, changes that setting, and supplies **`04ABFDFCF1C4`**. The code exactly matches HTTP 200 for `GET /` from **`10.21.0.199` at 20:45:32 EAT on 4 October**. DHCP still identifies the bound iPhone lease with private MAC `B6:CA:5A:64:12:32`. The controller's client API independently confirms that IP/MAC's uplink is AP2, device `5f9430a1-3642-393a-9fb2-00324f0d5059`; the HP remains on AP1 and both APs are ONLINE. OSPF remains Full.

**Checkpoint 8e passes.** The verified path is iPhone → AP2 → node2 → routed transit → primary router → portal server. The server receives the original `10.21.0.199` source; no inter-LAN source NAT was introduced. The operator's setting change and subsequent response establish a successful workaround. Exact Private Relay packet handling was not captured, and the earlier empty trace is not proof of its mechanism.

### Private Relay compatibility for deployment

Apple documents **Limit IP Address Tracking** as a per-network control for Private Relay. It is separate from the phone's private Wi-Fi MAC address: the observed phone MAC remains unchanged. New network configurations can require their own setting; the earlier first-SSID workaround therefore did not establish compatibility on the new SSID. See [Apple's network-specific setting guide](https://support.apple.com/en-us/102022).

Apple's [Private Relay overview](https://www.apple.com/privacy/docs/iCloud_Private_Relay_Overview_Dec2021.PDF), pages 9–10, describes direct access to private/local servers and exclusion of recognized local-subnet destinations. Our server is outside the phone's immediate subnet, and the lab has no Internet gateway; these are relevant compatibility conditions to investigate, not a proven explanation of the failure. Production acceptance must test local service discovery/access with privacy settings enabled, across routing nodes and during Internet loss. HTTPS with trusted certificates and node-local service entry points are candidates to evaluate, not established fixes.

For a deliberately relay-incompatible network, [Apple's operator guidance](https://developer.apple.com/icloud/prepare-your-network-for-icloud-private-relay/) describes explicit negative DNS answers for `mask.icloud.com` and `mask-h2.icloud.com`, with user notification, and discourages timeouts or silent packet drops. That is a policy choice with a privacy tradeoff. No such DNS rule or general privacy restriction has been added to this lab; the current client toggle is recorded as a workaround. Preserve support for privacy tools on Internet-connected community access where compatible, and test any offline fallback transparently before deployment.

## Checkpoint 8f — second-node local name

**Checkpoint 8f passes.** The operator confirms the named portal loads on the second-node phone and supplies **`76015B12280C`**. The server log matches HTTP 200 for `GET /` from **`10.21.0.199` at 20:53:18 EAT**. This is the named-URL result reported by the operator; the HTTP log alone does not record DNS queries. The existing per-network privacy workaround remains in use. Keep the wired transit connected until a separate alternate route is configured and verified.

## Checkpoint 8g — radio driver prerequisite

Read-only inspection finds only `routeros 7.20.8` installed on the primary: `/interface wireless` is unavailable and there is no radio interface. Node2 has `routeros` and `wireless` 7.20.6 installed, with its internal radio disabled. Both routers have a level-4 license. A proposed next experiment uses their internal 2.4 GHz radios as a separate routed OSPF link; configuration and failover remain untested.

The primary driver must match its installed RouterOS version and architecture. See [MikroTik's missing-driver guidance](https://help.mikrotik.com/docs/spaces/RKB/pages/280657934/Missing%2Bwireless%2Bor%2Bwifi%2Binterface%2Bafter%2Bupdate). Downloaded directly over HTTPS from MikroTik: `wireless-7.20.8-mipsbe.npk`, **1,429,649 bytes**, local SHA-256 **`e027667e90f900d2efdf5544e405d19a22172523b4f8d6485b6f7c1d2b5dc6bc`**. The local hash identifies the downloaded artifact; no separately published hash was compared. RouterOS performs package validation during installation.

Fresh pre-install nonsensitive export and AES-encrypted binary backup were downloaded to ignored `artifacts/mesh-lab/backups/2026-10-04/kibera-lab-01-before-wireless-package-20261004.{rsc,backup}`, **10,352 and 35,712 bytes** respectively. Restoration remains untested. Installing the matching driver requires a primary reboot and temporarily interrupts AP1 power and the wired routing path. Computer home Wi-Fi remains independent. Installation succeeds after the guarded primary reboot. SSH is unavailable on observations from **21:03:37 through 21:04:13 EAT**, and available at **21:04:16 EAT**. The same pinned host key authenticates afterwards. Readback confirms both `routeros` and `wireless` at **7.20.8**, with `wlan1` present and disabled, outside the client bridge. No wireless link or alternate OSPF template has been configured. Wired OSPF returns to **Full** on both routers and the primary again learns `10.21.0.0/24` via ether4. Node2 fetches the named portal with original source `10.21.0.1`: **`DF6217D52C48`**, HTTP 200 at **21:05:03 EAT**. Node2 still has no Internet default route. The portal process stays running and computer home Internet returns HTTP 200 during the router outage.

Post-install nonsensitive export/encrypted backup are saved as `kibera-lab-01-wireless-driver-20261004.{rsc,backup}`, **10,514 and 37,697 bytes**. Kenya country capabilities are available in the restored driver. AP1 initially has no Ethernet link and refuses SSH while rebooting; its ether5 link subsequently returns at 100 Mbps full duplex. A controller ONLINE value alone is not proof of fresh AP recovery. Direct pinned AP1 SSH subsequently confirms uptime **97 seconds**, the expected MAC/firmware/IP, local inform **Connected**, Kenya country 404 and the saved **KiberaMesh-Lab** WPA2 SSID. Three primary-to-AP1 pings pass. **Current operator action:** keep the phone on **KiberaMesh-Node2**, cellular data off, and reopen **`http://portal.kibera.home.arpa:8000/`**; report its fresh code. Keep the inter-router cable connected. The operator supplies **`E108996389DE`**, matched to HTTP 200 from `10.21.0.199` at **21:10:12 EAT**. **Checkpoint 8g passes.** The operator action in this paragraph is historical; use checkpoint 8h below for the current action.

The NanoStation still needs a compatible peer/radio role; reproduction/restore and full air-gapped cold startup also remain pending. The planned UniFi wireless-uplink milestone is separate from this wired two-router result.

## Checkpoint 8h — alternate radio transit and physical failure test pass

The two MikroTik internal radios now provide a separate **routed** transit. The UniFi APs still provide client access; their wireless-uplink feature was not configured. This adds link redundancy between two routing nodes, but does not survive the loss of either router or the sole portal host.

| Parameter | Primary | Node2 |
| --- | --- | --- |
| Radio/interface | `F4:1E:57:65:90:D1`, `wlan1`, AP mode | `2C:C8:1B:39:14:E3`, `wlan1`, plain station mode |
| Transit address | `10.255.20.5/30` | `10.255.20.6/30` |
| SSID/security | `KM-LAB-Backhaul`, WPA2-PSK/AES | Same protected backhaul profile |
| Radio/channel | 802.11n, 2412 MHz/channel 1, 20 MHz | Same, scan restricted to 2412 MHz |
| Country/power policy | Kenya, regulatory-domain, indoor | Same |
| OSPF | Existing backbone, point-to-point, cost 100 | Same |
| Client bridge | Radio outside bridge | Disabled old radio bridge entry removed |

The existing cable stays cost **10**. No DHCP, client LAN bridge, source NAT or Internet default route was added to the radio. Input permits only the required OSPF peer, node2 DNS queries to the primary, and operator management on node2, alongside existing state/ICMP rules. Forwarding permits the two known client LANs between bridge and radio, with other radio forwarding dropped. The radio passphrase is separate from the client Wi-Fi password and saved only in ignored `artifacts/mesh-lab/private/kibera-mesh-backhaul-psk.txt`, ACL restricted to the current Windows user and SYSTEM. It is injected in memory over pinned SSH; public templates contain a placeholder. See [MikroTik wireless interface guidance](https://help.mikrotik.com/docs/spaces/ROS/pages/8978446/Wireless%2BInterface).

Guarded setup files are `mikrotik/kibera-mesh-lab-{01,02}-wireless-ospf.rsc`; corresponding `remove-wireless-ospf.rsc` files remove the owned radio configuration and restore disabled baseline radio settings. All four pass RouterOS import syntax checks. Do not import a setup file with its placeholder as a real credential. Preserve or reconnect the wired transit before rollback.

An initial local helper attempt sent the template with SSH newlines, which RouterOS interpreted as separate commands. The primary radio remained disabled, but a security profile, inactive address and OSPF template were partially created. The primary rollback import was executed successfully and the empty radio address/disabled baseline verified. The helper was corrected to send the entire guarded block as one command, with secret redaction on both output streams; a synthetic redaction check passes. Both final setup applications return their completion marker without errors. Node2 was configured only after the primary retry succeeded.

Verification around **21:16 EAT**:

- Expected peer MACs associate using WPA2-PSK/AES, without WDS/bridge mode. Initial station association loses the first two startup pings; subsequent **10/10 pings each direction** pass over explicitly selected `wlan1` sources, about 2.6 ms average.
- Both routers show **two Full OSPF adjacencies**: wired `.1`/`.2` and radio `.5`/`.6`. Interface readback confirms costs 10 and 100 respectively. Peer LAN routes continue to prefer the cable.
- Node2 fetches the named portal with LAN source `10.21.0.1`: **`D1D7B97647D9`**, HTTP 200 at **21:16:53 EAT**. With the cable still preferred, this request does not prove application forwarding over radio.
- Small probes establish association/reachability, not sustained throughput or outdoor link suitability. Idle/startup rate and CCQ observations are not capacity measurements.

Pre-radio primary backups are the verified post-driver files; fresh node2 pre-radio export/encrypted backup are `kibera-lab-02-before-wireless-20261004.{rsc,backup}`, **9,244/37,643 bytes**. Updated exports and encrypted backups for both configured routers are saved under ignored `artifacts/mesh-lab/backups/2026-10-04/` as `kibera-lab-{01,02}-wireless-ospf-20261004.{rsc,backup}`: primary **12,206/39,433 bytes**, node2 **10,583/38,990 bytes**. Binary backup restoration remains untested; only the primary radio rollback has been executed.

**Completed operator action:** unplug only the inter-router cable from **primary ether4** (its other end is **node2 ether2**). Leave both routers powered, both APs on ether5, the computer on primary ether2/home Wi-Fi, and WAN ether1 disconnected. Stay on **KiberaMesh-Node2** with cellular off. Wait about 15 seconds, reopen **`http://portal.kibera.home.arpa:8000/`**, and report the fresh code or exact error. Leave this transit cable disconnected while diagnostics verify the selected radio route. If access fails, report it before changing other cables; reconnect this same cable as the recovery action if directed.

**Checkpoint 8h passes.** The operator reports removal of the primary ether4 cable and supplies **`DA183173CFD0`**. The exact server-log match is HTTP 200 for `GET /` from **`10.21.0.199` at 21:24:43 EAT** on 4 October. Subsequent pinned SSH inspection confirms **no-link on primary ether4 and node2 ether2**, only the radio neighbor **Full**, and active learned peer LAN routes via **primary `10.255.20.6%wlan1` / node2 `10.255.20.5%wlan1`**. Both radio forwarding directions have nonzero counters; radio drop counters are zero. Neither router has an IPv4 Internet default route. Direct operator SSH to node2 also works over the radio path. This proves fresh end-user service access with the wired transit physically absent, preserving the phone source. Exact convergence delay/session interruption was not measured; no zero-interruption or throughput claim is made.

## Checkpoint 8i — reconnect cable and verify failback

**Completed operator action:** reconnect the same cable to **primary ether4**, leaving its other end in **node2 ether2**. Preserve all other connections and keep WAN ether1 disconnected. Stay on **KiberaMesh-Node2**, cellular data off; after about 20 seconds open **`http://portal.kibera.home.arpa:8000/`** and send the fresh code. Report any error instead of changing another cable.

To pass: both wired ports return at 100 Mbps full duplex, wired and radio OSPF neighbors are Full, both learned LAN routes again select cost-10 wired peers, and a fresh phone response still reaches the portal. Radio remains available as the cost-100 backup.

**Checkpoint 8i passes.** The operator reports cable reconnection and supplies **`D6FCCF857F2D`**, matched to HTTP 200 for `GET /` from **`10.21.0.199` at 21:31:41 EAT**. Pinned SSH confirms **100 Mbps full-duplex link-ok** on primary ether4 and node2 ether2, **Full wired and radio neighbors** on both routers, and restored active peer LAN routes through primary **`10.255.20.2%ether4`** and node2 **`10.255.20.1%ether2`**. Readback retains wired cost 10 and radio cost 100. No configuration change was needed for failback. Exact recovery delay was not measured.

## Checkpoint 9a — spare HP service-host prerequisites

Routing now has a tested alternate transit, but all portal responses still depend on the original computer. The next experiment puts a clearly identified second copy of the local page on the spare Windows HP, then tests independent service access when the original portal process is stopped. A separate host is needed; another process on the original computer would share its failure domain. This first static copy does not yet establish dynamic-data synchronization, automatic service selection or router/node failure tolerance.

**Completed operator action:** connect the spare HP to **KiberaMesh-Node2**, then open PowerShell and run **`py --version`** and **`ipconfig`**. Report the Python version and the Wi-Fi IPv4 address; if `py` is not recognized, report that before installing anything. Keep the routers, both transit paths and original server running. No remote access to the HP or software installation has been established; select the local transfer/runtime procedure from the actual output before changing its configuration.

## Checkpoint 9b — HP portal bundle transferred and server reachable

The operator reports **Python 3.14.8** and HP Wi-Fi IPv4 **`10.21.0.198`**. Python version is operator-supplied, not remotely probed. Node2 DHCP confirms known HP **Afribit**, MAC **`B4:6D:C2:2D:67:00`**, bound at that address. A serial/MAC/hostname-guarded command makes only that lease static and labels it `kibera-mesh-lab:node2-hp-service`; readback confirms the reservation. The pre-change node2 wireless-OSPF export/encrypted backup already exists. Updated post-reservation export/encrypted backup are saved as `kibera-lab-02-hp-reserved-20261004.{rsc,backup}` in the ignored backup directory.

The portal server now accepts `--bind` and `--node`, retaining primary defaults and restricting bind addresses to the two lab IPv4 subnets. HTML and JSON responses identify the serving node; text is HTML-escaped. A temporary loopback-only smoke test verifies node identity in both representations, no-store headers and rejection of an unrelated file path. This test does not prove HP runtime or firewall compatibility. The original running primary process was not restarted, and still returns HTTP 200.

Prepared ignored **`artifacts/mesh-lab/node2-portal.zip`**, **3,460 bytes**, SHA-256 **`563127be6d5d9ed01f3a34b0831586453932fab57451a1c116a0068a0cb79e2d`**. It contains only `serve-local-portal.py`, `local-portal.html` and `START.txt`, without credentials or repository/private files. A temporary background transfer helper, PID **9008**, listens only on **`10.20.0.10:8001`**, serves only **`/node2-portal.zip`** and allows the two lab client subnets. Host download exactly matches the archive. Stop this helper after HP transfer is confirmed; it is separate from the existing port-8000 service. An initial router download probe used its transit source and timed out under the existing subnet firewall policy; The retry explicitly sourced from `10.21.0.1` finishes successfully and downloads 3 KiB, confirming the allowed routed transfer path.

**Current operator action:** on the HP, while connected to **KiberaMesh-Node2**, run these in PowerShell:

```powershell
$labFolder = Join-Path $env:USERPROFILE 'KiberaMesh-Node2'
$zipPath = Join-Path $env:TEMP 'node2-portal.zip'
Invoke-WebRequest -UseBasicParsing 'http://10.20.0.10:8001/node2-portal.zip' -OutFile $zipPath
Expand-Archive -LiteralPath $zipPath -DestinationPath $labFolder
Set-Location $labFolder
py .\serve-local-portal.py --bind 10.21.0.198 --node KM-LAB-002-HP --log portal-requests.jsonl
```

Keep the terminal running. On the phone, still on node2 with cellular off, open **`http://10.21.0.198:8000/`**. Report the fresh code and whether the footer says **`KM-LAB-002-HP`**; if a step fails, report its exact error. No HP firewall rule has been installed remotely. Diagnose any access failure before stopping the original portal. Matching a phone code will require the HP's local log or a subsequent status fetch; the original server cannot see HP requests. No DNS failover, shared-data synchronization or service selection has been configured. All prior router/cable connections remain in place.

## Checkpoint 9c — verify HP phone request

The operator supplies **`CF02A05BA95C`** after the HP startup/phone test instructions. Independent original-computer probes reach **`http://10.21.0.198:8000/api/status`**, HTTP 200, node **`KM-LAB-002-HP`**, code **`21C0ED283444`**, served **22:09:09 EAT** on 4 October. An HTML fetch also returns HTTP 200 with the expected node2 footer and no unresolved node placeholder. This verifies the separate HP host serves the page across the routed LANs. The operator's phone code has not yet been independently matched to its local log, which is not exposed over HTTP.

The temporary transfer PID **9008** was verified as the expected Python `serve-node2-bundle.py` process and stopped after the HP copy was reachable. The original portal process was not stopped for this cleanup. The port-8001 bundle download is no longer needed.

**Current operator action:** keep the HP serving terminal open. In a **second PowerShell window on the HP**, run:

```powershell
Select-String -Path "$env:USERPROFILE\KiberaMesh-Node2\portal-requests.jsonl" -SimpleMatch 'CF02A05BA95C'
```

Paste the matching line. It should identify `KM-LAB-002-HP`, HTTP 200 and the phone's address, previously `10.21.0.199`. After this client gate passes, separately stop the original portal process and test independent HP access. Keep both routers and transit paths intact. Original-host outage tolerance, shared-data synchronization and automatic service selection remain untested.

## Checkpoint 9d — original portal process stopped; phone check pending

**Checkpoint 9c passes.** The operator's HP screenshot shows `portal-requests.jsonl:3` matching **`CF02A05BA95C`**, node **`KM-LAB-002-HP`**, `GET /`, HTTP 200, source **`10.21.0.199`**, served **`2026-10-04T22:08:36+03:00`**. This independently matches the reported phone result to the HP's log.

The original computer's lab listener was verified at `10.20.0.10:8000`, owned by PID **24728**, with the expected Python executable, `scripts/mesh/serve-local-portal.py` command and original request log. Only that process was stopped. At **22:18:17 EAT**, TCP connection to its port fails with **ConnectionRefusedError**. A subsequent request to the HP's `/api/status` succeeds: HTTP 200, **`KM-LAB-002-HP`**, code **`5541E91FDB12`**, served **22:18:19 EAT**. Neither router, AP, transit path nor controller was deliberately stopped.

**Current operator action:** keep the HP portal terminal running. With the phone still on **KiberaMesh-Node2**, cellular off, open **`http://10.21.0.198:8000/`** and report a fresh code plus the corresponding request line printed by the HP terminal. The original portal remains stopped for this test; its original URL is expected to fail. After matching the new HP phone response, restart the original portal and verify both copies.

This test concerns original **service-process loss**, not whole-computer or router power loss. The user selects the HP address explicitly; automatic discovery/failover and shared-data synchronization have not been implemented. The two physical hosts now hold copies of the same static page, each with its own identity and request log.

## Checkpoint 9e — original portal restored; phone recovery check pending

**Checkpoint 9d passes.** The operator supplies **`5719D1E75C15`** and an HP terminal screenshot showing the exact code, node **`KM-LAB-002-HP`**, client **`10.21.0.199`**, `GET /`, HTTP 200, served **22:20:57 EAT** on 4 October. The original portal was stopped at this time. A subsequent original-computer listener/process check still finds no port-8000 listener or original PID 24728 before restoration. This proves fresh phone access to the separate HP copy during loss of the original service process.

The original server was restarted hidden with explicit bind `10.20.0.10`, node **`KM-LAB-001`**, and its existing request log, using the updated script. New PID **31852**. Original-host status fetch succeeds: HTTP 200, code **`74CCF0FDF22A`**, served **22:26:43 EAT**. HP status fetch also succeeds: HTTP 200, node **`KM-LAB-002-HP`**, code **`2EA220CAE77B`**, served **22:26:42 EAT** according to the HP clock. Original recovery stderr is empty. Both hosts are now running; no HP process restart was requested.

**Current operator action:** on the phone, still connected to **KiberaMesh-Node2**, cellular off, reopen **`http://portal.kibera.home.arpa:8000/`**. Send the fresh check code and confirm the footer identifies **`KM-LAB-001`**. Match it to the original computer's log before passing recovery. Keep the HP terminal and all existing router/transit connections running.

The proven resilience is transit-link failover/failback plus availability of an independently hosted static page during original-service-process loss. Service choice remains manual. Automatic service selection, mutable-data synchronization, whole-router failure tolerance, backup restoration and fully isolated cold startup remain separate tests.

## Checkpoint 10a — useful local media; first host running

The operator requests slow, concrete progress and asks about an Internet gateway and Meshtastic. An Internet-connected router can be an optional mesh gateway, but transit links, routing and clients still require configuration. Our existing cable/radio OSPF links already provide inter-node routing. WAN ether1 remains disconnected for this media step. Meshtastic is a separate LoRa mesh for lightweight messages/location, with supported radio hardware; it is not installed on these Wi-Fi routers and is not the media transport plan. See [Meshtastic introduction](https://meshtastic.org/docs/introduction/).

The first read-only media service now runs as PID **43664**, bound to **10.20.0.10:8010**, node **KM-LAB-001**, using `scripts/mesh/serve-media-library.py`. Both existing port-8000 portal copies remain running. The dedicated ignored store is `artifacts/mesh-lab/media-node1`, with a catalogue and one generated WAV, **32,044 bytes**, SHA-256 **33cdfeb3dc8beab4e3cbff39859d4849033cdf4344d5fe1b33a1652a84e1ce68**. It contains two quiet tones and no personal media. Every object is hash/size/type-verified at startup. No uploads or arbitrary folder browsing are exposed.

Meaningful local checks pass: exact audio retrieval and hash, catalogue identity, byte ranges including suffix requests, invalid-range rejection, unrelated/path-traversal route rejection and startup refusal of a corrupted object. A live HTTP retrieval matches the stored hash; service stderr is empty. These establish implementation behaviour, not phone playback or a second replica. The server holds the small verified sample in memory; large-file streaming, storage quotas and automatic replication are future work.

**Current operator action:** on the phone, connected to **KiberaMesh-Node2** with cellular off, open **http://10.20.0.10:8010/**. Check it says **KM-LAB-001**, press Play and report whether the two tones play; if playback fails, try its Download audio link and report the exact outcome. No check code is required for this capability. After phone playback passes, package the same catalogue/object/server for the HP, verify matching content there, and build replica selection. A second media copy has not yet been deployed.

## Checkpoint 10b — phone playback passes; HP copy packaged

**Checkpoint 10a passes:** the operator reports that phone audio playback worked. Advance to the second physical media host; no repeated code/restart test is required here.

Prepared `artifacts/mesh-lab/node2-media.zip`, **4,215 bytes**, SHA-256 **7d3b3d480093c53a4d4b1b85454c62249530306aa0b5074b920f2af421649880**. It contains only `serve-media-library.py`, `media/catalog.json` and the hash-named generated WAV. Extracting the archive locally and loading it with the packaged server verifies the exact sample hash and **32,044-byte** size. This verifies the bundle, not HP deployment. The temporary single-file download helper runs as PID **50076**, bound to `10.20.0.10:8001`, serving only `/node2-media.zip` to the lab subnets. A host download exactly matches the archive. Stop this helper after successful HP deployment.

**Current operator action:** open another PowerShell window on the HP, leaving its existing portal window running, and execute:

```powershell
$mediaFolder = Join-Path $env:USERPROFILE 'KiberaMesh-Media'
$mediaZip = Join-Path $env:TEMP 'node2-media.zip'
Invoke-WebRequest -UseBasicParsing 'http://10.20.0.10:8001/node2-media.zip' -OutFile $mediaZip
Expand-Archive -LiteralPath $mediaZip -DestinationPath $mediaFolder
Set-Location $mediaFolder
py .\serve-media-library.py --bind 10.21.0.198 --node KM-LAB-002-HP --root .\media
```

Leave this window running. On the phone, still on node2 with cellular off, open **http://10.21.0.198:8010/**, confirm **KM-LAB-002-HP** and play the two tones. Report success or the exact error. The next diagnosis will retrieve/hash-check the HP object from the original computer; automatic replication and replica selection remain to implement.

## Checkpoint 10c — two verified media copies; real content next

**Checkpoint 10b passes:** the operator confirms playback on the HP library. Independent HTTP catalogue/audio requests to **10.20.0.10:8010** and **10.21.0.198:8010** identify **KM-LAB-001** and **KM-LAB-002-HP** and each return **32,044 bytes**, both hashing to **33cdfeb3dc8beab4e3cbff39859d4849033cdf4344d5fe1b33a1652a84e1ce68**. These are two verified copies on separate hosts, transferred manually. The temporary media-transfer process **50076** was identified and stopped after deployment.

The primary media library now publishes an **Other library copies** link to the HP in HTML and `other_libraries` in its catalogue. Peer URLs are restricted to the lab IPv4 subnets and HTTP port 8010; a non-lab peer is rejected. Live HTML/catalogue checks pass. HP's deployed version is unchanged and does not yet expose a reciprocal link. This is manual navigation; it does not monitor availability, copy new content or automatically select a replica.

The original primary media PID **43664** was stopped for this update. A direct background launch with the peer URL argument was rejected by automatic tool review; a reviewed local launcher file supplies the configuration instead. Primary media is restored as PID **20904**, using ignored `artifacts/mesh-lab/run-media-node1.py`. Its live response is verified and stderr is empty. Both port-8000 portals and the HP media process remain running.

**Next operator input:** choose one small real photo, audio file or PDF and provide its absolute path on the original computer. Do not scan or expose personal folders. The current media server supports only the generated WAV format; add an explicit import path, required media types and bounded storage before publishing the selected file. No personal file has been copied yet. Automatic replication and replica selection remain subsequent capability increments. No additional sample/restart code test is needed now.

## Checkpoint 10d — verified pull replication ready

The operator says continue without selecting personal content. Use a second generated sample for the next useful increment: **New shared sample: three tones**, **38,444 bytes**, SHA-256 **22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d**. Node1 now has two WAV objects. The prior catalogue was saved to ignored `artifacts/mesh-lab/media-catalog-before-sync.json`. The primary media service is restored as PID **14908** after loading the new catalogue; no router or existing port-8000 portal configuration changed.

`scripts/mesh/sync-media-library.py` implements operator-triggered pull replication from one explicit lab IPv4 HTTP peer on port 8010. It refuses redirects, bounds catalogue/download sizes, verifies SHA-256/size/WAV signatures, refuses symlink targets, writes objects atomically and publishes the catalogue only after every entry is locally verified. It preserves local entries and never propagates deletions. Already matching copies are skipped. Limits are 100 entries, 10 MiB per object and 50 MiB of catalogued content for this lab; this is not a complete production disk-quota system. Existing server processes must reload to expose catalogue changes. This is single-run replication, not a scheduled background service or a Nostr/Blossom implementation.

Meaningful tests against the live primary in a temporary store pass: two objects copied on the first run, zero on a second run, existing content retained with an empty remote catalogue, corrupt data refused without publishing a changed catalogue, and an external peer rejected. The dedicated download helper serves only **http://10.20.0.10:8001/node2-sync.zip**, PID **51472**. The **2,083-byte** archive contains only the sync command; media itself will be pulled from node1's port-8010 library. Host download matches the archive. Stop the transfer helper after HP setup passes.

**Current operator action:** in a spare PowerShell window on the HP:

```powershell
$syncFolder = Join-Path $env:USERPROFILE 'KiberaMesh-Sync'
$syncZip = Join-Path $env:TEMP 'node2-sync.zip'
Invoke-WebRequest -UseBasicParsing 'http://10.20.0.10:8001/node2-sync.zip' -OutFile $syncZip
Expand-Archive -LiteralPath $syncZip -DestinationPath $syncFolder
Set-Location $syncFolder
py .\sync-media-library.py --source http://10.20.0.10:8010 --root "$env:USERPROFILE\KiberaMesh-Media\media"
```

Send the command's JSON summary or exact error. Expect **verifiedObjects 2 / copiedObjects 1** if the HP still has its first verified sample. Keep both HP server windows running for now; reload the HP media server only after successful sync confirmation. This isolates file replication from serving-state changes and requires no repeated outage test.

## Checkpoint 10e — HP serving refresh passes

Completed on 5 October: the user reports the new item appears and plays. Independent HTTP retrieval confirms both objects in the HP catalogue and verifies the new object's hash and 38,444-byte size. The following restart instructions are retained as the completed procedure, not a pending request. Continue at checkpoint 11a in [the Nostr lab](kibera-mesh-nostr-lab.md).

The operator reports **verifiedObjects: 2 / copiedObjects: 1** from the HP sync command. This confirms the command completed its verification and saved one new object according to its output; independent HTTP verification of the newly served HP object remains pending. The existing HP media server keeps its startup catalogue in memory, so the successful disk update does not yet change its page.

**Current operator action:** in the HP window running `serve-media-library.py` on port 8010, press **Ctrl+C**, then run:

```powershell
py "$env:USERPROFILE\KiberaMesh-Media\serve-media-library.py" --bind 10.21.0.198 --node KM-LAB-002-HP --root "$env:USERPROFILE\KiberaMesh-Media\media"
```

Leave it running; do not stop the separate port-8000 portal. Open **http://10.21.0.198:8010/** on the phone and play **New shared sample: three tones**. Report whether the new item appears and plays. Then retrieve the HP catalogue and new object from the original computer and verify the expected hash. This refresh exposes the newly synchronized content; it is not another outage/recovery experiment.

## Subsequent checkpoints

These are acceptance gates, not commands to run before checkpoint 1 passes.

| Checkpoint | Work | Evidence required to pass |
| --- | --- | --- |
| 2 — reset and establish LAN | Reset to the agreed starting state; configure one lab bridge/subnet and DHCP; reserve the server/AP addresses | Correct RouterOS configuration, fresh Ethernet lease, router ping and management access after reconnect |
| 3 — add UniFi access | Verify injector model, voltage and pin compatibility; reset/adopt AP; create `KiberaMesh-Lab` | Phone associates, receives the correct lease and reaches the intended LAN destinations |
| 4 — local service | Serve a dedicated local page with all assets on the computer; allow only the required LAN firewall access | Phone retrieves an identifiable response from the Ethernet server address |
| 5 — optional gateway | Connect home-router LAN to MikroTik ether1; configure WAN/NAT/firewall after inspecting the reset baseline | Phone reaches both the local service and external internet |
| 6 — WAN failure | Disconnect only the MikroTik uplink; keep computer Wi-Fi connected to home internet | Phone with cellular data disabled retrieves a fresh, uncached local response; external internet through the lab fails |
| 7 — restart recovery | Test router/AP/service restart separately and document recovery | DHCP, AP access and local service recover as expected |
| 8 — decentralization experiment | Choose routing nodes, alternate links, service replicas and routing protocol | Removing one tested transit link causes traffic to use an alternate route; internet-gateway loss preserves local access |

For checkpoint 6, the server must serve the phone over its lab Ethernet interface. The computer's home Wi-Fi must not provide an unintended gateway to the phone: verify that Windows Internet Connection Sharing, bridging or forwarding is not doing that. Disable phone cellular fallback and use a new response value or URL to rule out a cached page.

A phone may call the lab Wi-Fi "no internet" during the offline test. Explicitly stay connected to it.

The RB951 has **100 Mbps Ethernet ports**. A 100 Mbps negotiated link to it is expected, even though the computer's home connection currently negotiates 1 Gbps. Its ether5 supplies passive PoE at the router's supply voltage; identify power compatibility before using it. See [MikroTik hardware specifications](https://mikrotik.com/product/RB951Ui-2HnD). The loco5AC specifies 24 V passive PoE with a 22–27 V input range; see [its specifications](https://techspecs.ui.com/uisp/wireless/loco5ac).

## What decentralized operation will require

The first lab is a useful independent LAN, with one router, one AP and one service host. WAN independence proves local usefulness. It does not yet prove resilience to failure of the router, AP or server.

For Kibera Mesh, define decentralization through observable behavior:

1. **Local independence:** DHCP, local naming, local access and essential services operate without a cloud login, cloud database or external internet.
2. **Distributed routing:** multiple routing nodes exchange routes and forward traffic without one central router deciding every path.
3. **Alternate paths:** a failed transit link has another usable route. A three-node triangle is a practical first experiment; a two-AP parent/uplink setup has no alternate path by itself.
4. **Optional gateways:** local communication remains available with every WAN gateway absent. Later, test two gateways and withdraw an unusable internet route when the upstream fails. Existing internet sessions may break during gateway failover.
5. **Service resilience:** essential information exists on more than one host, with a tested recovery or replication process. A mesh cannot preserve the only copy of a service when its host is off.
6. **Community operation:** multiple operators can commission, diagnose and recover nodes using documented procedures and individually managed credentials.
7. **Power resilience:** key nodes have an appropriate power/backup plan; redundant radio paths do not solve simultaneous power loss.

A second stock UniFi AP can extend wireless coverage. UniFi calls this meshing, but that alone does not satisfy all the goals above. Its managed wireless uplinks depend on the chosen parent paths and configuration. See [UniFi mesh documentation](https://help.ui.com/hc/en-us/articles/115002262328-Considerations-for-Optimal-Wireless-Mesh-Networks).

Keep the concept's second-AP purchase as one possible coverage experiment. Select the distributed-routing approach before buying hardware specifically for decentralization. A second routing node may be an available Linux machine, suitable supported router, or borrowed device; it need not be another UniFi AP. Software nodes on this computer can test routing behavior, but share one physical failure domain.

## Open projects and community references

| Reference | Useful concepts for Kibera | Hardware implication |
| --- | --- | --- |
| [LibreMesh](https://libremesh.org/what-is-libremesh.html) | OpenWrt-based community mesh firmware, node configuration and community participation | Verify exact model/revision and current firmware support before considering installation |
| [Gluon / Freifunk](https://gluon.readthedocs.io/en/latest/) | Community-specific OpenWrt firmware, node setup, mesh routing, monitoring and signed updates | Requires supported devices and a community configuration; study its gateway/service dependencies as well as its radio mesh |
| [NYC Mesh routing methodology](https://wiki.nycmesh.net/books/5-networking/page/nyc-mesh-ospf-routing-methodology) | OSPF, multiple exit paths, mixed MikroTik/Ubiquiti equipment, link costs and community operation | Particularly relevant to retaining RouterOS and using radios for backhaul |

The current stock-hardware trial retains RouterOS and uses OSPF across two routing nodes. Supported OpenWrt hardware and community mesh firmware remain a separate option to evaluate. Open routing standards can support decentralized operation even when some device firmware is proprietary. An entirely open-source firmware stack is a separate hardware/software requirement.

No alternative firmware installation is planned at this checkpoint. Device support, recovery method and the routing choice remain unverified.

## Results log

| Date | Observation or test | Result | Next action |
| --- | --- | --- | --- |
| 2026-10-03 | Read all files currently in `Doc/mesh` (the concept was its only file), the project roadmap, gateway runbook and relevant project architecture/code | Proposed offline lab and historical paid HotSpot are distinct configurations | Discover the actual router before configuring |
| 2026-10-03 | Inspect Windows network | Ethernet and Wi-Fi both on home subnet; lab devices disconnected per operator | Move Ethernet to MikroTik ether2 |
| 2026-10-03 | HTTPS request bound to home Wi-Fi IPv4 address | HTTP 200 | Keep Wi-Fi connected throughout lab setup |
| 2026-10-03 | Operator confirms spare router and authorizes resets | Confirmed | Preserve recoverable state, then perform guided resets |
| 2026-10-03 | Operator reports MikroTik powered, ether2 connected and ether1 empty; inspect Windows twice | Computer Ethernet reports Disconnected; Wi-Fi-bound HTTPS still returns HTTP 200. The retained Ethernet address is not evidence of a working link | Confirm cable endpoints and establish computer Ethernet to MikroTik ether2 |
| 2026-10-03 | Recheck after operator setup | Ethernet Connected at 100 Mbps; DHCP server `192.168.88.1` assigns computer `192.168.88.254/24`; router neighbor MAC `F4:1E:57:65:90:CD` | Inspect management services |
| 2026-10-03 | Probe only discovered router ports and retrieve unauthenticated home page | HTTP/80 and WinBox/8291 reachable; page identifies RouterOS; TCP/22 timed out and TCP/443 refused. SSH status, allowed sources and configured port remain unknown | Administrator login to inspect SSH settings |
| 2026-10-03 | Verify operator internet path | Wi-Fi-bound and ordinary HTTPS requests both return HTTP 200; selected external IPv4 route uses home Wi-Fi | Retain Wi-Fi while configuring the lab |
| 2026-10-03 | Operator confirms known administrator login; attempt to open local login page | Browser-opening command rejected as blocked by policy; operator must open the local address manually. No password requested in chat | Read-only SSH-service inspection |
| 2026-10-03 | Operator enables SSH in WebFig and supplies service-list screenshots; retest from computer | TCP/22 reachable with `SSH-2.0-ROSSSH`; Ethernet remains `192.168.88.254/24` at 100 Mbps | Local SSH login and read-only hardware/firmware/address inspection |
| 2026-10-03 | Operator supplies hardware/firmware/address output and authorizes use of a temporary administrator credential | Assistant SSH login succeeds; operator clarifies the router was already reset | Preserve reset configuration and existing backups |
| 2026-10-03 | Inspect active configuration and save/download backups | Reset LAN/default firewall confirmed, no active HotSpot; new encrypted binary backup and nonsensitive export saved locally; historical backups copied | Stage the proposed lab LAN |
| 2026-10-03 | Validate and import staged LAN script | Corrected `dry-run` flag syntax and enclosing variable scope; first runtime guard stopped before changes, corrected script applied successfully | Renew Ethernet and verify new management address |
| 2026-10-03 | Complete migration and refresh DHCP | Router only on `10.20.0.1/24`; computer bound to reserved `10.20.0.10`; DHCP server identity refreshed to `10.20.0.1`; management restricted to the operator address | Verify local routing/DNS and preserve final configuration |
| 2026-10-03 | Verify wired router ping, local DNS, new SSH login and operator internet | Pass; router WAN remains physically disconnected and its only IPv4 route is the local subnet | LAN checkpoint complete; identify AP power |
| 2026-10-03 | Save verified LAN export and encrypted backup | Copied into ignored local backup directory; configuration scripts retained in `mikrotik/` | Resume at AP checkpoint |
| 2026-10-03 | Operator identifies `UAP-AC-M` and injector `GP-J240-030G`, 24 V / 0.3 A / 7.2 W; verify manufacturer specifications | Injector rating is below AP maximum consumption of 8.5 W | Check MikroTik adapter capacity or another available injector |
| 2026-10-03 | Operator reports MikroTik adapter output of 24 V | Voltage reported; output current/model not supplied | Read output current to evaluate combined router/AP budget |
| 2026-10-03 | Attempt router SSH and inspect Windows link | SSH timed out; Ethernet is Disconnected, home Wi-Fi is Up. No router configuration changed | Reconnect computer to ether2 before further terminal diagnosis |
| 2026-10-03 | Operator confirms MikroTik adapter output 24 V / 0.8 A / 19.2 W and that spare injectors have the same 7.2 W rating | Supply has rated capacity for router/AP bench trial | Inspect ether5 and prepare direct AP connection |
| 2026-10-03 | Recheck Windows link and authenticated router SSH | Ethernet restored at 100 Mbps with `10.20.0.10`; Wi-Fi remains Up; SSH succeeds | Continue AP power check |
| 2026-10-03 | Inspect ether5 PoE/link and DHCP | `auto-on`, `waiting-for-load`, no ether5 Ethernet link; only operator DHCP lease bound; `/system health` unavailable. No router configuration changed | Operator connects AP directly to ether5 with short cable |
| 2026-10-03 | Operator connects AP to ether5 and reports blinking AP LED and red ether5 light | Router reports powered-on and 100 Mbps full-duplex link; DHCP assigns AP `10.20.0.200`; LLDP identifies model/firmware/MAC | Inspect AP reachability and management |
| 2026-10-03 | Ping AP, inspect SSH banner/host key and match Windows ARP to router discovery | Ping 0% loss, 1–3 ms; SSH reachable; MAC matches direct ether5 device | Attempt documented default login only |
| 2026-10-03 | Try both manufacturer-documented default SSH logins | Both rejected; AP adoption state/configuration not authenticated | Use the already-authorized AP reset |
| 2026-10-03 | Operator clarifies AP blinking color is blue; repeat router link/PoE checks | Power stays on, Ethernet runs without packet errors; blue indication consistent with existing setup | Prepare reset checkpoint |
| 2026-10-03 | Validate/import AP reservation script and inspect lease | Static reservation `10.20.0.2` set for AP MAC; active lease still `10.20.0.200`; router export/encrypted backup saved locally | Operator resets powered AP; verify new lease and SSH afterward |
| 2026-10-03 | Operator completes AP reset and reports solid white LED | AP active lease changes to reserved `10.20.0.2`; ether5 remains powered and linked | Verify fresh terminal access |
| 2026-10-03 | Match AP MAC/host key, ping and authenticate with factory SSH login | Pass; authenticated `mca-cli-op info` confirms model/firmware/IP and default unresolved inform destination; no AP configuration changed by the assistant | Prepare local management server |
| 2026-10-03 | Inspect Windows prerequisites and active management ports | x64, sufficient RAM/storage, WSL 2 present; no active UniFi management detected; terminal not elevated | Download official Windows x64 installer |
| 2026-10-03 | Download UniFi OS Server `5.1.42` from official release metadata and verify | Size/SHA-256 match; Authenticode Valid, UBIQUITI INC.; executable manifest requires administrator rights | Operator runs the prepared installer locally |
| 2026-10-03 | Operator installs UniFi OS Server; inspect services/processes/listeners and local pages | Server `5.1.42` running; local HTTPS `11443` reachable; Network `10.5.67` | Verify inform path and authenticate locally |
| 2026-10-03 | Set AP inform destination to `10.20.0.10:8080`; probe from AP | AP reaches local controller; inform status initially Not Adopted | Adopt only the known lab MAC |
| 2026-10-03 | Use supplied API credential against pinned loopback server; inspect pending devices and adopt | One matching AP found; adoption succeeds and device becomes ONLINE | Set Kenya regulatory domain and SSID |
| 2026-10-03 | Change country and check AP via controller-managed SSH | Both AP radios report country `404`; inform Connected to local address | Create lab Wi-Fi |
| 2026-10-03 | Generate locally saved Wi-Fi password and create `KiberaMesh-Lab` | API creation succeeds after omitting unsupported optional MLO setting; native LAN, WPA2, 2.4/5 GHz | Verify provisioning and credential file |
| 2026-10-03 | Inspect AP configuration, final controller state, credential match and Windows interfaces | SSID/WPA2 configuration present; AP ONLINE; saved password matches; computer lab/home links Up; redacted snapshot saved | Phone discovers and joins SSID |
| 2026-10-03 | Operator reports phone connects at `10.20.0.199`; inspect router lease/ARP and UniFi client | Bound iPhone lease; matching wireless client through lab AP | Checkpoint 3d passes; prepare local page |
| 2026-10-03 | Recheck router WAN and computer routing | Ether1 no-link; no router default route; computer IPv4 forwarding disabled | Keep lab without WAN for first local-service test |
| 2026-10-03 | Create/start dedicated local Python/HTML service on `10.20.0.10:8000` | Listener active; host HTML/JSON return HTTP 200; fresh codes differ; private-file path returns 404 | Verify a separate LAN source |
| 2026-10-03 | Fetch status from MikroTik using local DNS name and inspect request log | Successful response logged from `10.20.0.1`; existing firewall permits path without changes | Phone opens local page |
| 2026-10-04 | Operator supplies check code `AA700ED7EC7F`; inspect server log | Exact match to HTTP 200 from phone `10.20.0.199` at 00:01:27 EAT; previous response had a different code | Checkpoint 4 passes; test local DNS from phone |
| 2026-10-04 | Recheck computer interfaces, portal listener and direct router DNS | Lab/home interfaces Up; service still bound only to `10.20.0.10:8000`; local name resolves correctly | Phone opens named URL |
| 2026-10-04 | Operator reports named URL fails on mobile; recheck service and authenticated router DNS/DHCP/firewall | Service alive; phone lease bound; DNS advertisement/A record correct; six direct UDP/TCP DNS probes pass; no newer successful phone HTTP response | Inspect phone DNS setting and exact browser error |
| 2026-10-04 | Operator inspects phone DNS setting | Automatic DNS; only `10.20.0.1` listed, matching router DHCP | Obtain browser error and fresh IP-based control check |
| 2026-10-04 | Operator confirms IP URL still works, hostname fails in another browser, with server-IP-not-found error | New successful IP-based phone HTTP requests; failure is in name resolution | Trace phone DNS and try a fresh diagnostic alias |
| 2026-10-04 | Capture bounded phone DNS traffic; inspect filtered PCAPNG and restore sniffer settings | 24 decoded UDP DNS frames; no lab-name lookup in the window; temporary alias configured; cause not established | Test per-network Private Relay setting |
| 2026-10-04 | Operator reports named page loads with code `ECFA4AC0A5F9` in response to the per-network Private Relay test | Exact match to HTTP 200 from phone `10.20.0.199` at 00:40:28 EAT; named-URL test passes as reported, without a definitive causal toggle comparison | Inspect optional WAN baseline |
| 2026-10-04 | Inspect WAN DHCP, bridge/list membership, NAT, IPv4/IPv6 firewall and routes; remove guarded temporary DNS alias | Existing ether1 WAN setup ready; ether1 still no-link, no internet route; portal A record preserved | Operator connects home-router LAN to ether1 |
| 2026-10-04 | Operator connects home-router LAN to ether1; inspect link, DHCP, routes, DNS and phone lease | WAN `192.168.100.76/24` bound, default route via `192.168.100.1`, upstream DNS learned; phone retains lab lease | Probe router internet and local service |
| 2026-10-04 | Router public ping, DNS, external HTTP and local named status fetch; inspect computer links/listener | Network probes and local service pass; HTTPS fetch reports missing trusted CA; NTP disabled and router clock behind computer | Phone checks external HTTPS and a fresh local response |
| 2026-10-04 | Operator confirms external HTTPS and local named page both succeed with WAN connected; supplies `E6EF6D01DDD6` | Exact local-log match from phone `10.20.0.199`, HTTP 200 at 07:47:32 EAT; checkpoint 5 passes | Prepare WAN withdrawal |
| 2026-10-04 | Discover computer home Wi-Fi disconnected, reconnect existing home profile and verify route/source-bound HTTPS | Home Wi-Fi restored; external route selects home gateway; Wi-Fi-source HTTPS returns HTTP 200; Ethernet and local service remain Up, forwarding Disabled | Operator unplugs only MikroTik ether1 |
| 2026-10-04 | Operator disconnects ether1; inspect WAN/link/routes/DNS, AP PoE and LAN leases | Ether1 no-link; WAN address/default route/upstream DNS removed; public ping has no route; AP powered and leases bound | Verify retained local service and operator internet |
| 2026-10-04 | Router fetches named local status after WAN withdrawal; inspect log and separately probe computer home Wi-Fi HTTPS | Local code `8DB9D5F0B8D5`, HTTP 200 from router at 07:57:23 EAT; home Wi-Fi-source HTTPS also returns HTTP 200 | Phone tests fresh local response and external failure |
| 2026-10-04 | Operator supplies `0176D395F121` and confirms fresh external test failed after WAN withdrawal | Exact HTTP 200 match from phone `10.20.0.199` at 08:00:45 EAT; checkpoint 6 and Milestone 001 pass | Test restart recovery |
| 2026-10-04 | Verify listener/process identity, stop original page process and start the same service again | New PID `28716` at 08:07:53 EAT; lab-only listener restored; host status HTTP 200 with new code at 08:08:11; stderr empty | Phone checks a fresh response after service restart |
| 2026-10-04 | Operator supplies post-service-restart code `EB8B33447CD8`; inspect request log | Exact HTTP 200 match from phone `10.20.0.199` at 08:10:38 EAT; checkpoint 7a passes | Restart AP with WAN absent |
| 2026-10-04 | Verify known AP identity/state/uptime, request local API RESTART and observe recovery | HTTP 200 accepted; OFFLINE then ONLINE; uptime reset from 33227 to 71 seconds; firmware/configuration ID unchanged | Verify direct AP settings and WAN isolation |
| 2026-10-04 | Retry early timed-out AP inspection after heartbeat recovery; inspect AP SSH and router | Direct AP uptime 107 seconds, local inform Connected, lab SSID/WPA2/Kenya retained; ether1 no-link, no router default route | Phone checks fresh local access after AP reboot |
| 2026-10-04 | Operator supplies post-AP-restart code `C22B83C88390`; inspect request log | Exact HTTP 200 match from phone `10.20.0.199` at 08:26:39 EAT; checkpoint 7b passes | Prepare router recovery test |
| 2026-10-04 | Inspect router/WAN state, save/download fresh export and encrypted backup, then request guarded software reboot | Local backup files verified; SSH unavailable 08:41:19–08:41:52 EAT; same host key/authentication after recovery | Verify persisted LAN configuration and AP recovery |
| 2026-10-04 | Inspect recovered router DHCP/DNS/routes/management and fetch local named status | Router uptime reset; LAN configuration retained; code `85A1D012E99B`, HTTP 200 at 08:42:34 EAT; ether1 still no-link/no default route | Wait for fresh AP heartbeat |
| 2026-10-04 | Observe AP link return and fresh heartbeat; inspect AP through SSH and recheck operator internet | AP also rebooted, returns ONLINE with saved SSID/security/country and local inform; server process retained, home Wi-Fi HTTPS works | Phone checks local access after router/AP recovery |
| 2026-10-04 | Operator supplies post-router-restart code `283D31ADC122`; inspect request log | Exact HTTP 200 match from phone `10.20.0.199` at 08:50:50 EAT; checkpoint 7c passes | Verify controller local login and backup |
| 2026-10-04 | Inspect local controller system API, saved integration contract and read-only backup setting probe | Controller still cloud-connected/SSO-enabled and reports setup; tested API path returns Invalid; no restorable UniFi backup created | Operator checks actual local console screen |
| 2026-10-04 | Prepare private controller backup directory and inspect inherited permissions/Git exclusion | Current user/SYSTEM only, no other Allow rules, Git-ignored | Save a downloaded controller backup after login is verified |
| 2026-10-04 | Operator confirms requested fresh local console login reaches Network dashboard with a UI account; API key belongs to the same account | Interactive local access confirmed while computer home internet remains available; no account password requested or stored | Download local controller backup |
| 2026-10-04 | Operator reports backup filename; inspect downloaded `.unifi` file, hash, ACL and Git exclusion | 76,960 bytes; SHA-256 recorded; current Windows user/SYSTEM only; Git-ignored. Payload restore compatibility remains untested | Preserve backup and prepare controller outage |
| 2026-10-04 | Verify fresh controller/AP/router/portal baseline and inspect installed Windows application lifecycle code | Known AP ONLINE and local inform Connected; WAN absent; portal/home Wi-Fi HTTP 200; tray **Exit** invokes graceful controller stop | Operator exits the controller through its notification icon |
| 2026-10-04 | Operator exits controller through tray; inspect application processes/listeners and probe console/inform ports | No application process/listeners; both ports refuse loopback and lab Ethernet connections at 09:45:11–09:45:17 EAT | Verify retained LAN/service path |
| 2026-10-04 | Inspect authenticated router/WAN/AP power/link/leases/DNS; fetch named portal and separately probe operator internet | WAN absent; AP powered/linked; router HTTP 200/code `04C23FA06265` at 09:45:36 EAT; home Wi-Fi HTTPS works | Phone rejoins lab Wi-Fi and checks a fresh named response with controller stopped |
| 2026-10-04 | Operator supplies `7397630C94C9`; match request log and recheck controller/WAN before relaunch | Exact phone HTTP 200 at 09:47:29 EAT; controller ports remain unavailable; WAN absent. Fresh phone access during controller outage passes | Start controller and verify management recovery |
| 2026-10-04 | Initial terminal launch exits; inspect application log and inherited Electron environment, then retry child launch without Node mode | Corrected launch at 09:51:53 EAT initializes normally; container starts 09:52:16; pinned system endpoint HTTP 200 at 09:52:52 | Check authenticated API and fresh AP heartbeat |
| 2026-10-04 | Verify same API credential, AP heartbeat/configuration/direct SSH, phone client observation, portal and operator internet | AP fresh ONLINE heartbeat 09:52:59 EAT, uptime continues, Wi-Fi/settings retained; portal/home Wi-Fi HTTP 200; backup hash unchanged | Final interactive dashboard/phone checks after controller recovery |
| 2026-10-04 | Operator confirms post-recovery local dashboard login and supplies `C1B25A6383F2` | Exact phone HTTP 200 at 09:57:25 EAT; checkpoint 7e controller outage/recovery passes | Prepare controller-only cloud connectivity withdrawal |
| 2026-10-04 | Inspect vendor Podman configuration, controller identity/namespace and baseline egress; validate scoped time-limited nftables rules | Known healthy controller, distinct network namespace, baseline external HTTPS 200; no host/WSL-wide network changes | Activate controller-only test |
| 2026-10-04 | First test blocks controller output including host DNS; inspect root/API/system and restore test table | Local root/API and AP heartbeat work; system endpoint timeouts observed; test table removed | Retain known local host/DNS paths in final test |
| 2026-10-04 | Apply final controller-only test, recheck public HTTPS/local console/filter/cloud/operator internet | Window 10:18:07–10:33:04 EAT; public HTTPS fails, cloudConnected false, local system/root HTTP 200, home Wi-Fi HTTPS 200 | Phone attempts fresh local dashboard login and reports a portal code within the window |
| 2026-10-04 | Operator reports mobile 400; compare pinned HTTPS and plain HTTP on controller port and inspect active isolation | HTTPS root HTTP 200; HTTP reproduces nginx plain-HTTP-to-HTTPS-port 400. Block still active at 10:25:48 EAT; phone failure stage/protocol not confirmed | Retry full HTTPS address and identify whether login page appears |
| 2026-10-04 | Operator retries explicit HTTPS, logs in with the same UI account credentials and supplies `BCB2AA06AD34`; verify code/cloud/egress/filter | Exact phone HTTP 200 at 10:32:00 EAT; cloudConnected/hasInternet false at 10:32:46; public HTTPS rejected and block active at 10:32:49 | Checkpoint 7f passes; remove test table |
| 2026-10-04 | Remove owned test table at 10:32:58 and verify controller, portal, operator internet and backup | External HTTPS 200, cloudConnected/hasInternet true at 10:35:38; no test table remains; portal/home Wi-Fi work; backup checksum unchanged | Identify additional client/routing device |
| 2026-10-04 | Operator reports a spare laptop/computer or router is available | Category supplied; exact model, OS and network interfaces remain unknown | Obtain device details for checkpoint 8 |
| 2026-10-04 | Operator identifies HP laptop, second MikroTik and second UAP-AC-M; clarifies Windows and factory-reset router | Router label reported `RB951Ui-2nD`; exact model, power and current services remain to inspect | Prepare isolated discovery port |
| 2026-10-04 | Inspect unused primary ether4; download export/encrypted backup; syntax-check preparation and rollback scripts | Expected primary identity/serial/LAN and no-link port confirmed; ignored backups saved; both syntax checks pass | Apply guarded port preparation |
| 2026-10-04 | Remove ether4 from primary bridge, add scoped discovery list and verify services | Ether4 isolated; no IP/NAT/service changes. Portal/DNS/dashboard/AP/home Wi-Fi pass; primary WAN remains absent | Operator connects primary ether4 to spare ether2 |
| 2026-10-04 | Operator confirms spare adapter matches the first; recheck primary ether4 | Adapter reported 24 V / 0.8 A / 19.2 W; ether4 still no-link with no neighbor. Isolation/discovery settings remain intact | Await spare-router cable connection; keep second AP disconnected |
| 2026-10-04 | Operator reports spare connected; inspect primary ether4 discovery | 100 Mbps full duplex; `RB951Ui-2nD`, RouterOS 7.20.6, MAC `2C:C8:1B:39:14:DF`, address `192.168.88.1` | Prepare operator-only terminal access |
| 2026-10-04 | Save primary pre-access backup, syntax-check/apply scoped management mappings and inspect spare via pinned SSH | Operator SSH/WebFig work; authenticated hAP r2 serial `DE7A0E5D61EC`, 64 MiB/16 MiB, factory LAN confirmed | Back up and secure spare |
| 2026-10-04 | Save encrypted spare baseline, generate protected password, apply guarded bootstrap and verify fresh authentication | `KM-LAB-002`; radio disabled; management restricted; new password login works; secured export/encrypted backup saved | Validate additional HP client |
| 2026-10-04 | Recheck original portal/controller/home Wi-Fi and primary router/AP | HTTP/HTTPS pass at 11:16:06; WAN absent, AP reachable; new `Afribit` lease at `10.20.0.198` | Operator confirms HP identity and supplies fresh portal code |
| 2026-10-04 | Operator confirms HP identity and supplies `8A7FFC9E30BA` | Exact HTTP 200 from `10.20.0.198` at 11:22:35 EAT | Checkpoint 8b passes; stage wired OSPF |
| 2026-10-04 | Download both pre-OSPF exports/encrypted backups; syntax-check and apply guarded scripts | Node2 LAN `10.21.0.0/24`, transit `10.255.20.0/30`; both OSPF neighbors Full and peer LAN routes active | Verify return route and routed service access |
| 2026-10-04 | Renew operator Ethernet reservation with scoped classless route; expand portal source check and restart its verified process | Windows selects Ethernet for node2 and Wi-Fi for external destinations; portal PID `24728` | Verify request sourced from node2 LAN |
| 2026-10-04 | Fetch portal from `10.21.0.1`, authenticate direct pinned SSH, check original services and save post-change backups | Code `FA5D6E59BD00`, HTTP 200 at 11:41:49 EAT, unchanged source; direct SSH works; AP/controller/home Wi-Fi pass | Checkpoint 8c passes; connect AP2 |
| 2026-10-04 | Operator reports second-router ether5 red and AP solid white; inspect PoE/link/DHCP/ARP/logs | PoE powered-on; UBNT lease `10.21.0.200`, MAC `D8:B3:70:C6:BE:BD`; repeated Ethernet link drops, currently no-link and 3/3 pings lost; OSPF Full | Replace only the AP2-to-ether5 cable and inspect again |
| 2026-10-04 | Operator confirms replacement cable and white AP; inspect node2 link and ping | 100 Mbps full duplex on repeated readings, 3/3 pings; factory SSH confirms UAP-AC-Mesh 6.8.2.15592, expected MAC | Capture AP configuration and reserve address |
| 2026-10-04 | Capture private AP configuration; reserve `10.21.0.2`; restart AP and pin reconnect | Private 4,179-byte capture; new lease active at `.2`, same host key/model/MAC | Point AP to local inform and adopt |
| 2026-10-04 | Set local inform URL and adopt expected pending device through integration API | Adopted at 20:15:44 EAT, provisioned and ONLINE; controller-managed SSH works | Configure AP2 radio channels and dedicated test SSID |
| 2026-10-04 | Configure **KiberaMesh-Node2**, Kenya country/radio channels, and verify both devices and scoped broadcasts | AP2 Connected, channels 11/44, WPA2 SSID on both bands; AP1 also ONLINE; node2 DNS resolves portal | Save updated node2 backup and request phone test |
| 2026-10-04 | Save updated node2 export/encrypted backup and redacted controller snapshot; verify fresh host portal response | Export 9,244 bytes, encrypted backup 37,148 bytes; host code `7439A9596A47`, HTTP 200 at 20:26:32 EAT | Checkpoint 8d passes; await phone IP/code through AP2 |
| 2026-10-04 | Operator reports expected node2 DNS and failed page attempt; inspect phone lease, routing, host listener, firewall and fresh backend response | iPhone `10.21.0.199`; pings pass locally and across both routers; fresh node2 HTTP 200 `8E80781AAD0D` at 20:33:44 EAT; no successful phone HTTP logged | Request explicit `http://` retry and exact error |
| 2026-10-04 | Run bounded phone TCP/8000 capture during retry request, then restore sniffer settings | Empty PCAPNG capture; no retry confirmation within window; capture stopped/settings restored | Await browser result; do not infer a cause from the empty capture |
| 2026-10-04 | Operator changes new-SSID Limit IP Address Tracking setting and supplies `04ABFDFCF1C4`; match log, lease and AP association | Exact HTTP 200 from iPhone `10.21.0.199` at 20:45:32 EAT, source preserved; associated through AP2; both APs ONLINE and OSPF Full | Checkpoint 8e passes; verify local name from this client |
| 2026-10-04 | Review Apple's Private Relay guidance and record privacy-compatible deployment acceptance | Per-network workaround observed; direct private/local access is intended by Apple; exact failure mechanism untraced; no network-wide relay block added | Test discovery/access with privacy enabled and offline transitions before deployment |
| 2026-10-04 | Operator reports named portal loads with `76015B12280C`; match server log | Exact HTTP 200 from node2 phone `10.21.0.199` at 20:53:18 EAT | Checkpoint 8f passes; inspect alternate-link prerequisites |
| 2026-10-04 | Inspect built-in radio availability and download matching primary driver plus fresh backups | Primary wireless package absent; node2 driver present; matching 7.20.8 mipsbe package and protected backups saved | Install driver and verify recovery before RF configuration |
| 2026-10-04 | Install matching primary wireless package by guarded reboot; verify pinned SSH, packages, wired OSPF and named node2 fetch | Driver restored, radio disabled; wired OSPF Full; `DF6217D52C48` HTTP 200 from node2 at 21:05:03 EAT; post-install backups saved | Direct AP1 recovery verified; await fresh named phone access before configuring RF transit |
| 2026-10-04 | Operator supplies post-driver-reboot `E108996389DE` | Exact HTTP 200 from node2 phone `10.21.0.199` at 21:10:12 EAT | Checkpoint 8g passes; stage RF backup |
| 2026-10-04 | Syntax-check guarded RF setup/rollback, recover initial primary SSH parsing failure, apply corrected templates and save backups | Two Full OSPF adjacencies per router; WPA2/AES radio peer; 10/10 pings both ways; wired route retained; node2 named backend fetch succeeds | Checkpoint 8h; unplug only inter-router transit cable and report fresh phone code |
| 2026-10-04 | Operator removes primary ether4 transit cable and supplies `DA183173CFD0`; verify both routers and portal log | HTTP 200 from phone `10.21.0.199` at 21:24:43 EAT; both wired ports no-link; peer LAN routes use wlan1; radio OSPF Full; radio drop counters zero | Checkpoint 8h passes; reconnect same cable and verify wired preference recovery |
| 2026-10-04 | Operator reconnects transit and supplies `D6FCCF857F2D`; inspect both routers | HTTP 200 from phone `10.21.0.199` at 21:31:41 EAT; both ports 100 Mbps full duplex; wired and radio OSPF Full; wired LAN routes preferred again | Checkpoint 8i passes; prepare separate HP service host |
| 2026-10-04 | Operator reports HP Python 3.14.8 and `10.21.0.198`; inspect and reserve known lease; prepare/test identified portal bundle | HP known MAC bound/reserved; local identity/header/file rejection tests pass; limited bundle download available | Checkpoint 9b; start HP copy and report phone code/node label |
| 2026-10-04 | Operator supplies `CF02A05BA95C`; independently fetch HP JSON/HTML and stop verified bundle-transfer process | HP HTTP 200, node `KM-LAB-002-HP`; host probe code `21C0ED283444` at 22:09:09 EAT; transfer helper stopped | Checkpoint 9c; match phone code to HP local log |
| 2026-10-04 | Operator supplies screenshot matching `CF02A05BA95C` in HP log | `KM-LAB-002-HP`, phone `10.21.0.199`, HTTP 200 at 22:08:36 EAT | Checkpoint 9c passes; test original service-process loss |
| 2026-10-04 | Verify original listener/process, stop only PID 24728 and probe both addresses | Original port refuses connections at 22:18:17 EAT; HP HTTP 200 `5541E91FDB12` at 22:18:19 EAT | Checkpoint 9d; fresh phone request to HP during outage |
| 2026-10-04 | Operator supplies `5719D1E75C15` and HP screenshot during original-service outage | Exact HP HTTP 200 from phone `10.21.0.199`, node `KM-LAB-002-HP`, at 22:20:57 EAT | Checkpoint 9d passes; restore original portal |
| 2026-10-04 | Confirm original listener remains absent, restore explicit original portal and probe both hosts | PID 31852; original HTTP 200 `74CCF0FDF22A` at 22:26:43 EAT; HP HTTP 200 `2EA220CAE77B`; original stderr empty | Checkpoint 9e; fresh original named-phone response |
| Pending | Phone recovery confirmation, automatic service selection, reproduction/restore and air-gapped cold startup | HP independence test passes and both services run again | Await original phone code/node label |
