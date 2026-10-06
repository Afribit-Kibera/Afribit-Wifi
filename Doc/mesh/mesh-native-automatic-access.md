# Mesh: native payment-to-access commissioning

**Latest operating status, 6 October, 21:35 EAT:** the private router tunnel
recovered on its original endpoint, and pinned router SSH and existing-overlay
HTTPS activation passed. Controller active mode and billing readiness were
restored at 21:30 EAT without a payment or allowance reset; the laptop worker
remains disabled. Bitika is live-configured as primary with Paystack backup.
Physical unpaid-phone HTTPS catalogue acceptance and new Bitika delivery remain
pending. Signed-request/voucher throttle fixes, the additive replay schema,
dual-header controller and strict API are deployed; live read-only replay and
legacy-denial checks passed.
The successful automatic-access tests below are historical evidence, not proof
of a new paid checkout on the current handoff.
[Current status and roadmap](mesh-status-and-roadmap-2026-10-06.md).

## Earlier controller commissioning: LunaNode, 6 October 2026

The automatic-access worker now runs on the dedicated `mesh-core` VM at
[mesh-core.afribit.africa](https://mesh-core.afribit.africa/health). Its private
WireGuard link reaches the pinned Primary router. The laptop sign-in task is
stopped and disabled; two acknowledged ledger records were copied with matching
hashes and unchanged deadlines. The original guest join URL is redirected over
the private tunnel without changing the observed customer source IP. Customer
Internet traffic remains on Primary's home WAN.

VM reboot recovery passed: controller, Caddy, WireGuard, trusted HTTPS and pinned
router access recovered automatically. Physical catalogue handoff is pending.
The older Windows-controller description below is historical. Payment-provider
credentials remain in their existing components, not on the new controller.
See [commissioning, recovery and remaining gates](mesh-lunanode-controller.md).

Bitika's new `qadi_` references are supported in the local client, webhook and
commissioning receipt. Thirty-six payment tests pass and a read-only live quote
succeeds. Deployment is waiting on the website's Vercel team access; no new
Bitika charge has been initiated and Paystack remains active.

## Earlier deployment: automatic checkout, 5 October 2026

This checkpoint supersedes the manual-login and disabled-checkout checkpoints
below. Primary (`KM-LAB-001`) now serves an open Mesh welcome page that starts a
router-attested session through `10.20.0.10:8040/start`. The live catalogue is at
`https://wifi.afribit.africa`. Customers choose a pass and approve M-Pesa; the
Engine independently verifies collection and Bitcoin settlement before Mesh
queues automatic native HotSpot activation for that device. Customer router
credentials are never displayed. Vouchers use one six-digit code and the same
automatic access queue.

The production database has the additive access-context, order, heartbeat and
voucher-attempt schemas. The signed gateway daemon is installed as the
`AfribitMeshAutomaticAccess` Windows sign-in task on the primary computer.
Its router credentials stay local. The cloud stores encrypted immutable orders;
router acknowledgments, rather than payment success alone, mark access active.
Duplicate redemptions use the same grant, deadline and allowance.

**Live evidence:** a separate one-minute, no-payment diagnostic automatically
authenticates the observed iPhone without typed credentials. Its retained
account expires at **20:21:47.703 EAT**, with 56 seconds of router uptime, and
ends disabled with no active session, authorization entry or queue. Retries keep
the original deadline. Evidence is in ignored
`artifacts/mesh-lab/private/automatic-setup/router-verification.json`.
**Cloud handoff also passes at 20:46:53 EAT:** an enrolled router observation of
the same iPhone creates the signed join context and HTTP-only cloud session.
One no-sale six-digit voucher creates one grant and one encrypted order. A second
redemption returns that same grant without consuming another allowance. The
running daemon activates the native session and the cloud reports `active`, with
the fixed expiry **20:49:40.602 EAT**. Router inspection independently confirms
the matching IP/MAC and `login-by=admin`. The catalogue opens on the real phone.
With cellular data off, the operator confirms a fresh public HTTPS page loads
after this automatic activation. No router credentials were entered.
Evidence: ignored
`artifacts/mesh-lab/private/automatic-setup/cloud-verification.json`.
Neither diagnostic is counted as a paid purchase. A subsequent actual paid
phone checkout is verified below.

**Customer-paid checkout, 21:26 EAT:** payment
`704e96fc-2110-4516-bcea-d36af3c188fb` collects **KES 10**. A read-only authenticated
Engine receipt confirms **85 sats** delivered to `spira@blink.sv` at **21:25:57
EAT**. Order `bf906c6c-c330-4152-8c09-afdbe4d89ade` and its grant become active;
Primary independently logs native admin activation at **21:26:06 EAT**, the
matching phone address, and profile `KM-MESH-AUTO-50000` (`50000k/50000k`). The
original deadline remains **22:46:02 EAT**. The operator confirms internet works,
but the iPhone welcome window remains open. That is a completion-UX issue, not
an unverified paid activation. The helper
[inspect-paid-access.ts](../../scripts/mesh/inspect-paid-access.ts) reads the
stored order and Engine receipt without reconciliation or a funds send.

The native session ends at **21:34:25 EAT** for keepalive timeout with **8m19s**
retained uptime. Later, the operator explicitly requests deactivation for the
Signal test. The exact native account is disabled and its active session removed;
the cloud order/grant are marked revoked and claim token cleared. The settled
payment, Bitcoin receipt, counters and original deadline are unchanged. No
allowance is renewed. This is an intentional operator revocation, not a payment
failure or automatic expiry test.

Validation: 32 payment tests, 27 access/agent/voucher tests, mobile payment UI
checks, TypeScript checking and the production build pass. The Engine's focused
Mesh suite passes 14 tests in a disposable PostgreSQL database.
Latest Vercel deployment: `dpl_5unXjUQhJ5VjVa9XJKaXGQxmPMEv`.

**Customer payment UX release, 21:43 EAT:** the initial pending device reservation
previously took precedence over unconfirmed collection and could falsely show
"Payment received". Presentation now distinguishes waiting for M-Pesa approval,
confirmed collection, purchase completion and router activation. The catalogue
and progress screen use Safaricom's unchanged official M-PESA mark, hosted locally.
Instructions explain waiting for the prompt, approving with the PIN only there,
keeping Mesh connected and not starting another payment while confirmation is
pending. Payment references are secondary; settlement internals are absent from
customer copy. No financial state transition or provider call is changed.

Only verified active access exposes **Start browsing**, which navigates to the
real Apple connectivity probe over HTTP. This is a completion handoff to test,
not a claim that JavaScript can close the system Wi-Fi window. The screen offers
the Done/browser fallback. Router welcome/status copy is also revised and both
uploaded HTML files are downloaded and SHA256-matched against source. No Apple
probe exception is added for unpaid clients. The existing `api.json` alone does
not implement advertised modern CAPPORT: [Apple's guidance](https://developer.apple.com/news/?id=q78sq5rv)
requires TLS for the status API and DHCP/RA advertisement. Trusted certificate/DNS
commissioning and physical iPhone dismissal remain follow-up work.

Thirty-five payment tests, 320/390px browser state regressions, typecheck, targeted
lint, local and Vercel production builds pass. Live catalogue HTTP200, all nine
prices/M-Pesa input and unchanged checkout readiness pass; the locally hosted
logo's downloaded hash matches source. These release checks make no purchase or
Bitcoin send. The actual captive completion action remains phone-unverified.

**Payment availability repair:** the operator reports a disabled Pay button.
Live inspection finds an empty payment-method list and a misleading disabled
Bitcoin action: the provider was not reached and no fresh collection was created.
Paystack/Engine configuration is restored from the validated private credentials.
The authenticated read-only runtime check now confirms provider configuration,
receipt email, enabled flag, settlement readiness, native access readiness and
`checkoutReady=true`, with no blocker. The live catalogue includes the M-Pesa
phone field. Empty/invalid phone input now gets explicit validation instead of a
silently disabled action. Missing device context has a reconnect link; missing
provider configuration is clearly unavailable. A mobile Continue action brings
the selected pass and payment input into view. Thirty-three payment tests,
mobile checks at 320/390 pixels, typecheck, lint and the production build pass.
No new collection or Bitcoin transfer is made during this repair. A fresh
customer-paid phone flow is subsequently verified above.

**Pilot speed policy:** all nine active catalogue entries previously had
`speed_limit_kbps=8192`, matching Primary's `8192k/8192k` HotSpot profile.
New purchases now snapshot `50000` Kbps (50 Mbps); prices/durations and existing
immutable orders are unchanged. The daemon creates the corresponding native
rate profile on activation. This is a cap, not measured or guaranteed throughput.
Primary's ether1 and ether5 each negotiate 100 Mbps; its hardware has only
10/100 ports. A faster home subscription cannot exceed that single-link ceiling
through this router. Snapshot before the catalogue change is retained privately.

**Catalogue usability update:** the operator reports an older welcome page and
delay before prices appear. Purchase/voucher entry now renders a compact light
orange catalogue directly, without the previous cloud hero, its image download
or post-mount scroll. All nine durations and KES prices appear together; a single
available payment method needs no additional selection. Catalogue and uncached
device-context reads run in parallel, with a streamed loading screen. The local
router button immediately announces the handoff and disables duplicate taps,
then offers retry if navigation stalls. Direct visits to `wifi.afribit.africa`
also default to this catalogue. Updated router HTML is downloaded and
hash-verified against source. Mobile browser checks, TypeScript, lint and the
production build pass. Phone-side perceived latency still needs observation.

Operational boundaries: this paid overlay is commissioned on Primary only.
The primary computer must remain awake with the daemon running; paid access
requires its home-Ethernet WAN. A six-digit voucher is not a Wi-Fi password.
Router restart recovery is implemented but has not been verified by a live
reboot. Checkout HTTPS exceptions resolve to shared Vercel edge IPs, so they
do not guarantee that only this application is reachable before payment.
The current Windows Node.js inbound rule permits the local checkout bridge;
the proposed narrower dedicated rule was not installed.

Implementation: [access service](../../lib/mesh-access/service.ts),
[gateway daemon](../../gateway-agent/mesh-daemon.ts),
[pinned router helper](../../gateway-agent/mesh-router.py).
Next phone step: exchange foreground Signal messages on unpaid Mesh and confirm
ordinary internet remains blocked. The captive completion button still needs a
physical iPhone check after the UX release. Do not issue another manual router
credential test.

## Historical manual commissioning evidence

5 October 2026, Africa/Nairobi. The consumed five-minute pass refuses another
login, as reported by the operator. Its counters and real Bitcoin receipt are
retained. The receipt is marked consumed in the private native-order ledger;
it must not purchase another allowance.

**Live deadline result:** the short `mesh60` diagnostic logs in by native CHAP
at **19:42:21 EAT** on the observed phone. An active session, dynamic authorization
entry and **2M/2M** queue are captured. Router-local enforcement logs it out at
the exact preassigned deadline, **19:43:08 EAT**, with **47 seconds** of cumulative
online use, 84,567 bytes in and 133,397 bytes out. It is disabled, with no remaining
session/list entry/queue. The operator confirms that the fresh public page works.
This establishes access followed by router-local absolute expiry before the
60-second online allowance is exhausted. A separate post-expiry browser denial
and idle duration are not explicitly reported; actual throughput and reboot
behavior are not inferred.
Evidence: ignored `artifacts/mesh-lab/private/deadline-probe/mesh60-verification.json`.

## Installed on Primary

The [deadline policy](../../mikrotik/kibera-mesh-lab-01-deadline-policy.rsc) creates
a separate `KM-MESH-DEADLINE-5M` profile and router-local sweep/startup schedules.
It creates no account and reuses the inspected native authorization rules.
The old five-minute profile/user and its counters are unchanged.

Each managed user carries an immutable `mesh-deadline-v1:<Unix seconds>` comment.
The sweep checks it every second, disables expired/malformed accounts and removes
their native sessions. The login hook invokes the same check and refuses closed
accounts. Disabled accounts are never automatically re-enabled. Cleanup normally
occurs at the next one-second tick; this is not a hard real-time guarantee.

NTP was previously disabled with no configured servers. After a fresh downloaded
export and AES-encrypted backup, Primary is configured with `time.cloudflare.com`
and `time.google.com`; inspection confirms synchronization. An untrusted clock
or backward movement closes this lane. The startup body disables all managed
accounts. An unexpired purchase interrupted by reboot/clock loss needs explicit
reconciliation; this version favors denial over silently restoring access.
Clock synchronization is maintained independently of the Mesh cloud service.
[MikroTik scripting](https://help.mikrotik.com/docs/spaces/ROS/pages/47579229/Scripting),
[NTP status](https://help.mikrotik.com/docs/spaces/ROS/pages/40992869/NTP).

[Scoped closure](../../mikrotik/kibera-mesh-lab-01-remove-deadline-policy.rsc)
disables managed accounts before removing the schedules. It retains account
tombstones, the original paid-pass evidence and existing network rules. NTP
remains enabled; this closure does not alter unrelated clock configuration.

## Access consumer built, public handoff pending

The isolated [order contract](../../lib/mesh-access/order.ts) authenticates a
fresh router/server/MAC/IP host attestation and produces a signed, fixed-deadline
order only from a verified Bitcoin receipt. Domain-separated signatures prevent
a host ticket from being accepted as an order. The receipt must be obtained
through authenticated Engine `getReceipt()`, never customer-provided JSON.

The [native plan](../../lib/mesh-access/native-plan.ts) checks Primary's
identity/serial, synchronized clock, installed guards/profile and live phone
host before creating a disabled MAC/server-bound account and enabling it last.
An existing account must match the original order; a closed allowance is refused
and retry never changes its counters, password or deadline. It creates no bypass
binding. Provisioned means the credentials are ready; it does **not** mean the
phone is authenticated or that the purchased service has been delivered.

The [isolated consumer](../../gateway-agent/mesh-native.ts) performs a read-only
Engine receipt check, persists an exclusive per-payment reservation and delivers
the native plan over [pinned SSH](../../gateway-agent/mesh-ssh.py). Secrets arrive
through process stdin, and raw router/library errors are not printed. The
[ledger](../../gateway-agent/mesh-order.ts) retains the original order digest and
expiry across failures/retries, without storing credentials. An abandoned lock
requires review; a different order or consumed payment is refused. The operator
consumer defaults disabled and never polls the legacy shared pilot queue.

Private configuration would be `.env.mesh-native` (operator flag, distinct router
service key, local router credentials) and `.env.mesh-engine` (existing scoped
read-only receipt client). Router credentials must stay on the local operator
machine, outside Vercel. Execution, once issuance is commissioned, is:

```powershell
npm run mesh:native -- artifacts/mesh-lab/private/native-orders/<signed-order>.json
```

This is a bounded local consumer, **not yet automatic public checkout**. Before
customer enablement, implement a durable cloud issuer that atomically consumes
one host ticket and stores one immutable encrypted order per payment. Add the
trusted client-context bridge, authenticated router delivery, correct customer
CHAP handoff and observed activation acknowledgement. Provisioning alone must
not mark access active. Broader isolation/rate/reboot checks and Node2 paid
enforcement remain separate. The legacy bypass agent remains disconnected from
this lane; customer Paystack checkout stays disabled.

## Evidence

- Eight isolated access tests pass: signature/context/receipt mismatches,
  expiry/deadline tampering, uncommissioned Node2, concurrent consumers,
  ambiguous native result, retained deadline and consumed-receipt denial.
- TypeScript, targeted lint and Python helper syntax pass. Running the operator
  CLI without its flag refuses before any Engine/router request.
- Policy and closure pass RouterOS dry-run; installed sweep runs without error.
  The generated native provision plan also passes RouterOS dry-run, using a
  syntax-only fixture, not a real payment or grant.
- [Router runtime fixtures](../../scripts/mesh/verify-deadline-runtime.rsc) use
  dummy MACs and unknown random passwords. Expired, malformed and future-deadline
  accounts become disabled with **zero online uptime**, through the local tick.
  The installed expired login hook refuses. Invoking the installed startup body
  closes a future account; **an actual reboot was not performed**.
- All fixture accounts are removed. Original pass uptime remains **00:05:00**;
  active sessions, bypasses and authorization-list members remain zero. Both
  OSPF adjacencies remain Full.

Private evidence: `artifacts/mesh-lab/private/deadline-policy-verification.json`.
Pre-change backup directory: `artifacts/mesh-lab/private/deadline-before/`.
No new M-Pesa request or Bitcoin send occurs.

The first phone diagnostic is provisioned with a fixed deadline of **19:35:08
EAT**. The operator reports a page loads and later does not, but the router shows
zero uptime/bytes and no observed diagnostic login attempt. This is **not counted
as a successful live-session test**. Its unused disabled account is retired after
preserving the result. The original consumed paid user is retained.

The operator requests easy short credentials. A separate **mesh60** diagnostic
with an eight-character random password is prepared privately, then activated
after the operator confirms its form is ready. The deadline starts on import. This
temporary MAC-bound diagnostic makes no purchase and does not reuse the real
receipt. The operator login page now describes expiry generically rather than
claiming every pass lasts five minutes or begins its timer at sign-in.

The short diagnostic's native login and absolute cutoff pass as recorded above.
Its consumed account is retained without renewal. Next: finish the trusted
checkout handoff and immutable cloud order issuance before public enablement.
