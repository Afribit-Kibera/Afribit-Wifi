# Mesh: where we are and what comes next

6 October 2026, Africa/Nairobi. Latest recovery/customer checkpoint: **22:10 EAT**.
Owner-facing checkpoint for the home pilot.
This document separates completed tests from the present operating state;
older runbook entries are historical evidence, not instructions to repeat them.

**The two-node local network is proven at home. Automatic paid access has also
worked in a previous live purchase. The private router-to-controller tunnel and
active HTTPS entry are restored. A post-outage KES 10 Bitika purchase delivered
86 sats and its original pass is router-acknowledged as active. The operator
reports browsing works after retry. Acceptance of the revised success/captive
handoff remains pending. We are not ready to replace 3WEST's paying-customer service.**

The current purchase exposed a rejected live `PENDING` acknowledgement. It was
recovered without another charge; the parser, background recovery and customer
progress screens are now deployed. The recovered paid phone's browsing retry is
reported working; finish acceptance of the revised completion flow. More board check codes or
manual login credentials are not needed to establish the network foundation.
[Incident and release evidence](mesh-bitika-pending-ack-incident-2026-10-06.md).

**Pilot decision, 22:23 EAT:** proceed with supervised single-device home tests.
No unattended public launch or 3WEST cutover. The fresh preflight has a connected
home gateway and no outstanding jobs; both-provider lookup found no unresolved
collections. Full load/soak testing, TV sponsorship and family entitlements are
not commissioned. Runtime advisory checking reports zero known findings; field
security still requires rotation, isolation, restore and abuse acceptance.
[Decision, product limits and next bounded test](mesh-pilot-readiness-and-device-plans.md).

## What is already proven

| Area | Completed evidence | Limit of that result |
| --- | --- | --- |
| Local network | Two MikroTiks route between their client networks using OSPF. Ethernet is preferred; the alternate radio link carries traffic after cable removal, with wired preference restored on reconnection. | Two links between two routers cannot route around the loss of either router. Three-site multi-hop and field coverage are untested. |
| Internet gateway | Both protected lab networks reached public internet. Disconnecting the home uplink preserved local access; reconnecting restored internet. | This is one home gateway, not a capacity or multi-provider resilience test. |
| Independent local services | Two Nostr relays retained signed posts and caught up after an outage. Two Blossom hosts independently retained and served a verified media object. | These are optional service demonstrations. Future media is not automatically replicated, and the computers remain service dependencies. |
| Open Mesh entry | A phone joined the open customer SSID and the router-hosted welcome appeared automatically. The mobile catalogue, local imagery, learning cards and official app logos are implemented. | OS popup behavior and full-browser behavior differ. A permanent local purchase page does not guarantee a permanently open captive window. |
| Live collection and Bitcoin | A Paystack M-Pesa collection was independently verified; the Engine delivered Bitcoin to the receiving Blink wallet. | The Paystack path uses a prefunded Bitcoin treasury. It does not instantly convert or move Paystack's bank KES into Bitcoin. |
| Automatic access | A later live KES 10 checkout produced a verified Bitcoin receipt and native router activation; the operator browsed without entering router credentials. Separate deadline tests demonstrated expiry and refusal of consumed access. | This does not establish that the newly installed HTTPS handoff currently works. The paid checkout and expiry diagnostics are distinct evidence. |
| Free external apps | Signal foreground texts arrived both ways while ordinary browsing was blocked. An installed, signed-in Blink wallet refreshed on unpaid Mesh. | These apps still use the internet. Installation, new accounts, every feature and background delivery were not accepted by those tests. |
| Offline native apps | Jami texts and calls worked in the foreground without WAN/cellular. Berty fresh messages arrived both ways on lab Wi-Fi without WAN/cellular after proximity settings were enabled. | Jami failed screen-off reception on both phones. Berty Bluetooth-off, screen-off and cross-node delivery remain pending; Wi-Fi-off delivery failed in this trial. |
| Security hardening | Deployed changes bound webhook/passkey bodies, strengthened voucher lookup and export checks, added durable signed-nonce replay rejection, fixed blocked-client voucher budget exhaustion, and patched `sharp` to 0.35.5. Live read-only replay/legacy denial and unsigned negative checks pass; runtime advisory count is zero. | Nine development dependency findings remain. This is a scoped owned-code audit, not an external penetration-test certificate or field clearance. |

Evidence: [network readiness](kibera-mesh-network-readiness.md),
[local Nostr](kibera-mesh-nostr-lab.md), [Blossom storage](kibera-mesh-blossom-lab.md),
[automatic access](mesh-native-automatic-access.md),
[settlement](mesh-engine-bitcoin-settlement.md),
[Jami](mesh-jami-local-trial.md), [Berty](mesh-berty-local-trial.md),
[security release](mesh-security-release-2026-10-06.md).

