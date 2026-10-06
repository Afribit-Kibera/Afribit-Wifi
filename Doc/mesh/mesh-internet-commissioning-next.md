# Mesh: next internet milestone

## Current step: automatic checkout handoff

5 October 2026. The automatic checkout release is deployed and enabled on
`https://wifi.afribit.africa` for Primary's open Mesh network. The original price
catalogue is retained. Verified Paystack collection is automatically reconciled
through the Engine into a Bitcoin receipt, then a durable device-bound order
activates native HotSpot access. Customers do not type router credentials.
Six-digit vouchers follow the same activation path.

The no-payment native activation and fixed expiry pass on the real iPhone.
At 20:46:53 EAT, the complete cloud voucher handoff also passes: one six-digit
voucher, one grant, automatic native session, and the same grant on redemption
retry. The diagnostic expires at 20:49:40 EAT. The real phone opens the catalogue.
The operator confirms fresh public HTTPS access after automatic activation,
with cellular data off and no router credentials entered.
The remaining check is a fresh paid purchase from that phone after the diagnostic
expires. Stay on Mesh with cellular data off, reopen `http://10.30.0.1/login`,
tap **Choose an internet pass**, select a catalogue pass and approve M-Pesa.
No manual username/password step is part of this flow.

[Deployment, evidence and operating limits](mesh-native-automatic-access.md).
[Live catalogue settlement policy](mesh-engine-bitcoin-settlement.md).

## Historical checkpoints

**Live deadline check passes:** `mesh60` authenticates on the observed phone at
19:42:21 EAT, with native authorization and a configured 2M/2M queue. Primary
closes it at its fixed **19:43:08 EAT** deadline after **47 seconds online**, then
removes the session/list/queue and retains the disabled account. This proves the
absolute cutoff independently of consuming its 60-second online budget. The next
implementation gate is trusted customer context, immutable cloud order issuance
and checkout-to-native-login handoff. No new payment/send occurs; public checkout
remains disabled. [Current evidence](mesh-native-automatic-access.md).

**Latest step:** the operator confirms the consumed pass refuses another login.
A separate absolute-deadline policy is installed on Primary after backup and
NTP synchronization. Router fixtures prove unused expiry, invalid-deadline denial
and expired login-hook refusal; the startup body is tested without reboot.
A signed receipt/context contract and isolated pinned-SSH consumer are built,
with eight access tests passing. Public cloud order issuance/client handoff is
still pending; general checkout remains disabled. No new charge/send occurs.
[Current boundary and next check](mesh-native-automatic-access.md).

**Latest access checkpoint, 5 October at 18:54 EAT:** the operator reports the
bound pass works. Primary records five minutes of cumulative use and traffic,
then no active session, dynamic authorization entry or dynamic queue. No bypass
binding is present. Phone-side fresh-request denial and refusal to reuse the
consumed pass are the current check. After that, the next implementation gate is
router-bound automatic activation with durable local expiration; the legacy
shared-token bypass agent must not be attached to the operating pilot queue.
[Exact evidence and limits](mesh-native-pass-test.md).

**Current result:** the Engine settles the approved KES 10 collection as **85 sats
to spira@blink.sv**, with both the source debit and independent receiving credit
verified. The operator's later settlement instruction supersedes the pending-BTC
checkpoint below. Customer checkout remains gated on access activation/expiry;
the one-purchase settlement pilot budget is consumed. One five-minute pass is now
provisioned for the observed phone; see the latest access checkpoint above.
[Settlement evidence and boundary](mesh-engine-bitcoin-settlement.md).

5 October 2026. The two-node transport, protected-client internet and one WAN loss/recovery cycle already pass. The operator chooses **internet checkout and access commissioning** next. The delegated photo hero and prominent internet-pass action are installed on Primary and downloaded/hash verified. The next internet milestone is **one short-lived, lab-only customer session**, followed by Bitcoin checkout after enforcement passes. No board or media demonstration needs repeating.

## Current evidence

**Paystack collection passes:** the operator supplies live Paystack/Blink credentials and chooses collection first with Bitcoin settlement pending. Both keys authenticate; Blink verifies the BTC receiving wallet. The first KES 10 prompt is unapproved and fails; its receipt is preserved. After explicit readiness, the operator approves a separate tagged KES 10 attempt. Authenticated verification at 16:23:50 EAT confirms `success`, exact reference/amount/mode/channel and Mesh metadata. No wallet send or access grant occurs; Bitcoin settlement remains pending. The local Engine source matches registered conversion attempts rather than routing solely by tag; its existing callback is retained. [Collection result and provider boundary](mesh-paystack-collection.md).

The later operator instruction authorizes **one real Bitika purchase** rather than more sandbox preparation. Owner Vercel access is restored, and the live key, payer number and signing secret are configured privately. The KES 10 collection and one identical replay return generic **HTTP 400**, without a transaction code; the operator receives no prompt and sees no dashboard error. The full official request contract is checked with no documented correction found. Further collection requests are stopped; Bitcoin settlement and paid access remain unverified. Public synthetic signer checks pass, and general M-Pesa checkout remains disabled. The operator proposes provisioning Paystack next; retaining Bitcoin receipts with its collection route requires separate settlement. [Live failure and current sequence](mesh-bitika-live-commissioning.md).

