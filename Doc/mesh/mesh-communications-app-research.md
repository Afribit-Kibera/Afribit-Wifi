# Communication apps for Mesh

Reviewed 5 October 2026; background-delivery follow-up 6 October. Scope: existing native apps for Android and iPhone, independent of the captive welcome. The already-tested Nostr board remains a lab demonstration; it is not the proposed customer communication product.

**Current recommendation: resolve background delivery before app rollout.**
The original recommendation was a small Jami LAN trial. The operator has verified
Signal's unpaid internet exception and asks for communication with no external
internet. Jami documents local peer discovery and an explicit local OpenDHT
bootstrap, which fit our routed network. The initial sequence was foreground
text with WAN absent, followed by separate nodes. The official
[offline instructions](https://forum.jami.net/t/jami-survival-kit-internet-down-keep-talking/5351)
describe disabling iPhone notification mode and keeping the app open; background
offline delivery is not promised. The subsequent pilot installs a local OpenDHT
bootstrap; the operator confirms offline foreground texts and reports working
calls, but both phones fail screen-off delivery. No open-captive Jami exception
has been commissioned. [Trial result](mesh-jami-local-trial.md).

Apple has a separate Local Push Connectivity API for offline background alerts,
requiring app integration and an Apple-granted entitlement. This is a viable
development direction, not a verified setting in the installed Jami app or a
reason to recommend another store app without checking its support.
[Background research and next milestone](mesh-background-delivery-options.md).

Berty remains a candidate for Bitchat-like proximity communication: open source,
peer-to-peer, no phone-number registration and both mobile platforms. Its
development status and Bluetooth-versus-routed-Wi-Fi transport need evaluation.

## Candidates

| App | Platforms and network approach | Fit and practical limit |
| --- | --- | --- |
| **Berty Messenger** | Android/iPhone; open-source Wesh protocol; its repository identifies Bluetooth LE and mDNS for offline discovery, with peer-to-peer encrypted messaging | Closest Bitchat-style candidate. The current repository still warns that it is under development, not hardened and unsuitable for sensitive data. Verify delivery on the actual phones before promoting it. [Source and development status](https://github.com/berty/berty), [protocol](https://berty.tech/wesh), [Google Play](https://play.google.com/store/apps/details?id=tech.berty.android), [App Store](https://apps.apple.com/app/berty-messenger/id1535500412) |
| **Jami** | Android/iPhone and desktop; peer-to-peer communication using OpenDHT, with documented LAN discovery and a configurable local bootstrap | Good candidate for explicitly configuring local infrastructure. Fully offline iPhone operation requires keeping the app in the foreground and disabling its notification mode; background delivery depends on Apple push. Public username lookup also depends on internet, so exchange Jami IDs beforehand. [Platforms](https://jami.net/), [LAN configuration](https://dl.jami.net/docs/user/lan-only.html), [official offline/iPhone instructions](https://forum.jami.net/t/jami-survival-kit-internet-down-keep-talking/5351) |
| **Matrix with FluffyChat** | Android/iPhone clients connected to a community-hosted Matrix server; encrypted rooms support end-to-end encryption | Local operation is an architectural deployment option: host accounts, messaging, DNS and client access inside Mesh, without mandatory external identity/login services. Server stores encrypted room events/media when encryption is enabled. One homeserver is a local service dependency; federation between multiple local servers is separate work. This is not phone-to-phone serverless messaging. [Client platforms](https://fluffychat.im/faq/), [Matrix architecture](https://matrix.org/docs/technical/), [encryption](https://matrix.org/docs/matrix-concepts/end-to-end-encryption/). |

Berty's published Android store listing was updated on 30 June 2026, and its repository lists release `v2.471.14` dated 3 July 2026. This is active release evidence, not a reliability or audit endorsement. The store links resolve, but installation using the operator's actual Kenyan store accounts has not been tested. Some Berty website pages still say “released soon”; use the current repository and store listings for availability. [Releases](https://github.com/berty/berty/releases), [Android listing](https://play.google.com/store/apps/details?id=tech.berty.android).

## What our network changes

Bluetooth proximity communication and communication over the MikroTik/UniFi network are different transports. A successful Bluetooth message does not prove that an app uses the routed mesh backhaul.

The current open **Mesh** customer VLAN deliberately isolates unpaid clients, permits the existing board endpoint, and blocks general internet. Neither candidate is automatically enabled by joining it. Discovery packets such as mDNS or local broadcasts do not ordinarily cross the routed `10.20.0.0/24` and `10.21.0.0/24` boundaries. That is an inference from our topology and the apps' documented discovery methods; actual transport selection must be observed.

For a future Berty pilot, distinguish same-AP discovery, Bluetooth delivery, routed Wi-Fi delivery, and delivery with the app backgrounded. Do not disable all guest or management isolation to make discovery appear to work. A separate app test network or narrowly scoped, measured service exceptions must precede unpaid customer support. Berty's daemon/CLI exists, but it has not been installed or proven as a local cross-node rendezvous here. [Berty source](https://github.com/berty/berty).

For Jami, a locally reachable OpenDHT bootstrap can give devices on separate subnets an explicit entry point instead of relying solely on local discovery. The bootstrap is not a central chat-history server. Client configuration, peer traffic and any mobile proxy dependencies still need verification. Do not assume that running a bootstrap alone solves iPhone background delivery. [Jami LAN documentation](https://dl.jami.net/docs/user/lan-only.html).

## Bounded first trial

The earlier Berty procedure below remains a candidate evaluation. For the current
Jami milestone: install both apps using normal internet, exchange Jami IDs,
configure local discovery/bootstrap and a controlled peer-access policy, then
disconnect WAN with cellular off and exchange one foreground text each way.
Across-node routing and background behavior follow only after that result.

The operator confirms an Android phone is available alongside the iPhone. Its model and OS version are still to record.

1. Install Berty on one Android phone and the iPhone while normal internet is available. Record versions and exchange contact invitations; use nonsensitive trial messages.
2. On a controlled app test network, keep both apps foregrounded and test one message in each direction with cellular off and WAN disconnected.
3. Repeat with Bluetooth disabled while keeping Wi-Fi on. This distinguishes actual local-network support from proximity-radio success.
4. Place clients at different mesh nodes. If this fails after same-network success, inspect discovery/rendezvous and transport traffic before changing policy.
5. Background and reopen the iPhone app once. Record whether delivery resumes, whether any messages are missing and whether background delivery is possible without WAN.

Acceptance: bidirectional local Wi-Fi messages, a documented result across nodes, and an honest foreground/background limit. Stop after this small matrix and choose the supported service policy; there is no need to repeat board or media proofs.

The initial research itself did not install an app or bootstrap; the later Jami
pilot and local discovery services are documented above. No new customer
exception was added for Jami. The captive remains welcome, Bitcoin/Afribit identity
and internet purchase; native app onboarding belongs in a separate service experience.