## What is running, and what is paused

The public website is `https://wifi.afribit.africa`. The spare Primary router
serves the local welcome and purchase directory. Local networking is separate
from the new cloud controller's private tunnel: a broken controller tunnel does
not by itself mean that the two-node lab routing has stopped.

| Component | Current checkpoint |
| --- | --- |
| Paid checkout | Billing enabled. The operator's KES 10 purchase has verified Bitika delivery, acknowledged access and reported working browsing; new release shows one M-Pesa flow with owned-receipt recovery and honest activation progress. Physical success/handoff acceptance is pending. |
| HTTPS onboarding | Existing TLS overlay activated; old plaintext joins remain blocked. Public forged-header and invalid loopback attestation checks pass. Physical unpaid-phone catalogue acceptance remains pending. |
| Controller host | Dedicated LunaNode host at `mesh-core.afribit.africa`; controller/TLS services are present. Active health and pinned private router SSH passed at recovery. Earlier 20:31 EAT inventory contained no outstanding access orders or unresolved initiated collections. Public health alone is not proof of router reachability. The former laptop access worker remains disabled. |
| Bitika | Preferred provider. Original KES 10 purchase verified fulfilled with 86 sats to the stored recipient and a valid hash. The live `PENDING` acknowledgement is supported; missing responses are recovered using encrypted original payloads and leased same-key requests. No second collection or Engine transfer was made during recovery. |
| Paystack backup | Configuration and Engine settlement/access readiness checks pass, with historical accepted collection and settlement evidence. These provider readiness checks do not prove a new customer collection or payout. An uncertain Bitika attempt must retain its original reference rather than automatically starting a second collection with Paystack. |
| Blink notifications | A one-iPhone Apple push trial is installed and read back: five destinations, two static forwarding rules, five garden entries and ten scoped generated rules; no raw HTTPS allowance. The latest router check has zero established APNs connections and zero paid sessions. A report that it “connects” is not proof of a locked-screen alert or a Blink event arriving. |
| Local application hosts | Experimental Nostr/media services still depend on the primary computer and HP host. They have not all become unattended community appliances. The cloud controller move does not move these local services. |

The push trial uses shared Apple notification infrastructure and requires WAN.
It cannot isolate notifications to Blink alone or provide offline wake-up.
Android push is not commissioned. See [push scope and acceptance](mesh-mobile-push-trial.md).

The configured receiving Lightning address is **`spira@blink.sv`**, the address
the operator supplied. Both the Bitika commissioning configuration and the
Paystack/Engine settlement configuration agree. Bitika pays that destination
directly; it must not trigger an additional Engine send. The present KES 10
purchase has a verified 86-sat delivery receipt. Configuration and read-only
quotes alone are never treated as delivery evidence.

The original UDP 51820 tunnel recovered with a fresh handshake at 21:24 EAT;
pinned private router SSH succeeded and the existing TLS overlay activated at
21:30 EAT. Earlier captures and the restricted UDP comparison are retained as
evidence; no operational endpoint migration was applied. The temporary probe
permit was removed. The precise earlier cause remains unresolved.
See [connectivity evidence](mesh-controller-connectivity-2026-10-06.md).

Signed-request replay and blocked-client voucher budget fixes are implemented
and regression-tested. The additive replay table and dual-header controller are
installed with active health; the strict API is deployed. A live read-only
check accepts fresh requests, rejects identical replay and denies nonce-less
legacy traffic. These fixes are distinct from
physical checkout and field abuse acceptance.
[Security release and safe rollout](mesh-security-release-2026-10-06.md).

## What the customer experience should be

1. Join **Mesh**, without a Wi-Fi password, and see the welcome page.
2. Use approved free resources/apps, or choose an internet pass.
3. Enter an M-Pesa number and approve the provider's prompt on the phone.
   The M-Pesa PIN is never entered in Mesh.
4. See clear progress: waiting for approval, verifying payment, then connecting.
5. Receive automatic access on the purchasing device after verified Bitcoin
   delivery and the router's activation acknowledgment. A voucher uses one
   six-digit code; it does not expose router credentials.
6. When the allowance ends, general internet stops and the local purchase page
   remains available. Approved free services retain their separately tested
   access, provided their own dependencies are working.

The router-hosted directory is available at `http://10.30.0.1/mesh.html` in the
home setup. Its static content can survive WAN loss; buying internet cannot.
The new success screen waits for router acknowledgment, then offers Start
browsing. Identified captive windows request the OS connectivity check after
five seconds; normal browsers retain the receipt. A webpage cannot force the
iPhone/Android window to remain open or close. Physical completion behavior is
still acceptance work. [Customer operations](mesh-production-operations.md).

