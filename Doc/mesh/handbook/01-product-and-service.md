# Mesh product and service contract

**Audience:** Product and service owners, operators, support, community
representatives, finance reviewers and anyone preparing customer-facing
materials  
**Document owner:** Product/service owner role (individual not yet recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Draft product definition and reconciliation record. This is **not**
an approved customer tariff, service-level agreement, refund policy or
authorization to sell or migrate a service.

> **Important:** The home pilot proves selected parts of the Mesh experience,
> not a complete field service. The current lab catalogue and access rules do
> not yet match the historical 3WEST offer. The 3WEST prices below are included
> as a reference to preserve and reconcile, not as a newly approved Mesh price
> list. Confirm the current customer terms with the service owner before any
> offer, sale, migration or public claim.

## Contents

- [1. Purpose and contract status](#1-purpose-and-contract-status)
- [2. Product purpose and service boundaries](#2-product-purpose-and-service-boundaries)
- [3. Brand and customer communication](#3-brand-and-customer-communication)
- [4. Service categories and availability](#4-service-categories-and-availability)
- [5. Customer journeys](#5-customer-journeys)
- [6. Captive welcome and full-browser behavior](#6-captive-welcome-and-full-browser-behavior)
- [7. Package terms and catalogue reconciliation](#7-package-terms-and-catalogue-reconciliation)
- [8. Device identity and sharing](#8-device-identity-and-sharing)
- [9. Payment and access states](#9-payment-and-access-states)
- [10. Outage, failure and recovery behavior](#10-outage-failure-and-recovery-behavior)
- [11. Support, fairness and privacy](#11-support-fairness-and-privacy)
- [12. Launch scope and exclusions](#12-launch-scope-and-exclusions)
- [13. Decisions required before approval](#13-decisions-required-before-approval)
- [14. Acceptance checklist](#14-acceptance-checklist)
- [15. Source records](#15-source-records)

## 1. Purpose and contract status

This document describes the product/service decisions that must be explicit
before Mesh is offered as a field service. It also captures what the existing
records say about the home pilot and prior 3WEST product, so later work does not
silently replace one service with another.

The document uses these status terms:

- **Recorded reference:** a term or capability documented for an existing
  service or historical configuration. It may need verification before reuse.
- **Home-pilot evidence:** a bounded test or live event documented on the home
  laboratory equipment.
- **Implemented:** a code or configuration capability is present in an
  identified source/release; operation or customer acceptance may still be
  pending.
- **Proposed:** a product choice, customer journey, support rule or technical
  design that has not been approved or accepted as a field service.
- **Open decision:** an owner must decide and record the customer-facing term
  or operating responsibility before launch.

This draft does not make a binding promise on price, speed, data, expiry,
coverage, uptime, support response, refunds, device count or availability. Those
must be approved by the responsible service owner and reflected consistently
in the customer interface, payment receipt, router enforcement and support
process.

### 1.1 Approval record

| Approval area | Accountable role | Status |
| --- | --- | --- |
| Product scope and catalogue | Product/service owner | Not recorded |
| Tariffs, validity and financial wording | Commercial/finance owner | Not recorded |
| Payment-provider readiness and reconciliation | Finance/payment owner | Not recorded |
| Network coverage, capacity and availability wording | Network/operations owner | Not recorded |
| Device support and recovery policy | Product/operations owner | Not recorded |
| Customer-facing copy and localization | Product/community communications owner | Not recorded |
| Privacy, terms, consumer and regulatory review | Authorized reviewer | Not recorded |

No names, response targets or legal conclusions are inferred here.

## 2. Product purpose and service boundaries

Mesh is a community-connectivity service concept built around shared network
equipment. It aims to provide a clear way to join local Wi-Fi, discover
specifically approved services and, where commissioned, buy a pass for general
internet access. This is a description of purpose; it is not evidence of
coverage, affordability, local demand or a particular community outcome.

The service has several distinct parts:

1. **Local Wi-Fi access:** a customer device connects to an access point and
   receives a local welcome. An open SSID means no Wi-Fi password is required
   to join that radio network; it does not mean that general internet access is
   unrestricted.
2. **Local resources:** router-hosted welcome assets and any separately
   commissioned local service. Some may be reachable without the WAN if the
   site equipment and service host remain powered and correctly connected.
3. **Selected internet exceptions:** a narrowly configured set of external
   destinations may be reachable without a paid general-internet pass. These
   services still depend on the internet and their providers.
4. **Paid general internet:** a pass may permit the purchasing device to use
   general internet according to its approved price, time, rate, data and
   device terms. The external connection depends on the site ISP/WAN and the
   commissioned gateway.
5. **Payment and access control:** payment collection, Bitcoin settlement,
   entitlement creation and router activation are distinct events. Customers
   should not be told they are online merely because a payment prompt was
   approved or a receipt exists.

Mesh does not require every resident to own a Bitcoin wallet or act as a
network router. Payment implementation can involve Bitcoin settlement behind
the scenes while the customer-facing payment method remains M-Pesa. This
description does not settle how payment fees, exchange rates, receipts, refunds
or taxes are presented; those require finance/service-owner approval.

The technical routing network, captive portal and application services are
related but not interchangeable. A local message-app test does not prove
general internet availability. An external application exception does not
make that application work offline. More APs may improve radio coverage but do
not by themselves increase ISP bandwidth, gateway capacity or service
availability.

## 3. Brand and customer communication

### 3.1 Naming

- Use **Mesh** as the product name.
- Use **Powered by Afribit** as a separate attribution where the design calls
  for it. Do not combine the brand into “Afribit Mesh” unless the brand owner
  explicitly approves a change.
- Keep **3WEST** as the name of the existing site/service context where
  historical records require it. It is not a replacement Mesh brand.
- Keep technical IDs, router IDs and database identifiers stable unless an
  approved technical migration requires a change. Do not cosmetically rename
  identifiers in live configuration.

These are project publication directions, not a legal determination of
trademark rights, ownership or clearance.

### 3.2 Visual language recorded for the captive

The current design record describes:

- the existing woven Mesh mark and a bold, standalone wordmark;
- deep green `#203c32`, Afribit orange `#f7931a`, warm ivory `#fffaf2`,
  ink `#29251f` and burnt orange `#884009`;
- Geist typography, with the documented captive wordmark treatment using
  weight 750, 39 px and −0.075 em tracking;
- a locally served community photograph behind a darkened hero, with the
  internet-pass action prominent immediately below;
- voucher entry as a secondary action; and
- local font and image assets so the welcome does not require a font CDN or
  an internet fetch to display its core content.

The source photograph has provenance recorded in the [captive art-direction
note](../mesh-captive-art-direction.md). Reuse or redistribution of the
photograph, font, logo or other asset must follow its applicable rights and
license review. A public source location alone does not establish permission.

These design details document an existing design direction; they do not imply
that every later page, translation, device or deployment has been reviewed.
Keep text readable at small sizes and with assistive settings, do not place
essential text inside an image, and verify real device/browser behavior rather
than relying only on a screenshot.

### 3.3 Tone and plain-language principles

Customer-facing content should:

- state what is free, what needs a pass, and what needs the internet;
- call the product an **internet pass** or **voucher**, not a router account;
- distinguish “payment received” from “connecting” and “connected”;
- explain that the customer approves an M-Pesa prompt on their own phone;
- never ask for or collect an M-Pesa PIN in Mesh;
- describe an outage without encouraging a second payment;
- avoid promises of perfect app isolation, uninterrupted service, full
  coverage, emergency communications, privacy from the ISP, or support response
  times that have not been approved and measured;
- use familiar, non-specialist words and explain Bitcoin only as much as
  needed for the customer journey; and
- avoid suggesting that customers must install a wallet or understand Bitcoin
  to join Wi-Fi or use an approved pass.

Customer copy in this document is illustrative until it is reviewed,
localized and approved.

## 4. Service categories and availability

The following matrix summarizes recorded home-pilot scope. It is not a
guarantee of current availability or a field offer.

| Service | Pass required? | WAN / external dependency | Recorded evidence and boundary |
| --- | --- | --- | --- |
| Router-hosted welcome and local captive assets | No, for the local page | No, while the gateway/AP are powered and local assets are available | Lab open join and welcome behavior are recorded. Real captive popup behavior varies by phone/OS; the permanent local page is distinct from the popup. |
| Local community board and relay demonstrations | No, when hosted and reachable | Not for a local-only path, but the experimental hosts must be operating | These were lab demonstrations, not a committed production service. The board is not part of the revised captive welcome. |
| Selected learning links | No Mesh pass for the documented allowed destination scope | Yes for external websites and the original publisher PDF | Named learning destinations have a narrow home-trial allowance. Shared hosting can permit unrelated destinations; linked pages and large downloads are not automatically covered or cached locally. |
| Signal foreground text | No Mesh pass for the documented exception | Yes; Signal service endpoints and WAN are required | Bidirectional foreground text was accepted in the home trial while unrelated general browsing remained blocked. Registration, calls, media and notifications are not included in that result. |
| Blink signed-in foreground refresh | No Mesh pass for the documented core allowance | Yes; Blink endpoints and WAN are required | An already-installed, signed-in wallet refresh was operator-accepted. Installation, account creation, every feature, transfers and reliable background/push are not covered. |
| Paid general internet | Yes, after an approved purchase or voucher | Yes; WAN, Mesh cloud/controller and payment service are needed for purchase/activation | A specific supervised KES 10 home purchase is documented with verified delivery, router acknowledgement and reported browsing retry. This is not a field service acceptance or proof of all prices/providers. |
| Jami offline foreground test | No paid internet pass for the tested local path | No WAN/cellular for the tested local exchange; both devices and app settings still matter | Foreground text/calls worked in the documented lab condition. Screen-off reception failed on both phones. This is not a supported emergency or background communication service. |
| Berty offline Wi-Fi test | No paid internet pass for the tested local path | No WAN/cellular in the documented Wi-Fi test; proximity configuration and local network matter | Fresh messages were exchanged with settings enabled. Wi-Fi-off failed; Bluetooth-off, screen-off and cross-node conditions were not accepted. Research only. |
| Nostr/Blossom experimental services | No paid pass for local access if host and routes are available | Depends on the local host for the experiment; external publishing/peers may need WAN | Lab experiments are optional and the local services were included in the laptop-host pause. No durability, moderation or current availability promise. |

### 4.1 Meaning of “free”

“Free” should be used only with a named scope. It can mean:

- no Mesh internet pass is required for a specific local page;
- no Mesh internet pass is required for a specific tested external destination
  or traffic exception; or
- no Mesh pass is required for a bounded local application trial.

It does **not** automatically mean:

- all internet browsing is available without payment;
- an external app is usable while the ISP/WAN is down;
- app installation, app stores, registration, new accounts, all app features,
  media or notifications are covered;
- an external domain is perfectly isolated from other services sharing its
  network addresses; or
- local experimental hosts are always powered and maintained.

Prefer wording such as “Signal text is available without an internet pass on
the tested Mesh service; it still needs an internet connection” over “Signal
works offline” or “free internet.”

## 5. Customer journeys

These journeys describe intended customer-facing behavior and the evidence
boundary. They are not a substitute for current production screenshots or
field acceptance.

### 5.1 Join and discover

1. The customer selects the published **Mesh** Wi-Fi network.
2. The device may open its operating-system captive window automatically.
   If it does not, the welcome should provide a simple, visible way to open the
   local Mesh purchase page in the regular browser.
3. The welcome identifies Mesh and Afribit, explains the distinction between
   selected free services and paid general internet, and presents only the
   services currently approved for that site.
4. The customer can choose a pass or voucher, or leave the page and use a
   specifically allowed free service without accidentally granting general
   internet.

The open SSID is not a promise that the network is encrypted. Customers should
use HTTPS and application-level security. Site isolation and management
protection are operator responsibilities.

### 5.2 Buy a pass using M-Pesa

1. The customer reviews the displayed price and all material package terms.
2. The customer enters the M-Pesa phone number required by the checkout.
3. The customer receives and approves the M-Pesa request through the payment
   provider. The M-Pesa PIN is entered only into the provider-controlled
   interface on the customer's phone, never into a Mesh form or support chat.
4. Mesh shows an honest waiting/verification state. A customer should not
   repeat the checkout simply because a page is slow or a phone popup was
   dismissed.
5. Mesh verifies the provider result and any required Bitcoin delivery or
   settlement. An M-Pesa prompt approval alone is not sufficient to grant
   service.
6. The controller sends the original authorized allowance to the correct
   enrolled access gateway.
7. The customer is told that access is active only after the gateway
   acknowledgement establishes the intended router-side change.
8. The screen gives a safe way to begin browsing and a route back to the local
   purchase/status page.

The recorded implementation has Bitika as the preferred path, with a
Paystack/Engine fallback design. The Paystack path uses a funded Bitcoin
treasury; it is not equivalent to Bitika's direct delivery path. Provider
selection, price readiness and settlement capacity must be confirmed for the
actual package before sale. A provider being configured or returning a quote is
not proof that every package can complete.

### 5.3 Redeem a voucher

1. The customer chooses the voucher action and enters one code.
2. The interface explains any input format without exposing other issued codes.
3. A valid voucher is consumed once and associated with its intended access
   grant; repeated requests must not create duplicate allowances.
4. An invalid, already-used or temporarily rate-limited code receives a
   non-revealing explanation and a safe next step.
5. The customer sees “connecting” until the router confirms access.

The repository documents six-digit numeric voucher issuance, protected storage
and durable attempt limits. The customer-facing voucher sale, batch
accountability, stock custody, print acceptance and support process still need
approval. Design proofs are not issued voucher stock.

### 5.4 Use a selected free service

The customer should be able to identify:

- the name of the approved free service or feature;
- whether that service needs the internet;
- whether installation/login must be completed beforehand using another
  connection;
- the features actually included in the test; and
- what is not included, especially background delivery, app-store access,
  registration, media or notifications.

The policy should keep general internet blocked for an unpaid device while the
specific approved service works. The records warn that shared IP/CDN
infrastructure can let unrelated services use the same allowed address; do not
claim perfect application-exclusive whitelisting.

### 5.5 Expiry and renewal

The customer should receive understandable information about the effective
pass boundary before purchase and while connected, where the product supports
that display. At expiry:

- paid general internet access ends according to the approved package rules;
- the customer is not silently given a fresh allowance by reconnecting,
  refreshing a page or contacting support;
- the local welcome/purchase page remains accessible if the site equipment is
  operating and the configured path permits it;
- approved free-service exceptions remain governed by their own policy; and
- renewal starts a new purchase only after the customer deliberately selects
  and authorizes it.

The precise expiry rules remain an open contract item; see
[package terms](#7-package-terms-and-catalogue-reconciliation).

## 6. Captive welcome and full-browser behavior

The captive experience is the initial welcome and explicit handoff to
purchase/voucher entry. It should be useful but must not pretend to control
the phone operating system.

### 6.1 What the captive can and cannot promise

**It can:**

- display a local welcome, brand and commissioned service information;
- provide explicit actions to open checkout or voucher redemption;
- offer a plain local address or supported handoff to reopen the purchase page;
- distinguish free-service scope from general internet; and
- show progress/results returned by the checkout, subject to network
  connectivity.

**It cannot promise:**

- that iOS or Android will automatically show, keep open or close a captive
  window on demand;
- that an external app can display the Mesh purchase page over itself;
- safe redirection of arbitrary HTTPS traffic or TLS interception;
- payment or cloud checkout while the upstream internet/controller/provider
  dependency is unavailable; or
- that a local HTML page alone configures Wi-Fi, DHCP, DNS, firewall rules,
  client isolation or paid access.

The [captive shell record](../mesh-captive-shell.md) describes the existing
router-hosted assets and explicit cloud handoff. The home production guide
documents the permanent local portal approach and CAPPORT-related limits.
Real-device behavior remains distinct from browser fixture or screenshot
review.

### 6.2 Required entry behavior

Before a field offer, verify on the target router/AP and supported phones:

1. A newly joined unpaid device can reach the welcome.
2. If automatic captive detection does not remain available, the page gives a
   clear route to the regular browser/local purchase page.
3. Dismissing the captive popup does not create a paid session or silently
   open a cloud checkout.
4. The permanent purchase page is accessible to unpaid and expired users.
5. Full-browser checkout can return useful status even if the original captive
   window has been closed, where the deployed flow supports that recovery.
6. During WAN/controller loss, the local page reports that online purchase is
   unavailable and does not initiate an ambiguous charge.
7. After expiry, the customer can reopen the local entry without receiving
   general internet.

The current design puts the pass action first and voucher entry second, uses
locally served imagery and fonts, and keeps billing disabled until the actual
router is commissioned. Design and local asset installation are not equivalent
to physical acceptance of the purchase flow.

## 7. Package terms and catalogue reconciliation

### 7.1 Contract fields required for each offer

No package should be considered ready for sale until the same values are
represented consistently in the catalogue, payment quotation, receipt,
entitlement, router policy and support instructions.

| Field | Customer must be able to understand | Required reconciliation |
| --- | --- | --- |
| Product name | What the pass is called and whether it is personal, TV, household or another scope | Avoid implying a device or household entitlement that enforcement does not support. |
| Price and currency | Exact amount payable (KES if approved) and any additional customer charge | Match checkout and provider request; disclose any approved fee/tax treatment. |
| Usable-time allowance | Whether time means connected/online usage, elapsed duration or another measured unit | Define pause/disconnect behavior, accounting source, rounding and counter-reset protection. |
| Validity window | How long after purchase or first use the customer may consume the allowance | Define start trigger, calendar periods, time zone and expiry at the boundary. Do not assume “one month” means 30 days. |
| Rate | Any advertised upload/download rate or “up to” qualification | State whether rate is per device or shared and verify packet-path enforcement on target hardware. |
| Data limit / FUP | Whether data is capped, unlimited or subject to a fair-use rule | “0 MB” in the historical screenshot is described as unlimited; confirm source semantics and disclose any genuine policy. |
| Device count | Number of registered and simultaneous devices | Define phone/TV/wired-device identity, recovery, transfer and sharing limits. |
| Coverage/availability | Site/area and conditions under which the pass can be used | No coverage radius, uptime or roaming promise without measurement and acceptance. |
| Payment method | How the customer pays and how to resolve an uncertain result | State supported providers for that exact price and the safe no-duplicate-payment path. |
| Refund/support | How a customer reports a problem and what remedy applies | Name the support channel, hours, owner, response target and approved refund/escalation policy. |
| Receipt/status | What confirms payment, access and expiry | Distinguish receipt, settlement, active router grant, observed session and consumed allowance. |

### 7.2 Historical 3WEST catalogue reference

The following table is reproduced from the dated 3WEST readiness record as a
**reference to preserve and verify**, not as an approved new Mesh tariff or
proof that the offer remains active on the serving router. That source records
all products at **3 Mbps upload / 3 Mbps download**, no data cap and FUP off.
It says the screenshot labels “0 MB” as unlimited data.

| Historical hotspot plan | Recorded price | Time limit shown | Validity shown |
| --- | ---: | --- | --- |
| 1hr 20mins | KES 10 | 80 minutes | 1 day |
| 2hours | KES 15 | 2 hours | 1 day |
| 4hours | KES 20 | 4 hours | 1 day |
| 24hours | KES 30 | 24 hours | 1 day |
| 2days | KES 55 | None shown | 2 days |
| 3days | KES 85 | None shown | 3 days |
| 1week | KES 140 | None shown | 7 days |
| 2weeks | KES 230 | None shown | 14 days |
| 1month | KES 450 | None shown | 1 month |

The separate historical TV/static catalogue contains six entries:

| Historical TV/static plan | Reference ID | Recorded price | Validity shown |
| --- | ---: | ---: | --- |
| 24HOURS TV | 10 | KES 30 | 1 day |
| 2DAYS TV | 11 | KES 55 | 2 days |
| 3DAYS TV | 12 | KES 85 | 3 days |
| 1WEEK TV | 13 | KES 140 | 7 days |
| 2WEEKS TV | 14 | KES 230 | 14 days |
| 1MONTH TV | 15 | KES 450 | 1 month |

The source explicitly says that an exact current-plan export or operator
confirmation is still needed. In particular, it does not establish whether
validity begins at purchase or first use, how connected time is counted for the
short passes, how an unlimited plan expires, or what “1 month” means. Verify
those terms against the serving system before treating the table as a
customer promise.

### 7.3 Home catalogue is not yet equivalent

The October 6 pilot-readiness record reports **nine active hotspot products**
versus the 15 reference products above, including six TV products. It also
records that the catalogue comparison failed. The pilot has higher rate
settings than the 3WEST reference (50 Mbps cap referenced in the status
records versus 3 Mbps symmetric in the reference), and the lab's elapsed
deadlines cannot silently replace the reference's separation of usable-time
limit and validity window.

Accordingly:

- do not describe the current home catalogue as 3WEST parity;
- do not copy the reference table into checkout and imply that the router
  enforces it;
- do not reduce the existing customer service to match a lab setting;
- do not change an existing customer's price, remaining balance, speed,
  expiry or device entitlement without an approved migration and customer
  communication;
- do not describe a read-only provider quote as sale readiness; and
- do not sell a price/provider combination until collection, settlement,
  entitlement and router activation are all proven for that combination.

### 7.4 Product/device types

| Product type | Home-pilot status | Contract and enforcement needed |
| --- | --- | --- |
| Personal pass | A single observed device is documented as receiving its own native account, one simultaneous session, product speed/data snapshot and immutable expiry. | Approve the actual catalogue terms, supported-device behavior, private-address recovery and support handling before broader sale. |
| TV pass | Historical TV/static catalogue exists; the home product notes say TV sponsorship is not implemented. | Verify whether TV uses Wi-Fi or Ethernet MAC, pair the actual TV, authorize the TV rather than the paying phone, constrain its session/rate/expiry, and provide non-indefinite recovery. |
| Family pass | Proposed only; not implemented as a supported checkout entitlement. | Define number of enrolled devices and simultaneous devices, household-wide limits, shared expiry/data semantics, privacy, device replacement and payment/support responsibility. |
| Home-router pass | Proposed only; not implemented as a normal personal pass. | Explain that downstream devices behind NAT may appear as one connection; define aggregate household rate/data/device terms. Do not claim that downstream device count can be reliably enforced upstream. |

The example “three registered devices, three online, up to 3 Mbps each and
6 Mbps combined” in the pilot notes is an illustration only, not an approved
offer. Increasing a Wi-Fi access point count does not turn a single-device
entitlement into a household plan.

## 8. Device identity and sharing

The access mechanism identifies a network connection/device context; it does
not establish a human identity. MAC addresses can be changed or spoofed, and
private Wi-Fi addresses may change depending on device settings and operating
system. Customers should not be told to disable privacy globally as a routine
condition of purchase.

Customer policy must answer:

- Which device is eligible to receive a personal pass?
- Is entitlement bound at payment start, payment confirmation, or first
  successful connection?
- How does a customer recover if the phone changes its private address, is
  replaced, loses its browser session or cannot reconnect?
- Does a transfer revoke the old device, and does it preserve the original
  expiry, consumed time/data and payment reference?
- Are wired TVs supported, and how is their authorized identity verified?
- Is tethering permitted? If restricted, what can actually be detected and
  enforced?
- How are shared family devices registered without exposing a household's
  entire device list to another person?
- What support evidence may be requested without asking for credentials, PINs
  or unnecessary personal information?

The current pilot notes state that a customer's tethered phone or NAT router can
make multiple downstream users appear as one authorized connection.
MAC/session limits do not reliably count those downstream devices. A shared
connection still consumes the upstream allowance, but that is not proof of
who is using it. Publish a fair, technically supportable sharing rule rather
than claiming perfect anti-tethering.

## 9. Payment and access states

Customer copy and support must preserve these distinct states:

| State | Meaning | Appropriate customer-facing posture |
| --- | --- | --- |
| **Offer selected** | The customer chose a displayed product; no charge or access is implied. | Show the exact selected price and approved terms before the payment action. |
| **Payment requested** | The provider was asked to present/execute a payment. | Ask the customer to approve through the provider. Do not request their PIN. |
| **Awaiting provider result** | Mesh does not yet have a conclusive verified result. | Say that confirmation is pending; do not invite the customer to pay again. |
| **Payment verified** | The provider result matches the expected transaction and amount. | Explain that Mesh is preparing access; do not yet claim browsing is active. |
| **Settlement/delivery verified** | Required Bitcoin settlement/delivery is confirmed for the selected path. | Continue to access activation. Do not create a second settlement for the same transaction. |
| **Connecting** | An authorized entitlement/order exists and the gateway is being asked to apply it. | Keep the original purchase/reference and request in progress; provide a safe retry/status path that does not charge again. |
| **Active** | The correct gateway acknowledged the intended allowance. | Tell the customer to begin browsing, subject to site/WAN and package limits. |
| **Outcome uncertain** | The provider, controller or gateway result is missing, delayed or contradictory. | Preserve the original reference, investigate status, and block duplicate checkout for the unresolved device/purchase as designed. |
| **Expired/restricted** | The approved limit was reached or the validity ended; general access is restricted. | Explain that local entry and separately approved free services may remain, and offer a deliberate renewal path. |

The home records document recovery from a rejected `PENDING` acknowledgement
using the original key/payload, with no second charge or Bitcoin send. This is
important product behavior: a timeout or closed browser is not a reason to
start a second payment. Support should reconcile an existing purchase using
authorized records and avoid asking the customer to pay again while the result
is uncertain.

The customer sees one M-Pesa method in the documented flow. Bitika is the
preferred path recorded in the October 6 notes; Paystack/Engine is a separate
fallback route that uses a funded Bitcoin treasury. Do not tell customers
“automatic fallback” unless the exact behavior and price has been tested and
approved. The records explicitly prohibit blind provider retry on an uncertain
collection.

## 10. Outage, failure and recovery behavior

| Condition | Customer impact | Required behavior | Evidence/approval still needed |
| --- | --- | --- | --- |
| ISP/WAN unavailable | External websites, Signal, Blink and live payment cannot be relied on. Some local pages/services may continue if their hosts and routes remain available. | Keep the outage message local where possible. Do not describe external app exceptions as offline service or start an ambiguous charge. | Test each local path on target equipment; define operational notice and recovery ownership. |
| Mesh cloud/controller unavailable | New purchase verification or access activation may be delayed or unavailable; existing router-local expiry may continue independently. | Do not issue a false “connected” state. Preserve purchase references and allow safe status/reconciliation after recovery. | Verify the actual deployed design, outstanding-order behavior, alerting and field recovery. |
| Payment provider unavailable | New collection may fail or remain uncertain. | Explain that payment confirmation is not available; do not automatically send another provider prompt for an uncertain collection. | Approve package-by-provider readiness and support procedure for each price. |
| M-Pesa approved but Mesh result pending | Customer may have paid but not yet have a verified receipt/allowance. | Show pending/review state and a support route; preserve the original transaction reference. Never prompt for another payment as the first recovery action. | Test recovery on the target device and document safe receipt lookup without exposing private payloads. |
| Payment verified but gateway activation pending | The customer may be paid but still blocked from internet. | Show “connecting” or “activation pending,” not “connected.” Continue/reconcile the original grant without charging again. | Field acceptance of delayed acknowledgement, browser closure, reconnect and eventual expiry. |
| Browser/captive window closes | The customer may not see status though the payment/activation process may continue. | Provide a persistent local entry or a safe return/status route; do not rely on keeping the operating-system popup open. | Verify iOS/Android full-browser and captive behavior on target equipment. |
| Router/AP or power failure | Customers may lose Wi-Fi, local portal and paid access. | Do not promise service through equipment/power loss unless redundancy is deployed and tested. Preserve the authoritative entitlement and expiry through recovery. | Site power and equipment recovery, backup, alert and restore acceptance. |
| Pass expiry | General internet is no longer authorized under that pass. | Keep the local purchase/status page reachable if equipment permits; do not reset allowance on reconnect or create a new grant without deliberate renewal. | Validate exact expiry semantics and router-side behavior. |
| Free exception fails | The named app/site may be unavailable even though the pass is not required for its approved scope. | State the specific app/site is temporarily unavailable; do not silently open general internet. | Maintain a service dependency check and narrowly scoped rollback. |

No service-level target, availability percentage, outage compensation or
response time is approved by this draft.

## 11. Support, fairness and privacy

### 11.1 Support process that must exist before field sale

Before customers are asked to pay, publish a reachable support route and assign
an accountable operator. The channel itself, hours, languages and response
targets are **not recorded here** and must not be invented in marketing copy.

The support procedure should distinguish:

- no payment prompt received;
- prompt approved but provider confirmation pending;
- payment verified but access not acknowledged;
- access acknowledged but external browsing fails;
- pass expired or limit reached;
- voucher invalid, already used or rate-limited;
- private-address/device replacement or lost browser session;
- external free app/site dependency unavailable; and
- suspected duplicate collection or a financial discrepancy.

Ask only for the minimum approved lookup details. Never request an M-Pesa PIN,
wallet seed phrase, router password or reusable account secret. Avoid collecting
raw payment payloads or full device identifiers in ordinary public
communications. Use protected support systems for necessary references and
follow the approved retention/privacy policy.

### 11.2 Fairness rules to approve

- A customer who has an unresolved payment must not be told to pay again before
  the original outcome has been checked.
- A verified payment should map to one clearly defined entitlement and not be
  silently shortened, duplicated or transferred.
- Recovery must not reset consumed time/data or extend the original deadline
  unless an explicitly approved correction is recorded.
- A valid voucher or payment must not be rejected merely because the customer
  closes the captive popup while a recoverable transaction remains in progress.
- Prices, package limits, device limits and expiry must be visible before
  purchase and consistent with enforcement.
- Free exceptions should remain available only to their published scope and
  must not silently grant general internet.
- Customers should not be blamed for a platform/provider outage or asked to
  disclose secrets as proof of purchase.
- Do not advertise that MAC binding prevents all pass sharing or that the
  service is encrypted end-to-end. Open Wi-Fi itself does not encrypt
  unprotected application traffic.

These are recommended product safeguards. The operator must approve them,
assign the remedy/escalation path and align them with applicable obligations.

### 11.3 Refunds and financial remedies

The source material describes safe handling of uncertain payment outcomes but
does not define an approved general refund policy, refund eligibility,
processing time or customer contact. This handbook therefore does not promise
a refund, automatic credit, bonus time or fee reimbursement. The responsible
finance/service owner must define and approve the remedy for:

- duplicate collection;
- collection without required settlement/delivery;
- successful payment without eventual router activation;
- partial outage after activation;
- incorrect price/term display; and
- a customer-requested cancellation where permitted.

Remedies must be recorded against the original payment and entitlement without
creating a duplicate charge, Bitcoin send or hidden allowance.

## 12. Launch scope and exclusions

### 12.1 Bounded home-pilot evidence

The October 6 pilot/readiness records document:

- one supervised KES 10 Bitika purchase with verified direct delivery of
  86 sats, a router acknowledgement and operator-reported browsing retry;
- one-device native access on the tested Primary gateway;
- the two-router home network and its tested link/WAN behaviors;
- foreground Signal text while unrelated general browsing was blocked;
- foreground refresh of an already-installed, signed-in Blink wallet on unpaid
  Mesh; and
- specific local/offline application experiments with both passed and failed
  cases recorded.

The physical acceptance of the revised checkout/captive handoff remained
pending in the source checkpoints. The October 22 field plan is proposed work,
not field deployment or signoff. The local laptop-hosted experiments were
paused on 14 October; the pause did not re-audit remote services. See
[Volume 00](00-start-here.md) for the wider evidence boundaries.

### 12.2 Not included as a launch promise without separate approval

- a 3WEST replacement, customer migration or unchanged service parity;
- the full 15-product reference catalogue as an operating Mesh offer;
- all historical TV products, TV sponsorship, home-router or family plans;
- multiple devices under one personal pass;
- roaming between gateways/sites or transferring an entitlement;
- a validated maximum client count, throughput, radio range or SLA;
- guaranteed screen-off or locked-screen messaging, push delivery, or
  emergency communication;
- offline Signal or Blink;
- guaranteed app-exclusive whitelisting on shared CDN/hosting IP addresses;
- app-store downloads, new-account registration, every Blink feature,
  wallet transfer or transaction;
- permanent availability of experimental Nostr/Blossom/Jami/Berty hosts;
- perfect prevention of tethering, resale, MAC spoofing or credential sharing;
- a general refund/compensation or support response guarantee; or
- legal ownership, licensing, privacy-compliance or regulatory-certification
  statements not approved by the relevant reviewer.

An item may move into scope only after its behavior, terms, implementation,
support path and site acceptance are recorded.

## 13. Decisions required before approval

| ID | Decision | Evidence or input needed | Approval needed from |
| --- | --- | --- | --- |
| P-01 | Is the initial customer offer a new Mesh segment, a continuation of the 3WEST offer, or a staged combination? | Site plan, existing customer/billing owner, service boundary and migration decision. | Product/service owner and current billing owner |
| P-02 | Which exact products and prices can be sold at launch? | Verified source export, current operator confirmation, catalogue parity and payment/settlement readiness per price. | Commercial/product and finance owners |
| P-03 | What exactly does each duration mean? | Purchase vs first-use start, connected-time counter, validity window, calendar/time-zone rules and expiry test. | Product owner and network/engineering |
| P-04 | Are rates per device or shared, and how are “up to” claims qualified? | Target gateway/AP measurements and queue behavior. | Product and network owner |
| P-05 | Is data unlimited or capped, and is there any FUP? | Verified source policy and customer-readable terms. | Product/commercial owner |
| P-06 | Which device types are supported? | Real-device acceptance for phones and any TV/wired/household path. | Product and operations owner |
| P-07 | What is the supported private-address/device-recovery process? | Tested recovery that preserves expiry/allowance and does not cause another payment. | Operations and product owner |
| P-08 | Which free services are in-scope, by feature and platform? | App/site endpoint matrix, internet dependency, IPv4/IPv6 policy, unrelated-site denial and physical phone tests. | Product and network/security owners |
| P-09 | Which provider is enabled for each product price? | Live configuration, quote/collection limits, settlement/liquidity and a bounded end-to-end acceptance per supported price. | Finance/payment owner |
| P-10 | What customer support route, hours and escalation apply? | Named staffed channel, privacy-minimized lookup process, incident roles and response targets. | Service/operations owner |
| P-11 | What are the refund and service-remedy rules? | Applicable obligations, provider capabilities, financial process and customer copy. | Authorized finance/legal/service reviewers |
| P-12 | Which languages and accessibility requirements apply? | Community/customer research and review of translated UI, error copy and support. | Product/community communications owner |
| P-13 | What availability, coverage and capacity language may be published? | Accepted site survey and measured capacity/recovery evidence. | Network/operations and product owners |
| P-14 | What governance/rights notices accompany the product? | Separate review of marks, content, dependencies, privacy notices and provider terms. | Authorized rights/privacy reviewers |

Do not fill undecided values with defaults from the code, a screenshot, a
historical provider quote or an illustrative design.

## 14. Acceptance checklist

Before approving a field customer-facing contract, the accountable reviewers
should be able to confirm:

- [ ] The service operator, billing owner and customer support route are named.
- [ ] The exact launch site/scope and supported network entry are stated.
- [ ] Every displayed package has an approved, verified price and currency.
- [ ] Usable time, validity start, time zone, expiry and any data/FUP behavior
  are explicit and match router enforcement.
- [ ] Rate terms accurately distinguish per-device and shared limits.
- [ ] Supported devices, simultaneous-device count, private-address recovery
  and tethering limitations are honestly stated.
- [ ] Payment-provider availability is verified for each displayed package.
- [ ] Payment, settlement, entitlement, gateway acknowledgement and customer
  status are separate, observable states.
- [ ] The uncertain-payment path preserves the original transaction and never
  asks for an avoidable duplicate charge.
- [ ] Free services are described by tested feature and dependency; no general
  internet or offline claim is implied incorrectly.
- [ ] Local purchase/status access and real iOS/Android captive behavior have
  been accepted on the target equipment.
- [ ] Outage, support, refund/escalation, privacy and data-retention text is
  approved and reachable.
- [ ] Existing customer entitlements and rollback are protected if migration
  is involved.
- [ ] Customer copy, visual assets, logo, fonts, photos and translations have
  the required review and provenance.
- [ ] An authorized product owner has dated and recorded approval.

## 15. Source records

This draft is based on the following internal project records. Their historical
dates and scopes remain part of the evidence; this chapter does not imply that
they were all re-tested on 22 October.

- [Documentation plan and Volume 01 brief](../mesh-documentation-plan-and-toc.md)
- [Mesh start here and evidence register](00-start-here.md)
- [3WEST catalogue and production review](../3west-production-readiness.md)
- [Home pilot decision, security and device plans](../mesh-pilot-readiness-and-device-plans.md)
- [Home-to-field production operations guide](../mesh-production-operations.md)
- [Proposed field deployment and administration plan](../mesh-field-deployment-plan.md)
- [Field deployment pack](02-field-deployment.md)
- [Captive welcome implementation notes](../mesh-captive-shell.md)
- [Captive brand, photography and typography record](../mesh-captive-art-direction.md)
- [Free-learning and app-entry record](../mesh-free-learning.md)
- [Blink unpaid-Mesh scope](../mesh-blink-free-access.md)
- [Signal foreground messaging trial](../mesh-signal-text-trial.md)
- [Jami local trial](../mesh-jami-local-trial.md)
- [Berty local trial](../mesh-berty-local-trial.md)
- [Bitika-first checkout and recovery boundaries](../mesh-bitika-primary.md)
- [Six-digit voucher behavior](../mesh-six-digit-vouchers.md)
- [Voucher artwork and print-proof status](../mesh-physical-voucher-cards.md)