The operator reports **Mesh welcome** after the requested unpaid `http://10.20.0.1/` check. Treat this as the bounded web-management result, without extending it to other ports or client isolation. Bitika is now implemented as an optional server-side provider and verified with the operator's test credential/destination; it remains disabled for real purchases. [Provider and test evidence](mesh-bitika-provider.md).

Primary inspection after native-pass staging finds both wired/radio OSPF peers **Full**, the captive profile still serving `mesh-captive`, and **zero** trial users, authorized sessions, authorization-list members and bypass bindings. The only current unpaid destination exception is the existing board endpoint. Billing remains disabled.

The original customer overlay denies TCP 443 in RAW, general forwarding in `KM-MESH-OUT` and non-board return traffic in `KM-MESH-IN`. Native-pass staging now places three narrow exceptions ahead of those terminal denies: RAW HTTPS acceptance for the trial authorization list, authenticated/list-bound internet forwarding after private denial, and authenticated/list-bound established return traffic. The list is empty, so unpaid behavior remains intact. The base overlay is recorded in `mikrotik/kibera-mesh-lab-01-captive.rsc`; the scoped additions are in `mikrotik/kibera-mesh-lab-01-native-pass.rsc`. Flipping a UI flag alone cannot deliver paid internet.

## Sequence

| Step | Result to establish |
| --- | --- |
| **1. One unpaid management check** | **Passed for the bounded web probe:** the operator reports Mesh welcome for `http://10.20.0.1/`. Broader port, client and bypass checks remain separate. |
| **2. One short lab voucher/session** | A single customer receives general internet through Primary, under a measured rate limit, and loses that access when the router's local timer expires. An unpaid second phone remains blocked; management stays blocked for both. |
| **3. Cloud portal and Bitcoin checkout** | Only necessary portal/checkout destinations are reachable before payment; verified settlement grants the exact lab session. Failed/pending payment does not grant general internet. |
| **4. Second customer access node** | Router targeting, per-node credentials, grants and revokes are proven before enabling paid access on Node2. |

Step 2 should first demonstrate the router's own authorization and session controls without consuming the production gateway queue. RouterOS documents `session-timeout`, `limit-uptime` and `rate-limit`; choose and test their exact meanings rather than treating a session timer as an absolute purchased-until deadline. [HotSpot user/profile documentation](https://manual.mikrotik.com/docs/authentication-authorization-accounting/hotspot-captive-portal/).

The isolated five-minute profile, scoped customer internet/return rules and separate CHAP operator login are now installed on `KM-MESH-001`, after a fresh encrypted backup. The rollback remains prepared. Both scripts pass RouterOS dry-run syntax checks; runtime setup guards and rule/profile inspection pass. The form passes independent CHAP byte/hash verification and fails closed without its challenge, hash script or JavaScript; installed login/helper downloads match their sources. **No trial user or authorization exists yet.** Reconnect the phone to Mesh with cellular off, verify its current host/MAC, then provision the bound user and start one test. [Short-pass procedure](mesh-native-pass-test.md), [HotSpot customization and CHAP](https://manual.mikrotik.com/docs/authentication-authorization-accounting/hotspot-captive-portal/hotspot-customisation/).

## Code findings before connecting a gateway agent

| Inspected implementation | Finding | Required behavior |
| --- | --- | --- |
| `app/api/gateway/jobs/claim/route.ts` and `lib/gateway-auth.ts` | One shared agent token, oldest queued job claimed without a router filter | Authenticate an enrolled lab router and claim only its jobs; isolate the test environment/queue from the operating paid pilot |
| `lib/portal-session.ts` and `lib/access.ts` | Session stores browser-supplied router context, but grant jobs omit the router target | Validate and bind client context to a trusted access router; preserve that target for grants, expiry and revocation |
| `gateway-agent/index.ts` | Grant creates a bypass binding and optional simple queue; `expiresAt` is not locally enforced | Router-enforced or durable local expiration independent of cloud polling; correct-router scoped cleanup |
| `app/api/gateway/jobs/claim/route.ts` | Expired grants are queued for revoke only when an agent polls | Loss of cloud connectivity must not extend paid access indefinitely |
| `lib/access.ts` | Payment bootstrap can queue short general-access grants | Keep bootstrap disabled for commissioning; explicitly scoped checkout reachability must not become free general internet |

These are source-code observations, not new tests against the production database or a running paid agent. No payment, voucher redemption, job claim or cloud write has been performed. Billing on the lab captive stays false until this access lifecycle and the necessary checkout reachability are verified.

## Communication app lane

Berty remains the first native Android/iPhone trial candidate; the operator has both platforms available. Install it using normal internet, then distinguish same-network Wi-Fi, Bluetooth and cross-node delivery on a controlled app network. The current unpaid customer network does not yet permit arbitrary native peer traffic. App testing can proceed independently of internet billing once the operator chooses that lane. [Candidate research and short trial](mesh-communications-app-research.md).
