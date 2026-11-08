# Mesh handbook: start here and evidence register

**Audience:** Everyone working with, operating, reviewing or learning about Mesh  
**Document owner:** Mesh project maintainer / release owner (role; individual not recorded here)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Initial handbook baseline. This is a documentation index and evidence summary, not field acceptance, a customer service contract or authorization to operate equipment.

> **Current headline:** Mesh is Afribit's community-connectivity project. Its home laboratory has demonstrated a two-router IP network, a local welcome page, selected free-service paths, and a supervised paid-internet purchase and activation flow. These are bounded home/lab results. They do not establish a field deployment, a production service, multi-hop resilience, measured community coverage or a tested capacity limit. The local laptop-hosted lab experiments were paused on 14 October 2026. The 22 October field plan is preparation for a proposed supervised site, not evidence that the site has been installed or accepted.

## Contents

- [1. Purpose and how to use this page](#1-purpose-and-how-to-use-this-page)
- [2. Mesh in plain language](#2-mesh-in-plain-language)
- [3. Current state at a glance](#3-current-state-at-a-glance)
- [4. Evidence labels and how to interpret claims](#4-evidence-labels-and-how-to-interpret-claims)
- [5. Claim and evidence register](#5-claim-and-evidence-register)
- [6. What the evidence does not establish](#6-what-the-evidence-does-not-establish)
- [7. Reader paths](#7-reader-paths)
- [8. Documentation map](#8-documentation-map)
- [9. Open decisions and verification register](#9-open-decisions-and-verification-register)
- [10. Glossary](#10-glossary)
- [11. Updating this register](#11-updating-this-register)

## 1. Purpose and how to use this page

This is the entry point to the Mesh handbook. It explains the project in
non-specialist terms, points readers to the current source material, and
summarizes what the dated records do and do not prove.

Use the linked source document for detailed instructions or results. This page
is not a substitute for a field runbook, a current router configuration, a
payment reconciliation, a security assessment or an approved customer offer.
Where this page and a newer, more specific record differ, check the dates and
scope, then confirm the current state with the responsible operator before
acting. A later proposal does not automatically replace an accepted test; an
older successful test does not automatically establish that a service is still
running.

The handbook has been drafted one document at a time. This volume records the
common vocabulary and evidence boundaries used across the chapters. Volumes 00
through 12 are drafted for review. A first whitepaper narrative is available
as an internal review draft; it is not approved for public release.

### Quick reading rules

1. **Read the date and scope.** A successful test is evidence for the equipment,
   software version, location and procedure actually tested.
2. **Separate design from operation.** A diagram, target architecture, checklist
   or roadmap describes intent unless an implementation and acceptance record
   say otherwise.
3. **Separate payment from access.** A payment or settlement record is not by
   itself proof that a router granted access; a controller heartbeat is not
   proof that a customer's internet works.
4. **Separate services by dependency.** A local page may work without internet;
   an external application, online purchase or cloud controller may not.
5. **Treat unknown as unknown.** Missing measurements are not zero, and an
   unverified item is not a pass.
6. **Protect private operational material.** Do not add credentials, customer
   identifiers, payment payloads, active voucher codes, private site
   coordinates or unredacted recovery exports to this handbook.

## 2. Mesh in plain language

Mesh is a community-connectivity project intended to make internet access and
useful digital services available through shared local network equipment. A
site may provide Wi-Fi for people's phones and other devices, while routers
connect the site to an internet provider and, where designed and commissioned,
to other network sites.

In the tested home arrangement, two routers served separate Wi-Fi access
networks and exchanged routes with each other. A cable was the preferred
connection between the routers, and a radio link provided an alternate path
when that cable was removed. This demonstrates routing and a particular
two-router link failover. It is **not** a demonstration of an arbitrary
multi-hop mesh, a third routing site, wide-area Kibera coverage or a network
that can survive losing either of the two routers.

People use Mesh as a service; they are not expected to turn their phones into
network routers. Phones and laptops connect as clients to Wi-Fi access points.
Selected computers or other maintained hosts may run optional local services,
but those services have their own power, maintenance and availability
requirements.

The customer experience being prepared has two broad choices:

- **Selected free services:** specific local pages or approved application
  traffic may be available without buying a general-internet pass. Some free
  services are hosted locally and may work during an internet outage; selected
  external applications still need the internet and their own external
  services. “Free” here means no Mesh internet pass for the specifically
  allowed service; it does not mean that all internet is free.
- **Paid general internet:** a customer selects a pass, initiates an M-Pesa
  payment, and should receive access on the intended device only after the
  payment has been verified and the gateway confirms activation. The home
  records describe Bitika as the preferred payment path and Paystack with
  Bitcoin settlement as a separate fallback design. Current price, package
  terms and field availability must be confirmed before being presented as an
  offer.

Bitcoin is part of the payment and project story, but it does not make every
customer responsible for operating a wallet. In the documented Bitika path,
KES collection and Bitcoin delivery are verified steps. In the Paystack path,
KES collection and Bitcoin settlement from a funded treasury are separate
steps. Neither payment mechanism is the Wi-Fi network itself.

The brand direction in the project plan is **Mesh**, with a separate
**Powered by Afribit** attribution. “3WEST” refers to an existing site/service
context in the records, not a replacement product name. This handbook does not
make a legal determination about trademark ownership, copyright, licensing or
other rights.

## 3. Current state at a glance

### 3.1 Evidence-based summary

| Area | Status as represented by the records checked on 22 October 2026 | What a reader may safely conclude |
| --- | --- | --- |
| Project documentation | The existing Mesh records are being consolidated into a proposed handbook. This is the first handbook chapter. | Detailed source notes exist; the handbook set and public whitepaper are not complete. |
| Home IP network | Dated records document a working two-router home-lab network, route exchange and a cable-to-radio link failover test. | The described lab topology passed its documented tests. It does not prove multi-hop or field coverage. |
| Home internet gateway | Dated home tests document internet access and WAN-loss behavior on the lab equipment. | A particular home gateway configuration was exercised. It is not a field performance or availability guarantee. |
| Open Mesh welcome | Records describe an open Mesh test SSID and router-hosted welcome/catalogue experience on lab equipment. | The lab onboarding path has evidence. Current field AP behavior and all phone/OS captive-window behavior are not thereby established. |
| Paid access | Records describe a supervised KES 10 home purchase, verified Bitika delivery, native access acknowledgement and an operator-reported browsing retry. | A specific home-pilot transaction and activation flow has evidence. It does not prove current field operation, every price/provider, or general sale readiness. |
| Free external applications | The records describe foreground Signal messaging and refresh of an already-installed, signed-in Blink wallet on unpaid Mesh. | Those tested features worked in their specific conditions. They do not establish installation, every feature or reliable background/push delivery. |
| Offline communications | The records describe foreground Jami tests without WAN/cellular and a Berty Wi-Fi trial with proximity settings enabled. | There is bounded experimental evidence. Important screen-off, Bluetooth-off and cross-node behaviors remain unaccepted or failed in the documented trials. |
| Local Nostr and media | Lab notes describe relay and media-host experiments. | These are optional experiments with host dependencies, not a required or field-accepted Mesh capability. |
| Security and abuse controls | October 6 records document specific code changes, automated checks and bounded live negative tests. | Those named controls and checks have evidence. They are not an independent penetration test, certification, complete privacy review or field security signoff. |
| Local experimental services | A 14 October pause record says selected laptop tasks and local containers were stopped/disabled and local recovery information retained. | Those local experiments should be treated as paused unless an operator has since verified and authorized a restart. The pause record did not re-audit remote services. |
| Field deployment | The 22 October field plan is explicitly proposed work, not implementation or field signoff. Its assessment says the router was disconnected and site inventory, packet-path behavior, capacity and current provider credentials were not verified by that planning task. | No field installation or field acceptance may be inferred from the plan. Current site state requires a fresh check. |
| Production and 3WEST migration | The October 6 readiness records say not to replace the existing 3WEST customer service yet. The 22 October plan retains the existing billing owner until controlled migration. | A migration or unattended public launch is not evidenced as approved or complete. |

### 3.2 Version and deployment baseline

Version claims are time-sensitive. The following are the most recent explicit
identifiers found in the source records reviewed for this page; they are not
assertions that the services remain unchanged or reachable today.

| Item | Recorded identifier / last documented state | Evidence boundary |
| --- | --- | --- |
| Application source published | The 6 October release record identifies Git commit `32ed51f2196b62b407405af05afdab82eee814df` on the `main` branch. | This identifies the source associated with that dated release record, not a fresh check of the current production deployment. |
| Source assessed for field planning | The 22 October field plan says its assessment was based on checked-out source `1d1c73d`. | A checked-out source assessment is not proof that the exact same revision is deployed. |
| Application URL recorded | `https://wifi.afribit.africa` | The URL appears in dated records; this page has not freshly tested its availability or deployment identity. |
| Controller URL recorded | `https://mesh-core.afribit.africa` | The 6 October records describe a dedicated LunaNode controller. The 14 October pause note did not re-audit remote availability. |
| Controller release recorded | `nonce-security-20261006T183318Z` | This is the retained release named in the dated handoff, not a confirmation of the current remote release. |
| Router/AP versions and field identity | Not established for a current field site in the records used here. | Obtain a read-only inventory from the intended equipment before commissioning; do not infer field identity from lab names or configuration. |
| Current field site and service owner | No accepted site handover or named individual owner recorded in the reviewed field plan. | Assign and record the accountable role/person through the approved deployment process. |

Before using a version-specific procedure, check the latest [release record](../mesh-release-2026-10-06.md),
[developer handoff](../mesh-developer-handoff.md), and [field deployment plan](../mesh-field-deployment-plan.md),
then verify the actual deployed source and equipment state through an authorized
operator. Do not use a public health page as proof of router reachability,
customer access or service availability.

## 4. Evidence labels and how to interpret claims

Use the following labels consistently in later handbook volumes. A claim may
carry more than one label, but its scope and evidence date must remain clear.

| Label | Meaning | Example of appropriate wording |
| --- | --- | --- |
| **Implemented** | Code, configuration logic, an interface or an operational mechanism exists in an identified source/version. Runtime use may not have been demonstrated. | “The application implements a voucher lookup endpoint in release X.” |
| **Deployed** | A named version or configuration was installed to a named environment or device, with a deployment/readback record. This does not alone establish user acceptance. | “The router-hosted welcome assets were read back on the identified home router on date X.” |
| **Tested** | A documented procedure was performed, with result, date, conditions and scope. Avoid using “tested” without saying what happened. | “The phone sent foreground Signal text while ordinary browsing was blocked on the home test SSID.” |
| **Accepted** | The designated decision-maker reviewed the relevant result and accepted it for a defined purpose or gate. Acceptance applies only to that scope. | “The two-router home routing foundation was accepted for the lab milestone.” |
| **Physically accepted** | A person completed the intended test on actual target equipment at the target location, and recorded the result. A software build or remote API check is not physical acceptance. | “The target field phone joined the commissioned field SSID and completed the signed checklist.” |
| **Proposed** | A plan, design, target architecture, endpoint, checklist or future test that has not been evidenced as implemented and accepted. | “The single-site field sequence is proposed for operator review.” |
| **Research** | Exploration, feasibility work, comparison or experiment that has not become a supported service commitment. | “The local relay and media-host setup is a lab research track.” |
| **Retired / paused** | A component, configuration or experiment is intentionally no longer active, or has been stopped pending an explicit resumption decision. State which. | “The local laptop experiments were paused on 14 October; remote services were not re-audited by that pause.” |
| **Unknown / not verified** | Available evidence does not establish the current fact. This is not a pass or failure. | “The target AP firmware was not verified during the planning review.” |

### Evidence quality checklist

For each important claim, record:

- the exact behavior or condition being claimed;
- date and time zone of the test or observation;
- source commit, deployed release, router/AP identity, app version or other
  relevant version;
- site and topology (lab, home pilot, isolated field test or accepted field
  service);
- prerequisites and method, including whether the test was live, simulated,
  mocked, read-only or destructive;
- observed result and relevant logs/readback, stored in an appropriately
  protected location;
- limitations, failed cases, untested cases and any known conflicting record;
- who accepted the result and for what gate, if acceptance is claimed.

Automated tests, configuration readbacks, live customer journeys, physical
acceptance and independent assessments answer different questions. Do not
combine them into a single green status without showing those distinctions.

## 5. Claim and evidence register

This register is a short map, not a replacement for the linked detailed records.
“Evidence exists” means a dated source records the result. It does not mean the
test was repeated on 22 October or that the service remains available.

| Claim area | Evidence-backed statement | Important limitation | Primary record |
| --- | --- | --- | --- |
| Two-router routing | The home-lab records describe two MikroTik routers exchanging routes between separate client subnets. | Only the recorded two-node lab topology is established. | [Network readiness](../kibera-mesh-network-readiness.md) and [lab runbook](../kibera-mesh-lab-01-runbook.md) |
| Link failover | The network record describes Ethernet preference, radio fallback after cable removal and wired preference after reconnection. | Parallel links connect the same two routers; this does not route around loss of a router or prove a third-site path. | [Network readiness](../kibera-mesh-network-readiness.md) |
| WAN loss | The network record describes local-route/local-service continuity with public internet unavailable after the tested WAN removal. | This is a bounded lab outage test, not a provider-wide resilience or field uptime result. | [Network readiness](../kibera-mesh-network-readiness.md) |
| Local welcome and catalogue | Dated records describe an open lab Mesh SSID, router-hosted assets and a local welcome/catalogue test. | Captive popups are controlled by the device operating system; full-browser behavior and target field equipment require their own acceptance. | [Network readiness](../kibera-mesh-network-readiness.md), [production operations](../mesh-production-operations.md) |
| Paid checkout and activation | The October 6 pilot notes describe a KES 10 Bitika purchase, 86 sat delivery, router acknowledgement and reported browsing retry. | One supervised home case is not a live field offer, load result, price matrix or guarantee that later transactions will succeed. | [Pilot readiness](../mesh-pilot-readiness-and-device-plans.md), [payment incident](../mesh-bitika-pending-ack-incident-2026-10-06.md) |
| Payment providers | Records describe Bitika as preferred and a Paystack/Engine fallback with distinct KES collection and Bitcoin settlement responsibilities. | Readiness checks are not proof of a new collection, a payout, full-price coverage or available treasury liquidity. | [Bitika operations](../mesh-bitika-primary.md), [settlement model](../mesh-engine-bitcoin-settlement.md), [pilot readiness](../mesh-pilot-readiness-and-device-plans.md) |
| Signal | Foreground text in both directions is recorded as working on unpaid Mesh while ordinary browsing was blocked. | Registration, calls, media, installation and background/push behavior are outside that acceptance. Signal still needs internet for this use. | [Signal trial](../mesh-signal-text-trial.md) |
| Blink | A signed-in Blink wallet's foreground refresh is recorded as working on unpaid Mesh. | This does not establish new account creation, installation, every wallet feature, push alerts or no-cost internet generally. | [Blink scope](../mesh-blink-free-access.md) |
| Learning resources | The project records a free-learning path and content/design work. | Do not infer that every external site is locally hosted or available during WAN loss; check the specific resource and dependency. | [Free learning](../mesh-free-learning.md) |
| Jami | The home pilot records foreground text and calls without WAN/cellular on the tested protected Wi-Fi; screen-off reception failed on both phones. | This is not evidence of emergency-grade communications, background delivery or arbitrary cross-site behavior. | [Jami trial](../mesh-jami-local-trial.md) |
| Berty | A lab record describes fresh messages sent both ways on lab Wi-Fi without WAN/cellular after proximity settings were enabled. | The same pilot record says Wi-Fi-off delivery failed and Bluetooth-off, screen-off and cross-node cases remain pending. | [Berty trial](../mesh-berty-local-trial.md) |
| Nostr / Blossom | Separate lab notes describe relay and media-host experiments. | These optional hosts were among the laptop experiments paused on 14 October; do not promise live availability or durable replication. | [Nostr lab](../kibera-mesh-nostr-lab.md), [Blossom lab](../kibera-mesh-blossom-lab.md), [pause record](../mesh-local-lab-pause-2026-10-14.md) |
| Security changes | The release record names specific hardening changes and bounded tests; the pilot notes distinguish those from remaining field work. | Automated checks and limited live negative tests are not an independent penetration test, certification or complete field signoff. | [Security release](../mesh-security-release-2026-10-06.md), [security audit](../mesh-security-audit-2026-10-06.md) |
| Capacity | The developer handoff and pilot readiness notes explicitly say a full multi-client field stress test has not been completed. | Do not publish a supported number of customers, throughput guarantee or radio coverage without measured acceptance evidence. | [Developer handoff](../mesh-developer-handoff.md), [pilot readiness](../mesh-pilot-readiness-and-device-plans.md) |
| Field deployment | The October 22 plan states proposed work and calls out unverified equipment/site details. | Planning language is not an installation record, site survey, customer migration or signed acceptance. | [Field deployment plan](../mesh-field-deployment-plan.md) |
| Local pause | The 14 October record documents selected local task/container/service shutdown and retained local recovery evidence. | The note expressly does not establish the state of remote cloud/controller services. | [Local lab pause](../mesh-local-lab-pause-2026-10-14.md) |

## 6. What the evidence does not establish

The records summarized here do **not** establish:

- a live, accepted Mesh field site as of 22 October 2026;
- that the local laptop experiments or any remote service are running now;
- three-or-more-node multi-hop routing, resilience around a failed router, or
  outdoor coverage;
- measured field throughput, airtime, latency, loss, customer capacity,
  availability or recovery-time guarantees;
- that every phone, operating-system version, captive portal, smart TV or
  private/randomized MAC address is supported;
- that every app feature works, or that external applications work without
  internet, provider services, installation, login or push infrastructure;
- reliable screen-off, locked-screen or emergency communications from the
  offline messaging trials;
- a customer-approved package matrix, service-level commitment, refund policy,
  final support process or complete 3WEST migration plan;
- complete customer isolation, perfect prevention of tethering/MAC spoofing,
  or a guarantee that an external-app allowlist admits only that app;
- a completed independent penetration test, regulatory approval, privacy
  compliance determination, legal opinion, ownership assignment or license;
- that a recorded release identifier, test result, provider credential or
  network state is still current without a fresh authorized verification.

These are visible limits, not reasons to discard the completed lab work. They
define the boundary between a demonstrated component and a broader claim.

## 7. Reader paths

| If you are… | Start here | Then use |
| --- | --- | --- |
| A community member or board reader | [Mesh in plain language](#2-mesh-in-plain-language) and [current state](#3-current-state-at-a-glance) | [Production operations](../mesh-production-operations.md) for the recorded service model and limits; ask the project operator for current site status. |
| A field technician | [Field deployment plan](../mesh-field-deployment-plan.md) | [Developer handoff](../mesh-developer-handoff.md) and [lab runbook](../kibera-mesh-lab-01-runbook.md) for technical context. The proposed plan is not a standalone authorization to change a live router. |
| A field lead or technician preparing a site | [Field deployment pack](02-field-deployment.md) | Use its gated checklist and private site-record template with an approved change plan and current site runbooks; do not treat the template as a live configuration. |
| A daily operator or support person | [Administration and support](03-administration.md) | Read the current UI boundaries, state meanings, payment/access troubleshooting and escalation rules before handling customer cases. |
| A network engineer or hardware planner | [IP network and hardware](04-ip-network.md) | Separate the documented two-router lab evidence from field requirements; use a verified site profile for any deployment. |
| A daily operator or support person | [Production operations](../mesh-production-operations.md) and [pilot readiness](../mesh-pilot-readiness-and-device-plans.md) | [Bitika operations](../mesh-bitika-primary.md), [payment incident procedure](../mesh-bitika-pending-ack-incident-2026-10-06.md), and the approved current runbooks. Confirm the current deployed versions first. |
| A developer or integrator | [Developer handoff](../mesh-developer-handoff.md) | [Field deployment plan](../mesh-field-deployment-plan.md), [security release](../mesh-security-release-2026-10-06.md), and the source map in the handoff. Treat proposed API shapes as proposals until confirmed in code and tests. |
| A network engineer | [Network readiness](../kibera-mesh-network-readiness.md) | [Lab concept](../kibera-mesh-lab-01-concept.md), [lab runbook](../kibera-mesh-lab-01-runbook.md), and the site-specific approved design. Lab subnets and device identifiers are not a field address plan. |
| A finance or payment reviewer | [Bitika operations](../mesh-bitika-primary.md) | [Payment incident](../mesh-bitika-pending-ack-incident-2026-10-06.md), [Engine settlement](../mesh-engine-bitcoin-settlement.md), and [voucher records](../mesh-six-digit-vouchers.md). Reconcile from authorized financial records, not this summary. |
| A security reviewer | [Security release](../mesh-security-release-2026-10-06.md) and [security audit](../mesh-security-audit-2026-10-06.md) | [Pilot readiness](../mesh-pilot-readiness-and-device-plans.md), [secure join](../mesh-secure-join.md), and [device-access security](../mesh-device-access-security.md). The release notes are scoped evidence, not an independent assurance certificate. |
| An app/service researcher | [Free app and offline evidence](#5-claim-and-evidence-register) | The linked [Signal](../mesh-signal-text-trial.md), [Blink](../mesh-blink-free-access.md), [Jami](../mesh-jami-local-trial.md), [Berty](../mesh-berty-local-trial.md) and [learning](../mesh-free-learning.md) notes. Preserve each trial's exact platform and feature scope. |
| A rights or publication reviewer | [Volume 12 — IP and stewardship](12-ip-and-stewardship.md) | Use the separately maintained, restricted internal IP dossier and authorized legal-review process for ownership and rights evidence. Do not infer project ownership or permission from repository visibility or this handbook. |
| A product or support owner | [Product and service contract](01-product-and-service.md) | Resolve package, device, payment, support, refund and free-service decisions before approving any customer-facing offer. |

## 8. Documentation map

### Existing Mesh reference material

The [Mesh documentation index](../README.md) is the broader navigation page.
The following source documents are useful inputs to the planned handbook; they
are not all canonical operating instructions.

| Topic | Existing source material |
| --- | --- |
| Planning and status | [Documentation plan and table of contents](../mesh-documentation-plan-and-toc.md); [status and roadmap](../mesh-status-and-roadmap-2026-10-06.md); [field deployment plan](../mesh-field-deployment-plan.md); [pilot readiness and device plans](../mesh-pilot-readiness-and-device-plans.md) |
| Release and developer context | [Published release record](../mesh-release-2026-10-06.md); [developer handoff](../mesh-developer-handoff.md); [production operations](../mesh-production-operations.md) |
| Network and local laboratory | [Network readiness](../kibera-mesh-network-readiness.md); [lab concept](../kibera-mesh-lab-01-concept.md); [lab runbook](../kibera-mesh-lab-01-runbook.md); [local lab pause](../mesh-local-lab-pause-2026-10-14.md) |
| Access and security | [Native automatic access](../mesh-native-automatic-access.md); [secure join](../mesh-secure-join.md); [replay protection](../mesh-agent-replay-protection.md); [device access security](../mesh-device-access-security.md); [security release](../mesh-security-release-2026-10-06.md); [security audit](../mesh-security-audit-2026-10-06.md) |
| Payments and vouchers | [Bitika primary path](../mesh-bitika-primary.md); [Bitika provider notes](../mesh-bitika-provider.md); [pending-acknowledgement incident](../mesh-bitika-pending-ack-incident-2026-10-06.md); [Bitcoin settlement](../mesh-engine-bitcoin-settlement.md); [six-digit vouchers](../mesh-six-digit-vouchers.md); [physical voucher cards](../mesh-physical-voucher-cards.md) |
| Apps and local services | [Signal trial](../mesh-signal-text-trial.md); [Blink free-access scope](../mesh-blink-free-access.md); [free learning](../mesh-free-learning.md); [Jami trial](../mesh-jami-local-trial.md); [Berty trial](../mesh-berty-local-trial.md); [Nostr lab](../kibera-mesh-nostr-lab.md); [Blossom lab](../kibera-mesh-blossom-lab.md) |

### Planned handbook volumes

Volumes 00 through 12 are drafted for review. The proposed sequence below is
preserved from the [documentation plan](../mesh-documentation-plan-and-toc.md).

| Volume | Handbook document | Primary reader |
| --- | --- | --- |
| 00 | `00-start-here.md` (this document) | Everyone |
| 01 | [01-product-and-service.md](01-product-and-service.md) | Operator, support and product |
| 02 | [02-field-deployment.md](02-field-deployment.md) | Onsite technician |
| 03 | [03-administration.md](03-administration.md) | Daily operator |
| 04 | [04-ip-network.md](04-ip-network.md) | Network engineer |
| 05 | [05-architecture.md](05-architecture.md) | Developer and SRE |
| 06 | [06-api-and-data.md](06-api-and-data.md) | Developer and integrator |
| 07 | [07-payments-and-vouchers.md](07-payments-and-vouchers.md) | Finance, support and engineer |
| 08 | [08-security-and-privacy.md](08-security-and-privacy.md) | Security reviewer and operator |
| 09 | [09-operations.md](09-operations.md) | On-call operator and SRE |
| 10 | [10-apps-and-local-services.md](10-apps-and-local-services.md) | Community, product and network |
| 11 | [11-scale-and-governance.md](11-scale-and-governance.md) | Planning and community leads |
| 12 | [12-ip-and-stewardship.md](12-ip-and-stewardship.md) | Maintainers and authorized rights reviewers |

The [whitepaper](../whitepaper/mesh-whitepaper.md) is a first narrative draft,
not a public statement. Release remains gated on reconciliation of the product
contract and architecture and completion of the technical, operational,
financial, privacy, rights and communications reviews required by the plan.

## 9. Open decisions and verification register

This is a register of missing evidence and decisions visible in the source
records, not a decision that those items are approved. No individual owners or
due dates are invented here. The project should assign accountable owners and
review dates through its normal operating process.

| ID | Decision or verification item | Current state in the records | Required evidence / next gate | Source |
| --- | --- | --- | --- | --- |
| E-01 | Confirm current deployed application, controller and router versions | Dated release IDs exist; current deployment was not freshly reconciled to the October 22 checked-out source in this documentation review. | Capture authorized deployment identifiers and compare them to the intended source/configuration before version-specific operation. | [Release record](../mesh-release-2026-10-06.md), [field plan](../mesh-field-deployment-plan.md) |
| E-02 | Verify actual field site and equipment inventory | The field plan calls for a supervised site but says the router was disconnected and site inventory was not verified in that planning task. | Record actual router/AP models, serials, firmware, port/radio roles, power, ISP handoff, site permissions and management path; retain private identifiers only in protected records. | [Field deployment plan](../mesh-field-deployment-plan.md) |
| E-03 | Approve a field network/site profile | Home lab ranges and topology are documented; a current site-specific field plan is not accepted here. | Approve unique site/router identity, addressing, VLAN/SSID boundaries, transit, management, DNS, firewall and rollback details after a read-only inventory and survey. | [Network readiness](../kibera-mesh-network-readiness.md), [field plan](../mesh-field-deployment-plan.md) |
| E-04 | Decide initial product and package contract | Home pilot settings differ from existing 3WEST products; reference-plan parity, validity and device behavior remain unresolved. | Approve displayed prices, speed/allowance, validity/start rules, supported devices, service limits, payment options and support/refund copy before sales or migration. | [Pilot readiness](../mesh-pilot-readiness-and-device-plans.md), [production operations](../mesh-production-operations.md) |
| E-05 | Accept captive and customer journeys on target equipment | Home software/assets and limited phone tests are recorded; revised completion and target field captive behavior require acceptance. | Complete the unpaid, paid, expired, WAN-loss and reopen-portal journeys on target AP/router and supported phones; document OS/browser differences. | [Production operations](../mesh-production-operations.md), [developer handoff](../mesh-developer-handoff.md) |
| E-06 | Complete payment/provider and recovery gates | A specific home purchase and recovery are recorded; provider readiness is not universal price coverage or a new transaction. | Reconcile the approved product price matrix with each provider's limits and settlement path; define safe handling of uncertain collections without duplicate charges. | [Bitika operations](../mesh-bitika-primary.md), [payment incident](../mesh-bitika-pending-ack-incident-2026-10-06.md), [pilot readiness](../mesh-pilot-readiness-and-device-plans.md) |
| E-07 | Complete field isolation, credentials and restore work | Home security changes exist; the pilot plan still lists credential rotation, target isolation, monitoring and restore acceptance. | Record credential/key rotation, guest-to-management and IPv6 packet-path tests, backups, rollback, alerting and recovery on the commissioned configuration. | [Pilot readiness](../mesh-pilot-readiness-and-device-plans.md), [security release](../mesh-security-release-2026-10-06.md) |
| E-08 | Establish actual supported capacity | The developer handoff says full multi-client field stress testing is incomplete. | Measure representative connected devices, airtime, throughput, latency, payment concurrency and outage/recovery on target equipment; publish only the resulting bounded envelope. | [Developer handoff](../mesh-developer-handoff.md), [pilot readiness](../mesh-pilot-readiness-and-device-plans.md) |
| E-09 | Decide supported free-app and offline-service scope | Individual app trials exist with different dependencies and known failures/limitations. | Publish an app-by-feature/platform matrix, identify external internet/push requirements, and explicitly exclude unaccepted behaviors. | [Signal](../mesh-signal-text-trial.md), [Blink](../mesh-blink-free-access.md), [Jami](../mesh-jami-local-trial.md), [Berty](../mesh-berty-local-trial.md) |
| E-10 | Assign operator, support and escalation responsibilities | The reviewed plans identify responsibilities by role but do not record a named, accepted field support owner. | Name authorized owner(s), service hours, incident escalation, provider contacts and who can change router policy or handle customer/payment cases. | [Field deployment plan](../mesh-field-deployment-plan.md), [production operations](../mesh-production-operations.md) |
| E-11 | Approve controlled treatment of the existing customer service | The October 6 decision says not to replace the 3WEST service yet; the October 22 plan says to retain its current billing owner until controlled migration. | Document migration scope, entitlement/allowance reconciliation, customer communications, rollback and authorization before any change. | [Status and roadmap](../mesh-status-and-roadmap-2026-10-06.md), [field plan](../mesh-field-deployment-plan.md) |
| E-12 | Resolve publication and rights review questions | The plan explicitly says public repository visibility does not determine ownership or licensing. | Obtain authorized rights review for source, marks, generated/third-party assets, dependencies, provider terms and public claims before publication. | [Documentation plan](../mesh-documentation-plan-and-toc.md) |

## 10. Glossary

| Term | Meaning in this handbook |
| --- | --- |
| **Access point (AP)** | Wi-Fi radio equipment through which a customer device connects to the local network. An AP supplies wireless access; it is not necessarily a router or an internet gateway. |
| **Acknowledgement (router/controller)** | A recorded response that a command or access change was received or applied at a particular system. It should not be confused with proof that the customer's end-to-end internet works. |
| **Allowance** | The quantity or time entitlement associated with a pass, as defined by the approved package. Exact Mesh package semantics must be stated in the customer contract. |
| **Backhaul / transit link** | A connection carrying traffic between network equipment or sites, such as the tested Ethernet and radio links between the two home routers. |
| **Bitika** | The payment route described in the project records as the preferred path for KES collection with direct Bitcoin delivery. Provider behavior and current readiness require current verification. |
| **Blink** | The wallet application used in a documented foreground refresh trial. A tested refresh is not proof that every wallet function or notification works. |
| **Captive portal / welcome page** | A page shown to a device before general internet access is allowed. The device operating system controls its captive window; a router-hosted page may have different availability from a cloud checkout. |
| **Client device** | A customer's phone, computer, TV or other device using Wi-Fi or a wired connection. A client is not automatically a Mesh routing node. |
| **Controller** | The software service that coordinates enrolled router operations and access state. Controller health or cloud polling alone does not prove the router, AP or customer path is healthy. |
| **Entitlement** | The recorded right for a specified device/account to use a service under a pass or other approved grant, including its limits and expiry. A payment record and an entitlement are related but distinct states. |
| **Ethernet** | Wired networking technology. In the documented home network, the Ethernet transit link is preferred over the alternate radio link. |
| **Gateway** | A device or service that forwards traffic from one network toward another. In this project, “internet gateway” generally means the router path that connects customer traffic to the site's ISP. |
| **Guest network / customer segment** | The network intended for customer devices, separated by configuration and policy from equipment-management and other protected networks. The required isolation must be tested; an SSID name alone does not provide it. |
| **HotSpot** | MikroTik's captive access and subscriber/session mechanism used in the documented home access design. This is a product name and implementation detail, not a synonym for every Mesh component. |
| **Internet Protocol (IP)** | The network-layer protocol used to address and route packets between networks. In this handbook, “IP network” refers to Internet Protocol, not intellectual property. |
| **Internet service provider (ISP)** | The provider supplying upstream internet connectivity to a site. Local networking may continue during an ISP/WAN outage even when external internet services cannot. |
| **Mesh** | The product/project name used in the publication plan. It does not by itself claim that the current tested topology has arbitrary multi-hop or decentralized routing. |
| **M-Pesa** | The mobile-money payment method referenced in customer purchase flows. Customers approve payment through the provider's process; they should never enter an M-Pesa PIN into Mesh. |
| **Node / routing node** | In network discussions, a router or other participating device that forwards traffic between networks. Do not use “node” to imply every customer phone routes traffic. |
| **OSPF** | A routing protocol used in the documented two-router home lab to exchange reachability information. Its home-lab use does not establish an accepted multi-site routing design. |
| **Pass / package** | A customer-facing paid internet offer with defined price and service limits. The final approved price, allowance, validity and supported-device terms must come from the product/service contract. |
| **Payment collection** | The step in which a payment provider records or confirms collection of customer funds. Collection alone is not proof of Bitcoin settlement or Wi-Fi activation. |
| **Private MAC address** | A device-generated, potentially changing Wi-Fi hardware address used to reduce tracking. Changes can affect device binding; they do not identify a person and must be addressed in the support policy. |
| **Radio link** | A wireless connection between network devices. The documented nearby indoor link is lab evidence, not an outdoor range or capacity guarantee. |
| **Settlement** | The distinct financial step that transfers or accounts for the payment value, including Bitcoin delivery where applicable. It must be reconciled separately from M-Pesa collection and access activation. |
| **Site** | A bounded physical deployment location with its own equipment, upstream service, addressing, permissions, support responsibility and acceptance record. |
| **SSID** | The name advertised by a Wi-Fi network. A shared or familiar SSID name alone does not create roaming, routing, security or client isolation. |
| **Voucher** | A redeemable access credential, including the documented six-digit voucher design. Issuance, storage, sale, redemption and support require controlled procedures. |
| **WAN** | The upstream network path connecting a site to external networks, typically through an ISP. A WAN outage can stop external services while leaving local routing and local hosts reachable. |
| **Walled garden / free-service exception** | A narrowly configured policy intended to allow specified destinations or application flows while other general internet access remains restricted. Shared hosting and encrypted services can limit how exclusive such a policy is. |

## 11. Updating this register

Review this page whenever a release, field acceptance, material outage, product
decision or new app/security result changes a status claim. Keep historical
records intact and link to newer evidence rather than silently rewriting what
was true at an earlier checkpoint.

For each update:

1. Record the review date and the source documents/releases checked.
2. Confirm whether the source describes implementation, deployment, a test,
   acceptance, a proposal or research.
3. Update the status table only where the evidence supports a change; preserve
   the previous claim's date/scope in its source record.
4. Add measured limits and unresolved failures alongside successful results.
5. Check links and ensure no secret, live customer/payment data, active voucher
   or private field recovery detail has been added.
6. Assign a responsible role and next review date for unresolved decisions;
   leave them explicitly unassigned until that is done.
7. Keep this index consistent with the [Mesh documentation index](../README.md)
   and the [documentation plan](../mesh-documentation-plan-and-toc.md).
