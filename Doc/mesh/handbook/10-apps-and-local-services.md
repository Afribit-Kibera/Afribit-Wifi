# Mesh apps, education and offline services

**Audience:** Community and product leads, network operators, service owners,
support, educators and app researchers  
**Document owner:** Community apps and services owner role (individual not yet
recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Capability and evidence guide based on dated home-lab records. App
availability, endpoint policy, local-host state, licensing and phone behavior
must be rechecked before customer-facing use. This is not approval to add
firewall rules, distribute an app, host community data or promise continuous
offline service.

> **Two different meanings of “free” and “offline”:** Signal, Blink and the
> learning-site trial are selected internet destinations that do not require a
> Mesh internet pass, but still require WAN and the external service. Jami and
> Berty have bounded foreground messaging evidence on a local lab network with
> WAN absent. Local Nostr/Blossom experiments are separate hosted services.
> None of these facts means all features work, all downloads are free, or
> community services are currently running.

## Contents

- [1. Purpose and service categories](#1-purpose-and-service-categories)
- [2. Evidence and support matrix](#2-evidence-and-support-matrix)
- [3. Free internet exceptions: Signal and Blink](#3-free-internet-exceptions-signal-and-blink)
- [4. Learning and educational resources](#4-learning-and-educational-resources)
- [5. Communication without WAN](#5-communication-without-wan)
- [6. Local web, relay and media services](#6-local-web-relay-and-media-services)
- [7. App installation and onboarding](#7-app-installation-and-onboarding)
- [8. Hosting, discovery, data and moderation](#8-hosting-discovery-data-and-moderation)
- [9. Phone, node and transport roles](#9-phone-node-and-transport-roles)
- [10. Optional LoRa direction](#10-optional-lora-direction)
- [11. Acceptance and change procedures](#11-acceptance-and-change-procedures)
- [12. Decisions before community support](#12-decisions-before-community-support)
- [13. Source records](#13-source-records)

## 1. Purpose and service categories

Mesh can carry several kinds of app and community service. They have different
network paths, owners, privacy properties and failure modes. Describe each
service in its own terms; “the Mesh app,” “free internet” and “offline mode”
are not sufficient descriptions of what works.

### 1.1 Service taxonomy

| Category | What it means | WAN needed? | What must be true |
| --- | --- | --- | --- |
| Router-local service | Static welcome, purchase/status entry or other content served by the site gateway | No for the local page itself | Router/AP powered, client associated, local address and policy correct |
| Local hosted service | App, relay, media or messaging service on a community computer/server | Not necessarily | Host powered, local route/discovery/client support, storage and service dependencies working |
| Free external-app exception | Specific internet destinations are reachable without a Mesh pass | Yes | WAN plus correct app/service version, provider dependencies and narrowly commissioned policy |
| Free learning-site exception | Named educational websites or a publisher resource are reachable without a pass | Yes | WAN, approved destination scope, publisher/site available and policy accepted on the target network |
| Paid general internet | Time/data/service entitlement granted by purchase or voucher | Yes for upstream internet | Valid entitlement, payment/settlement where applicable, gateway acknowledgment, capacity and ISP |
| Store/download access | Installing/updating apps or fetching distribution assets | Usually yes | Store/account/CDN dependencies; not implied by allowing an app's runtime endpoints |
| Optional low-bandwidth radio | Separate LoRa-based messaging/telemetry using compatible radios | No public WAN required for radio traffic | Compatible radios, legal configuration, coverage, power and separate service/client design |

A captive welcome page is an entry point, not a substitute for native apps.
The phone operating system controls when captive windows appear and close.
Customers may need to open a native app after dismissing the welcome or
reopening the local portal. Do not promise that the captive mini-browser remains
open over another app or that an external redirect can safely dismiss it.

### 1.2 Claim language

Use statements bounded by the actual acceptance:

- **“Free on Mesh”** means no Mesh internet pass was required for the named,
  tested feature and destination at the stated site/revision. It does not mean
  the app is offline, all its features are covered, downloads are free, or the
  app/provider is owned by Afribit.
- **“Works without WAN”** requires the public WAN to be disconnected, cellular
  data disabled, and a fresh message/result observed by the receiving device.
  A running local process, cached page or sent-message checkmark is not enough.
- **“Local service”** identifies where the service endpoint is hosted; it does
  not establish private communication, end-to-end encryption, continuous
  availability, retention, moderation or recovery.
- **“Mesh network”** does not imply that an app automatically discovers peers
  across routed nodes, uses a radio mesh protocol, or continues through loss of
  a router.
- State platform, app/service version, network/site, feature, test conditions,
  result and limitations. A result on one phone/version is not universal.

## 2. Evidence and support matrix

The entries below preserve the scope of the dated records. Network rules and
host state can change; verify before relying on them.

| Service/capability | Network and acceptance recorded | What is not established | Current classification |
| --- | --- | --- | --- |
| Signal text | Existing Android and iPhone apps; bidirectional foreground messages accepted on unpaid Primary Mesh; unrelated general browsing remained blocked; cellular disabled | Offline Signal, calls, media, registration, background/locked-screen delivery, all OS/app versions, strict app-only IP isolation or field/IPv6 policy | Free external internet exception, not offline |
| Blink wallet refresh | Existing signed-in custodial Blink wallet refreshed on unpaid Primary Mesh with cellular off; no financial transaction requested | Offline wallet, installation/new login, sends, self-custodial Spark, all phone versions, every feature or successful push on unpaid Mesh | Narrow free external internet exception |
| Free learning destinations | Welcome cards and local images; bounded guest IPv4 TCP 443 destination policy on Primary; publisher PDF origin allowed | Full physical PDF loading on unpaid phone (still recorded pending), every linked domain/CDN/video, app-store downloads, strict hostname isolation or field IPv6 | Home trial; WAN required for external pages/PDF |
| Jami foreground text/call | Fresh bidirectional foreground texts accepted on protected lab with WAN and cellular absent after configuring local OpenDHT bootstrap; calls later reported working | Screen-off delivery (both phones failed), locked incoming-call details, open guest Mesh policy, independently confirmed across-node phone test | Bounded local offline foreground trial |
| Berty foreground text | Android and iPhone paired; fresh messages arrived both ways on lab Wi-Fi with WAN/cellular absent; Wi-Fi disabled caused delivery to stop even with Bluetooth enabled | Bluetooth-off Wi-Fi-only result, routed cross-node result, locked-screen/background behavior, production security suitability or customer firewall exception | Bounded cross-platform local foreground trial |
| Nostr board and relays | Two lab-hosted relays/boards; signed posts accepted, verified and retrieved; bounded automatic signed-post catch-up recorded for lab text posts | Private messaging, membership, production TLS, durable identity recovery, media synchronization, moderation, unrestricted capacity or continuous current availability | Optional public-post lab experiment |
| Blossom object storage | Two lab servers accepted signed sample upload and exact-hash retrieval; copies on both after explicit copy | Automatic replication, backup guarantee, per-resident quota, privacy/authorization for community data, production TLS or current post-pause availability | Optional media-storage lab experiment |
| Local Jami/Berty/Nostr/Blossom hosts | Local pause record on 14 October says selected tasks/containers were disabled/stopped | Current state of remote services; permission or intention to resume local experiments | Treat local lab experiments as paused unless freshly verified |
| LoRa/Meshtastic | Architecture and regulatory research only; no LoRa transceiver installed on current routers/APs | Any deployed radio network, local coverage, range, message delivery/capacity, compatible phone access or regulatory clearance of a proposed setup | Optional research direction only |

The complete source material is linked in [Source records](#13-source-records).
If a later trial changes an outcome, add a new dated record and revise this
matrix; do not silently overwrite a previously bounded result.

### 2.1 Service prerequisites are independent

An app may depend on multiple layers:

1. **Installation and update:** app store, publisher download, account and
   large distribution assets.
2. **Account and setup:** registration, verification, CAPTCHA, pairing,
   contact exchange, permissions and device integrity attestation.
3. **Foreground feature:** API, messaging service, relay, server or peer path.
4. **Background behavior:** mobile OS scheduling, push provider, app extension,
   app entitlement and suitable network path.
5. **Offline/local behavior:** locally reachable endpoint or peer discovery,
   local data and a service host that remains powered.
6. **Recovery:** host startup, saved data, credentials/keys, replica discovery,
   backup, update and an operator able to restore it.

Passing one layer does not accept the others. Keep onboarding and network policy
truthful about where normal internet, a Mesh pass, local Wi-Fi or an operator
is required.

## 3. Free internet exceptions: Signal and Blink

These are normal apps reaching selected external services over the Mesh WAN.
Their data still traverses an ISP and remote application infrastructure. They
are not internet-independent community services.

### 3.1 Signal: accepted foreground text scope

The home trial records existing Signal apps on an Android phone and an iPhone
sending and receiving foreground text messages while joined to unpaid Mesh,
with cellular data disabled and unrelated browsing blocked. The installed
policy uses scoped TCP 443 destinations, now part of the single `KM-MESH-FREE`
list ([Free on Mesh](../mesh-free-access.md)). No broad UDP exception or paid session was required for the recorded
text test.

The policy must be treated as a destination exception, not cryptographic
identification of Signal. CDN and destination IPs can be shared with unrelated
HTTPS services. The router does not inspect/decrypt message content, and an IP
allowance cannot prove every packet belongs to a named app.

The trial does not establish Signal registration, downloads, calls, media,
background notifications, iOS locked-screen delivery or WAN-independent
messaging. Test those separately before advertising them. Do not expand the
rule to all Signal-documented ports/services without a scoped test and owner
approval. The [Signal trial](../mesh-free-access.md#signal) documents the
installed router-rule evidence, failed initial attempt, later endpoint
correction and final operator acceptance.

### 3.2 Blink: existing-account custodial refresh

The accepted Blink result is a signed-in custodial account refreshing its
balance/history on unpaid Mesh with cellular data off. The small home policy
allows the recorded API and secure WebSocket hosts (`api.blink.sv` and
`ws.blink.sv`) over TCP 443 on the identified lab gateway. No payment, invoice
generation or transfer was part of that check.

Do not call this “offline Bitcoin,” “free Lightning,” “all Blink features
available,” or proof of app installation/login. External wallet operations,
App Store/Google Play, Firebase AppCheck, authentication/CAPTCHA, push,
self-custodial Spark/Breez, Lightning-address services and third-party payment
features are separate dependencies. Some endpoints may share IP hosting, so
the allowance is not strict app identity enforcement.

The operator reported that a notification arrived only after switching to paid
mobile data. A separately commissioned Apple push policy is recorded, but
physical locked-screen acceptance remains pending; Android push was not
commissioned in that trial. Shared OS push endpoints can deliver notifications
for other apps as well and still depend on WAN. See the [Blink scope](../mesh-free-access.md#blink)
and [mobile push trial](../mesh-mobile-push-trial.md).

**Customer-facing wording:** “Some signed-in Blink functions were tested without
a Mesh internet pass while the gateway still had internet. Payments, downloads,
new sign-in and notifications are not covered by that test.”

### 3.3 Exception ownership and validation

Before a free external exception is enabled for a customer site, the operator
must record:

- named product/service owner and exact app feature;
- approved hostname/port/direction and reason;
- gateway/site identity, guest scope and configuration revision;
- DNS resolution/refresh method, shared-IP caveat and expiry/review date;
- independent test that the intended feature works without a pass;
- negative test showing unrelated general internet remains restricted;
- effect on IPv6, QUIC, captive detection, NAT and existing access expiry;
- rollback markers and owner; and
- customer text that distinguishes no-pass use from offline operation.

No allowance in a planning document is live policy. Use an identity-guarded
commissioning procedure and readback for the target router; do not copy Primary
lab rules directly to another site.

## 4. Learning and educational resources

### 4.1 Current learning entry

The Primary home-pilot welcome presents four learning/community cards:

| Card/resource | Recorded destination | Network/content note |
| --- | --- | --- |
| Bitcoin Diploma | My First Bitcoin 2025 English Student Workbook PDF at `bitcoinekasi.com` | Publisher-hosted 176-page, approximately 23 MB PDF; original is linked, not republished as Afribit content |
| Bitcoin Kenya | `bitcoin.co.ke` | External site; its current availability and exact learning scope must be reviewed before promotion |
| Afribit | `afribit.africa` | Afribit community information, subject to current site/content review |
| Insats | `insats.org` | External site; its current availability and exact learning scope must be reviewed before promotion |

The home trial locally serves the welcome imagery and selected official app
logos. The images do not make the destination pages local. The Diploma cover
thumbnail preserves the publisher's identity; inspected workbook bytes were
not uploaded to the router or included in the web deployment. Visitors may
follow the original publisher link and save the PDF to their own device for
later offline reading. Loading and saving the full PDF on an unpaid physical
phone remained a separate acceptance item in the evidence.

Community photographs are illustrations, not evidence that the depicted
organization or people endorse each linked resource. The existing art-direction
record documents photo provenance and the asset-preparation approach.

### 4.2 Learning policy and limits

The checked home policy allows a bounded set of guest IPv4 TCP 443 destinations
without creating a paid grant or general internet bypass. The operator must
recheck the actual commissioned list, DNS answers and packet path before use.
Destination-IP rules can also permit unrelated TLS hostnames on shared
infrastructure. Field IPv6 enforcement and strict domain identity are not
established by the home trial.

Do not imply these are free or local merely because a card appears in the
welcome:

- linked sites not explicitly included in the approved policy;
- external video, image, analytics, CDN or document hosts;
- app stores and operating-system download services;
- account registration, sign-in mail/SMS or CAPTCHA dependencies;
- publisher content copied into a local cache; or
- a page that works only because a paid session or cellular data is active.

Before adding or removing a learning destination, verify the specific content,
publisher identity, privacy/security implications, current domain and redirect
chain, shared hosting, external media/CDN, accessibility, language and review
date. Keep the allowance narrow. A site being educational does not automatically
make every resource on its domain safe, current, licensed for redistribution
or suitable for children.

### 4.3 Content rights, accessibility and offline reading

Linking to a publisher-hosted resource is different from downloading, caching,
translating, adapting, printing or redistributing it. Before any of those
actions, verify the applicable license/permission, attribution requirements,
version, source URL and update/removal process with the rights/content owner.
Do not remove publisher marks, rebrand third-party material as Mesh/Afribit
authored, or infer permission from a public URL.

For Mesh-authored learning cards or instructions, identify an author/reviewer,
date/version, intended audience and correction contact. Use readable mobile
layout, descriptive labels, sufficient contrast, low-bandwidth images and
alternatives for important visual information. Do not make a large PDF the only
way to reach a lesson. Test the page and resource on low-end phones and the
actual unpaid gateway path.

If offline reading is a goal, distinguish:

1. **User-saved copy:** the visitor downloads the publisher's original file
   using ordinary internet and opens the saved file later.
2. **Operator-hosted copy:** Mesh stores/serves a copy, requiring explicit
   redistribution/cache rights, content versioning, storage, update and
   takedown ownership.
3. **Locally authored guide:** Afribit/Mesh creates the text/art, with
   contributor and asset provenance recorded.

Only the first is described by the current Diploma card. No local publisher PDF
cache or independently approved offline curriculum is established here.

## 5. Communication without WAN

“Without WAN” means the phones retain local Wi-Fi connectivity while the
internet uplink is demonstrably unavailable and cellular fallback is disabled.
The result must be verified on the recipient, not inferred from the sender
queue, a running bootstrap, Bluetooth proximity or cached conversation.

### 5.1 Jami: local foreground trial

The operator accepted bidirectional fresh foreground texts on the protected
`KiberaMesh-Lab` Wi-Fi with Primary WAN disconnected and cellular data off.
Calls were later reported working, but their direction, media type and
locked-call behavior were not separately recorded. The trial configured a
local OpenDHT bootstrap at `10.20.0.10:4222`; protected-lab UDP reachability was
tested.

Both iPhone and Android failed to receive messages with their screens off in
the installed configuration. This is a functional usability limit, not a
router tuning issue the current evidence has resolved. The trial did not
establish cross-node phone delivery or an exception on the open customer Mesh
SSID. The local DHT processes are not a chat-history server or a push system.

The local bootstrap and its front doors were part of the computer-local lab
that the 14 October pause record says was stopped. Treat the Jami host as
unavailable until its owner verifies it and explicitly resumes the selected
experiment. Do not start it as part of routine service or while it would
conflict with another local process.

**Supported statement:** “Foreground Jami texts were tested locally with WAN
off on protected lab Wi-Fi. Screen-off delivery failed on both tested phones.”
Do not describe it as an always-reachable offline messenger.

### 5.2 Berty: cross-platform foreground trial

The operator confirmed Berty opened on Android and iPhone, paired contacts and
delivered fresh foreground messages both ways on lab Wi-Fi with WAN and
cellular data absent. When Wi-Fi was disabled on both devices, delivery stopped
even with Bluetooth left on. That supports local Wi-Fi use in the tested
configuration, not Bluetooth-only delivery.

The Wi-Fi-only/Bluetooth-disabled test, separate-node/cross-routed delivery and
locked-screen behavior remain unverified. No customer firewall exception,
daemon, paid pass or account migration was installed for Berty. The project
source warns that the app is under development and not hardened for sensitive
use; use nonsensitive test messages and do not recommend it for confidential
or safety-critical communications based on this trial.

**Supported statement:** “A bounded Android/iPhone foreground Berty test
delivered messages over local lab Wi-Fi without WAN. Cross-node, Bluetooth-off
and background behavior are unverified; this is not a supported sensitive-use
service.”

### 5.3 Mobile background delivery

Mobile background behavior depends on platform lifecycle, app implementation,
permissions, push infrastructure and a reachable service. A router exception
cannot add an app entitlement or prevent the operating system from suspending
an app.

The recorded Apple Local Push Connectivity path requires app integration and
an Apple-granted `app-push-provider` entitlement. It is not enabled in stock
Jami by changing router rules. The separate home push trial commissioned a
narrow IPv4 APNs path for one iPhone, but physical locked-screen delivery
remained pending. APNs/FCM are shared OS notification services, not
app-specific permissions, and require internet; they do not solve offline
alerts.

Before offering background messaging/calls, test a named app build and OS,
screen-off delivery, notification permission, locked-call behavior, WAN/push
dependencies, host restart and recovery. If no safe non-financial test
notification exists, leave the result pending rather than sending funds or
inventing a successful push.

### 5.4 Distinguish transport paths

| Observed path | What it proves | What it does not prove |
| --- | --- | --- |
| Bluetooth/proximity radio | Nearby devices exchanged data over that radio in the test | Routed Wi-Fi, cross-site path, internet or background delivery |
| Same-AP Wi-Fi | Clients exchanged/reached a service on that access network | Routing across nodes, guest policy safety or independent service recovery |
| Local bootstrap/server | The configured local endpoint is reachable | Message content is stored there, peers are discoverable across all networks, or host is highly available |
| Routed Wi-Fi across nodes | The named clients reached each other/service over measured routed paths | Arbitrary multi-hop discovery, WAN independence unless tested, router-loss resilience |
| External app endpoint | Named app feature used WAN through a bounded exception | Offline service, all app features, app-only isolation or strict identity |
| Push provider | Notification path through OS/provider was accepted for a test | Offline delivery or app-specific privacy from shared push infrastructure |

For all tests, record phone models/OS/app versions, Wi-Fi node/subnet, radio
states, WAN/cellular state, app foreground/background state, exact recipient
observation and whether the message was fresh. Do not weaken guest or
management isolation globally to make local discovery work.

## 6. Local web, relay and media services

These experiments demonstrate service patterns, not an approved customer
communications or durable-content product. Their processes and hosts have
separate lifecycle, privacy, storage and operating requirements.

### 6.1 Router-local welcome and learning entry

The router serves static Mesh welcome/purchase assets locally. This can make
the entry page reachable without WAN while the router/AP are powered and the
client remains associated. Checkout, external websites/PDF and external app
services still need their dependencies and WAN.

The phone OS owns captive-window behavior. A local page is a manually
reopenable entry point; it cannot force a captive window to stay open over a
native app or safely redirect arbitrary encrypted traffic. Use the persistent
portal/customer instructions in [Volume 09](09-operations.md) and the router
acceptance process in [Volume 02](02-field-deployment.md).

### 6.2 Nostr board and relay experiment

Two independently hosted lab relays and boards were recorded, with signed
events persisted in separate SQLite volumes and bounded catch-up for lab text
posts. A sample post was independently queried and signature-verified after
relay restart. This demonstrates bounded event storage/retrieval and
reconciliation for that lab scope.

It is not a private messenger, local social network ready for public use, or
durability guarantee. The board's disposable key can be lost with browser
session storage; posts are public; HTTP/WebSocket transport in the lab is
unencrypted; there is no established community membership/moderation, complete
identity recovery, quota or production capacity policy. Relay replication is
bounded and does not automatically synchronize media or deletion policy.

The October lab pause says selected local relay containers/tasks were stopped.
The current state of either computer-local service is unknown until verified.
Do not describe the two recorded hosts as currently available based solely on
their October deployment evidence.

### 6.3 Blossom media-storage experiment

Two lab servers running the same upstream Blossom implementation accepted an
authorized sample upload and returned the same verified bytes/hash. A separate
explicit copy process uploaded the verified object to the second server. This
is evidence for a bounded upload/retrieval/copy exercise, not automatic
replication.

In the recorded configuration, reads are available to reachable lab clients,
HTTP is used on the isolated lab, and there is no established production
TLS, private gallery, per-resident quota, durable backup, moderation process,
replica-aware reader or background reconciliation for all uploads. A content
hash is not encryption or a secret. Do not upload personal/community media
until access, consent, retention, deletion, abuse, storage and recovery
ownership are approved.

The October lab pause also stopped the selected local Blossom containers and
tasks. Current service availability must be checked by the owner. A previously
verified restart on one host without internet after Windows login did not prove
pre-login startup or recovery after a whole-network power outage.

### 6.4 Nostr events versus media bytes

Nostr relays store/serve signed events under their configured policy. Blossom
servers store/serve content-addressed blobs. An event containing a media URL
does not copy the media to a local server, guarantee that it remains available
or ensure a reachable replica. Conversely, storing a blob does not automatically
publish a Nostr reference or synchronize deletion/permissions.

An eventual community media workflow needs explicit:

- uploader identity/authorization and consent;
- size/type limits, quotas and rate/resource controls;
- content visibility and moderation/takedown responsibility;
- verification of hash, byte length and metadata;
- replica count/location and copy/retry behavior;
- user-facing locations and fallback discovery;
- retention, deletion and backup semantics; and
- recovery and ownership of encryption keys if private content is supported.

Do not present “two servers” or “replication” as durable availability unless
automatic copying, verification, independent failure domains, storage headroom
and restore have been tested.

## 7. App installation and onboarding

### 7.1 Installation is separate from runtime access

The Signal/Blink free-access policies concern selected runtime destinations.
They do not permit App Store, Google Play, publisher download sites, all
registration services or app updates. A device may need normal internet or a
valid paid pass before joining Mesh to install/update an app.

The reviewed records conclude that unmanaged visitor phones cannot reliably be
limited to downloading only a few named Play Store apps using router
domain/IP allowlists: store APIs, accounts and assets use shared infrastructure.
Managed Google Play requires enrolled/managed devices, which joining Mesh does
not do.

Possible onboarding approaches are decisions, not current commitments:

1. **Install beforehand or use paid access.** Simplest operational model; state
   download costs/requirements clearly.
2. **Bounded installation allowance.** Time/data-limited access may still carry
   unrelated traffic and cannot guarantee package-only access.
3. **Local publisher-approved Android packages.** Requires explicit
   redistribution permission where needed, verification of publisher signature
   and version, secure hosting, update/withdrawal policy and support. Keep
   large packages off router flash.
4. **iOS distribution.** App Store installation remains an internet path in
   the reviewed setup. No local iOS distribution/onboarding service is
   commissioned.

Do not serve modified/repacked applications or imply publisher endorsement.
Never ask residents to disable device security protections or install an
unverified APK to make a Mesh trial work.

### 7.2 Onboarding checklist

Before recommending an app, the service owner should document:

- supported app name and exact publisher; verified current store/source link;
- platform and minimum tested OS/app version;
- what users should install before joining and whether an account is needed;
- permissions and contact/pairing setup, described without collecting
  credentials or private keys;
- tested feature and network condition (pass/no pass, WAN, cellular,
  foreground/background);
- which setup or app functions remain internet-dependent;
- data/identity handling, safety limitations and a non-sensitive test method;
- where to report issues and how to uninstall/stop a trial; and
- mark/logo attribution and license/brand review for any reproduced assets.

Test the onboarding text with a person unfamiliar with Mesh. It should not
promise that a connected phone becomes a network router, that a wallet
transaction is free, or that a background notification works because the app
icon is shown on the portal.

### 7.3 Independent brands, data and support

Signal, Blink, Jami, Berty, Nostr, Blossom and other third-party names/logos
identify independent projects/services. Displaying a mark does not imply
Afribit ownership, partnership, endorsement, support, custody or responsibility
for the provider. Keep publisher identity and appropriate attribution visible.

Do not collect app passwords, wallet recovery phrases, private identity keys,
message content or payment PINs as part of support. Diagnostics should prefer
version, feature, time, sanitized error and aggregate/metadata-only network
evidence. Follow the retention and access boundaries in [Volume 08](08-security-and-privacy.md).

## 8. Hosting, discovery, data and moderation

### 8.1 Service ownership and dependency card

Every locally hosted service needs an owner and an operating card before it is
advertised to residents:

| Field | Required record |
| --- | --- |
| Service and purpose | Plain-language function; what it is not intended to do |
| Accountable owner | Primary and backup person/role, support contact and authority to pause |
| Host/dependencies | Host ID/location, runtime/version, power, network, DNS/address, storage and upstream dependencies |
| User scope | Guest, protected lab, staff or named group; authentication and authorization |
| Data | Content categories, sensitivity, consent, encryption, retention, deletion and export |
| Limits | Upload/object/message sizes, quotas, concurrency, rate limits and disk thresholds |
| Startup/recovery | Tested start after reboot/login, failure recovery, backup/restore and out-of-band access |
| Update/retirement | Maintained source/image, security updates, compatibility, notice and data disposition |
| Acceptance | Versions, client matrix, WAN/radio state, objective result and review/expiry date |

Use the [Volume 09](09-operations.md) inventory and backup/change procedures.
Optional does not mean ownerless: an unmaintained local service can expose data,
consume disk or mislead customers about availability.

### 8.2 Discovery and routed networks

Service discovery mechanisms have network scope. mDNS and local broadcasts
generally do not cross routed subnet boundaries unless a deliberate relay or
application-level discovery mechanism is configured. A successful same-AP test
does not prove clients at another node can find a peer.

For a service spanning nodes, prove each step:

1. the site routes to the host address;
2. the service binds/listens only on intended interfaces;
3. firewalls permit the exact client-to-service path and deny management paths;
4. the client is configured to use that host or a tested discovery method;
5. identity/authentication and server certificate behavior are correct;
6. a fresh user-level operation works across nodes; and
7. host/path failure and reconnection produce the documented behavior.

Do not solve discovery failure by disabling client isolation or exposing
management ports globally.

### 8.3 Content and moderation

Before admitting community posts, files or messages to a hosted service,
decide who can publish, who can report abuse, who reviews/removes material,
how decisions are appealed, how unlawful or harmful content is escalated, and
what data is retained. Provide clear boundaries to users. Do not imply private
or encrypted communication when a service stores public posts or serves
unauthenticated files.

The current Nostr/Blossom lab findings are demonstrations, not a moderation
policy. Publicly writable posting, public media reads, small sample limits or
signed uploads do not substitute for community governance, account recovery,
abuse response or privacy review.

### 8.4 Availability and data durability

Availability depends on host, power, network, software, storage, backup and
operator response. Two processes on one computer share important failure
domains. Two hosts may still share the same power, access network, credentials
or site. A persistent container volume protects against some process restarts,
not disk loss, accidental deletion or site loss.

Use precise terms:

- **persistent storage:** data survived the specific tested process/container
  restart;
- **second copy:** an operator verified a separate copy at a second endpoint;
- **replication:** a defined automated process copies updates and verifies
  them under documented consistency/error rules;
- **backup:** a separately recoverable point-in-time copy with retention and
  restore procedure; and
- **high availability:** service meets an agreed availability objective under
  specified failures, demonstrated by evidence.

These terms are not interchangeable. The October evidence includes persistence
after relay-container restart and a manually/explicitly verified Blossom copy;
it does not establish full backup, automatic media replication or high
availability. The later local pause means current lab runtime status must be
verified.

## 9. Phone, node and transport roles

Residents can use existing phones as Wi-Fi clients. Running an app, signing a
post, or caching content on a phone does not make that phone an infrastructure
router or always-on service host.

| Role | Responsibility | Operational implication |
| --- | --- | --- |
| Participant/client | Read/send messages, browse lessons, use external apps or select content | Battery/OS lifecycle, client version, account and permissions affect experience |
| Temporary peer/cache | Share data while the app and device are available | Availability may end when app is suspended, device moves or user opts out |
| Access point | Provides nearby Wi-Fi association | Requires power, radio planning, isolation and a managed uplink |
| Routing node | Carries IP traffic between assigned networks/sites | Requires routing identity, address plan, policy and failure testing |
| Service node | Runs relay, web, messaging or other application | Requires maintained host, storage, monitoring, backup and service owner |
| Storage node | Retains and serves selected data | Requires quota, consent, retention, integrity, deletion and recovery policy |
| LoRa participant/node | Sends/relays compatible low-bandwidth radio data | Requires radio-compatible hardware and protocol; ordinary phone Wi-Fi does not supply LoRa |

The reviewed architecture assigns routing to the MikroTik devices, access to
UniFi APs, and application/storage roles to powered computers/hosts. A flash
drive or SSD alone is storage media, not an executing node. A phone should not
be represented as an always-on relay/storage anchor, particularly on iOS where
ordinary apps may be suspended in the background.

Community hardware purchases are not approved by this chapter. Use observed
workload, uptime, storage, power and maintainability requirements before
selecting a mini-PC, Pi, enclosure, SSD or backup-power kit.

## 10. Optional LoRa direction

LoRa is a separate, optional low-bandwidth radio direction. No LoRa
transceiver is recorded as installed in the current MikroTik routers or UniFi
APs. Their IP routing does not convert Wi-Fi/Ethernet or the protected radio
transit into Meshtastic or LoRaWAN.

Keep these concepts distinct:

| Technology/path | Role | Does not imply |
| --- | --- | --- |
| Existing Wi-Fi/Ethernet/routed radio | Carries IP traffic and supports ordinary phone apps over Wi-Fi | LoRa coverage or automatic discovery/replication |
| Meshtastic | Separate LoRa-radio mesh for short messages/limited telemetry with compatible radios | Ordinary phone web access over LoRa or automatic Signal/Jami interoperation |
| LoRaWAN | LoRa end devices and gateways connected to a network server in a star-of-stars architecture | Meshtastic peer behavior or an internet-free deployment by default |
| MQTT bridge | Can connect a compatible radio system to a broker over IP | Conversion of the existing router/AP radio into a LoRa radio |

Range, message rate, capacity, battery life and emergency availability are not
established by a radio's marketing distance or by this architecture note.
Buildings, antenna placement, interference, duty-cycle limits, topology and
traffic affect performance. A phone generally needs compatible LoRa hardware
paired or connected separately; installing an app alone does not add a LoRa
transceiver.

Before procurement or operation:

1. Define the user need and whether existing Wi-Fi/IP coverage can meet it.
2. Select the protocol, regional profile, exact radio hardware/antenna and
   gateway arrangement.
3. Verify current Communications Authority of Kenya spectrum and equipment
   requirements for that exact configuration with qualified/local authority;
   an “868 MHz” label alone is not approval.
4. Decide channel/privacy/key management, abuse handling, message retention,
   operator roles and power.
5. Test two devices for direct communication, then a third/path only if relaying
   is part of the design. Test with WAN/cellular absent and document actual
   recipient delivery.
6. Measure range and airtime on the intended route/site and repeat with
   realistic message rate/load.
7. Keep any LoRa trial separate from customer IP, payment and emergency-service
   claims until reviewed and accepted.

The current LoRa document is research/direction, not a deployment plan or
regulatory opinion. Do not advertise an emergency alert service based on a
small radio delivery demonstration.

## 11. Acceptance and change procedures

### 11.1 New free-internet app exception

1. Name the product/service owner and feature. Confirm the app is installed and
   signed in before the test unless setup itself is the approved scope.
2. Define the exact gateway, phone OS/app version, policy scope, cellular/WAN
   conditions, expected destinations and negative control.
3. Review provider/app endpoint documentation and shared-IP/third-party
   dependencies. Do not open broad store/CDN/Google/Apple ranges to make a
   failed test appear successful.
4. Obtain site/network change authorization and prepare a narrowly owned,
   identity-guarded reversible policy.
5. Confirm no paid session is active; test the exact feature on unpaid Mesh
   with cellular disabled and the WAN state recorded.
6. Verify an unrelated destination that should remain restricted, local
   management isolation, return path and expiry behavior.
7. Read back the installed rule scope and preserve the pre-change configuration.
8. Record success only from the user-visible feature result; otherwise state
   which dependency failed and remove/revise only under the approved change.
9. Set an owner and review/expiry date. Recheck on DNS, app, router, IPv6 or
   topology changes.

### 11.2 Local offline-app test

1. Use a protected test network and consenting devices, nonsensitive messages,
   named app/OS versions and an identified service owner.
2. Install/pair on normal internet if required; record setup separately from
   offline operation.
3. Disable cellular and verify the public WAN is unavailable. Preserve local
   Wi-Fi and the intended local service path.
4. Send a fresh message each way; verify it on each recipient. Record
   foreground/background, Bluetooth state, node/subnet and service host.
5. Repeat only the next distinct question: Bluetooth disabled, cross-node,
   screen-off, host restart or recovery. Do not bundle different claims into
   one “offline works” result.
6. Restore the WAN/test environment and verify no customer/management policy
   was weakened. Stop the service if the test was temporary.

### 11.3 Local content/storage service

Before an upload or community trial, require service owner approval, participant
consent, content scope, authorization, size/quota/rate controls, access model,
retention/deletion, moderation contact, backup/restore, host/power monitoring
and an acceptance test. Use synthetic sample content first. Verify exact bytes
or signatures where applicable; never treat hash verification as privacy.

### 11.4 Evidence template

| Field | Record |
| --- | --- |
| Test ID, date and timezone | |
| Service/app and purpose | |
| Site, gateway and host IDs | |
| Client model/OS/app version | |
| Policy/configuration and release revision | |
| WAN / cellular / Wi-Fi / Bluetooth state | |
| App foreground/background state | |
| Feature and destination/path under test | |
| Expected result and negative control | |
| Recipient/user-visible result | |
| Logs/counters/evidence location (private if needed) | |
| Limitations, failures and stop condition | |
| Operator, approver and next review date | |

## 12. Decisions before community support

Do not list an app/service as a supported community offering until the
accountable owners resolve:

| Decision | Required outcome |
| --- | --- |
| Free-service catalogue | Named owner, exact feature, current endpoint policy, supported site(s), review/expiry date and plain-language limitation |
| Learning content | Editorial owner, publisher/rights review, attribution, accessibility, language, updates and whether copies are linked or locally hosted |
| App onboarding | Supported OS/app versions, normal-internet setup path, permissions, support boundaries and update process |
| Offline messaging | Chosen app/protocol, foreground/background promise, WAN independence, cross-node evidence, identity recovery and abuse/support model |
| Push notifications | Whether only shared WAN push is offered or an offline app integration is developed; entitlements and privacy reviewed |
| Local relay/media | Owner, access control, moderation, quota, backup/restore, retention/deletion and service-status reporting |
| Host operation | Power/network location, unattended startup, patching, disk/headroom, physical custody and out-of-band recovery |
| LoRa | Demonstrated need, exact lawful equipment/profile, ownership, security/privacy, coverage/capacity evidence and service disclaimer |
| Public claims | Product/legal/security review of names, marks, rights, limitations and any claim about offline/private/secure/available behavior |

The current evidence supports small, accurately labelled demonstrations and
bounded access exceptions. It does not yet establish a general offline
communications product, a private social network, durable community media
storage, a field-ready app catalogue, LoRa deployment or emergency service.
For the ownership, funding, expansion and community decisions needed before
these services grow beyond bounded trials, see
[Volume 11](11-scale-and-governance.md).

## 13. Source records

| Topic | Source |
| --- | --- |
| Project evidence and handbook map | [Volume 00](00-start-here.md); [documentation plan](../mesh-documentation-plan-and-toc.md) |
| Product promise and service categories | [Volume 01](01-product-and-service.md); [administration](03-administration.md) |
| Router-local portal and field acceptance | [Volume 02](02-field-deployment.md); [production operations](../mesh-production-operations.md) |
| Security/privacy, logging and credentials | [Volume 08](08-security-and-privacy.md) |
| Host lifecycle, backup and incident procedures | [Volume 09](09-operations.md); [local lab pause](../mesh-local-lab-pause-2026-10-14.md) |
| Expansion, site authority and community decisions | [Volume 11](11-scale-and-governance.md) |
| Signal text | [Signal trial](../mesh-free-access.md#signal); [app installation/offline notes](../mesh-app-installation-and-offline.md) |
| Blink | [Blink free-access trial](../mesh-free-access.md#blink); [mobile push trial](../mesh-mobile-push-trial.md) |
| Education cards and PDF | [Free learning entry](../mesh-free-access.md#learning-sites); [captive art direction](../mesh-captive-art-direction.md) |
| Jami and local bootstrap | [Jami trial](../mesh-jami-local-trial.md); [communication app research](../mesh-communications-app-research.md); [background delivery research](../mesh-background-delivery-options.md) |
| Berty | [Berty local trial](../mesh-berty-local-trial.md); [communication app research](../mesh-communications-app-research.md) |
| Nostr events and relays | [Nostr lab](../kibera-mesh-nostr-lab.md); [node/storage architecture](../kibera-mesh-node-and-storage-architecture.md) |
| Blossom content storage | [Blossom lab](../kibera-mesh-blossom-lab.md); [node/storage architecture](../kibera-mesh-node-and-storage-architecture.md) |
| LoRa/Meshtastic direction | [IP and LoRa direction](../mesh-ip-and-lora-direction.md); [network chapter](04-ip-network.md) |
| Customer-facing index | [Mesh documentation index](../README.md) |

These are dated source records, not a substitute for current endpoint, provider,
app-store, licensing, site and service checks. Keep private customer evidence,
credentials, keys and active account details outside this handbook.