Bitika is intended to collect KES and deliver Bitcoin directly. The Paystack
backup verifies KES collection and pays Bitcoin from the Engine's funded Blink
treasury; bank settlement, BTC liquidity replenishment, fees and reconciliation
remain separate responsibilities. Neither route should grant access from an
unverified prompt or an unresolved Bitcoin delivery.

## Roadmap: finish one gate before moving to the next

| Gate | Work | Result needed to proceed |
| --- | --- | --- |
| **1. Accept restored secure controller transport** | Tunnel, existing TLS overlay and signed-request release are recovered/deployed; finish phone acceptance. Retain fail-closed recovery. | Sustained private connectivity and an unpaid phone reaching the current HTTPS catalogue with trusted device context. Non-guest/forged requests, replays and plaintext entry remain rejected. |
| **2. Accept one home Bitika purchase** | With the phone ready, run one bounded catalogue purchase; retain its original reference if any outcome is uncertain. | Actual M-Pesa approval, independently verified Bitcoin delivery, exactly one router-bound allowance, automatic internet without credentials, and an unpaid second device still blocked. Expiry removes access without resetting counters or the original deadline. |
| **3. Finish security and operating recovery** | Exercise device ownership, isolation, voucher abuse limits, duplicate callbacks and interrupted payments; rotate pilot credentials and verify backups, monitoring and recovery. | Reviewed results on the deployed configuration, working alerts, an accountable operator and a restore procedure that preserves paid balances/deadlines. No insecure HTTP or indefinite HotSpot bypass fallback. |
| **4. Commission a field canary** | Inventory the actual serving router/APs, enroll their own identities, preserve customer entitlements, and confirm catalogue semantics before a limited migration. | One controlled field site works without price changes or lost remaining allowances; paid, unpaid, expiry and free-app behavior pass there. A reviewed rollback preserves existing service. |
| **5. Scale the transport and site policy** | Add a third routing site and an independent alternate path; test realistic radio distance, concurrent users, power loss and whole-site recovery. | Measured multi-hop routing and recovery around a failed intermediate site, with capacity limits and site-specific configuration. Additional paid gateways claim only their own orders; roaming never duplicates allowances. |
| **6. Choose the supported offline communication service** | Finish Berty's small transport/background matrix; compare local rendezvous and mobile wake-up requirements before proposing custom app work. | Documented same-site and cross-site delivery, honest screen-off behavior, and a supported security/operating model. A foreground demonstration is not an emergency communication guarantee. |

Free-app and offline-app acceptance can proceed in parallel with recovery when
they do not interrupt the active network work. The next push check needs a
locked-screen alert followed by a blocked unrelated website. A Signal alert
can accept the shared Apple push path; an actual Blink event still requires
its own observation. No funds transfer is needed solely to trigger a test.

The existing 3WEST screenshots show **3 Mbps upload/download**, nine hotspot
prices and six TV/static products. The home catalogue's 50 Mbps cap is a pilot
setting, not field parity or measured throughput. Validity, usable time,
calendar-month behavior and TV sponsorship still need confirmation; migration
must preserve them rather than silently changing the offer.
[Field gates and catalogue](3west-production-readiness.md).

## What expansion requires

Adding basic routers can extend access only when their role and capabilities
match the design. A compatible household router may work as an AP; that does
not automatically make it an OSPF routing peer or a payment-enforcement gateway.
Wireless backhaul is possible with compatible endpoints and deliberate RF
planning. Cable is an alternative, not a requirement at every site.

For new shared gateways/backhaul, target supported hardware, Gigabit Ethernet,
guest VLANs and isolation, secure management, backups and measured performance
with the actual firewall/HotSpot/queues enabled. The existing 10/100 MikroTiks
are useful home-pilot equipment, not a guarantee of a 100+ Mbps field service.
Plan power backup and a responsible site custodian alongside radio coverage.

Residents need phones, not one server each. Selected sites need always-on hosts
if they offer local accounts, discovery, educational content or media storage.
An SSD/flash drive adds storage to a host; it is not a powered routing/service
node by itself. Replication, quotas, backups and retention are separate design
decisions. The current prototype does not yet provide autonomous multi-site
administration or replace cloud payment dependencies with local equivalents.
[Equipment and scaling guidance](mesh-production-operations.md).

**Go-ahead today: continue the home pilot and accept restored secure checkout. Field
replacement remains on hold until the transport, purchase, security and canary
gates have evidence.**
