# Mesh scale and community governance

**Audience:** Project and community leads, site owners/custodians, network and
service operators, finance, product, support and partner reviewers  
**Document owner:** Mesh network governance owner role (individual not yet
recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Expansion framework and governance questions based on the current
home-lab evidence and project plans. This is not a community constitution,
funding approval, operating agreement, service contract, site authorization
or claim that a multi-site service has been deployed.

> **Scale the accepted service, not the diagram.** The current evidence is a
> two-router home network with link failover and a supervised single-gateway
> paid-access flow. It does not prove a third routing site, intermediate-node
> resilience, multi-gateway billing/roaming, community ownership, field
> capacity or decentralized operations. Expansion requires an accountable
> owner, site-specific authorization, measured need, a recovery path and
> evidence for the new failure domain.

## Contents

- [1. Purpose and evidence boundary](#1-purpose-and-evidence-boundary)
- [2. Current network and service maturity](#2-current-network-and-service-maturity)
- [3. Scaling principles and expansion gates](#3-scaling-principles-and-expansion-gates)
- [4. First-site operating model](#4-first-site-operating-model)
- [5. Adding access points versus gateways](#5-adding-access-points-versus-gateways)
- [6. Multi-site topology and addressing](#6-multi-site-topology-and-addressing)
- [7. Node enrollment, authority and lifecycle](#7-node-enrollment-authority-and-lifecycle)
- [8. Accounting, passes and roaming](#8-accounting-passes-and-roaming)
- [9. Local autonomy and disconnected operation](#9-local-autonomy-and-disconnected-operation)
- [10. Capacity, cost and sustainability](#10-capacity-cost-and-sustainability)
- [11. Community governance and accountability](#11-community-governance-and-accountability)
- [12. Research and expansion roadmap](#12-research-and-expansion-roadmap)
- [13. Decisions and approval register](#13-decisions-and-approval-register)
- [14. Source records](#14-source-records)

## 1. Purpose and evidence boundary

This chapter describes how Mesh could grow from a supervised one-site offer
into a network of independently operated sites without overstating what the
current software or home-lab topology supports. It identifies technical,
commercial and community decisions that need owners.

It is deliberately not a promise of decentralization, community ownership,
coverage, open participation or affordable prices. The records reviewed do not
establish a legally constituted Mesh cooperative, a community decision-making
body, an approved site compensation model, a funding commitment, a per-site
budget or an authorized multi-operator federation. Those require explicit
decisions and, where relevant, legal and financial review.

Use these distinctions throughout:

- **Observed:** directly reported or measured in a dated record for its stated
  equipment, software, site and test.
- **Implemented:** present in checked-out source or a specified deployment;
  implementation alone does not prove field behavior.
- **Proposed:** a design or expansion criterion awaiting owner approval and
  acceptance.
- **Decision required:** no approved policy or accountable owner is recorded.
- **Unknown:** not established; do not assume favorable behavior.

The relevant current evidence includes:

- two routed lab sites, each with an AP/client subnet, OSPF over preferred
  Ethernet and alternate radio transit, and tested link failover/failback;
- no accepted third routing site or proof that traffic survives loss of an
  intermediate router;
- one enrolled paid-access gateway lane, specifically associated with the
  Primary lab gateway, not a fleet;
- a supervised home purchase/activation result, not a field service or
  network-wide pass;
- optional local service experiments hosted on computers, which the 14 October
  record says were paused locally; and
- a proposed supervised field rollout plan whose inventory, site acceptance,
  capacity and ownership gates remain evidence-dependent.

See [Volume 00](00-start-here.md) for the evidence register and
[Volume 02](02-field-deployment.md) for the site deployment gates.

## 2. Current network and service maturity

### 2.1 A network is not one interchangeable “mesh”

For planning, distinguish these layers:

1. **Access:** APs provide Wi-Fi to resident devices.
2. **Routing:** routers exchange assigned IP prefixes over approved transit
   links.
3. **Internet gateway:** one or more gateways connect customer traffic to an
   ISP and enforce paid/free policies.
4. **Control and billing:** cloud application/database, provider paths and
   controller coordinate payment/access workflows.
5. **Local applications and storage:** separate hosts provide chosen local
   functions and content.
6. **Governance:** people and organizations authorize sites, customer terms,
   data access, policy, funding and accountability.

Changing one layer does not automatically scale the others. An added AP can
increase radio coverage without adding ISP capacity. A routed site does not
automatically become a paid-access gateway. A new site does not inherit a
pass, customer data, payment role, local services or administrative authority
merely because it has IP reachability.

### 2.2 Maturity table

| Capability | Evidence recorded | What remains before expansion |
| --- | --- | --- |
| Two-site IP reachability | Home lab routes between the two client networks; Ethernet is preferred and radio carries traffic when the Ethernet link fails | Field survey, measured range/capacity, configuration recovery and actual site acceptance |
| Link redundancy | Failover/failback of two links between the same router pair | Independent node/site failure path; two links do not survive loss of either router |
| Third-site routing | Proposed as the next topology proof | No third router/site acceptance or A–C alternate path around B is established |
| One-gateway access | Primary lab gateway has a recorded supervised purchase/access flow | Field enrollment, packet-path/expiry acceptance, target package parity and measured user capacity |
| Multi-gateway operations | Site-scoped enrollment and per-gateway ownership appear in plans | Fleet registration, independent identities, policy ownership, billing/accounting, roaming and recovery are not a supported network-wide product |
| Local-service hosting | Nostr/Blossom and messaging experiments have dated lab evidence | Local runtime is paused per 14 October record; current availability, backup, moderation, privacy and site ownership need verification |
| Community governance | Planning documents identify roles and open decisions | No approved governance charter, membership model, voting method, operator agreement or cost-sharing policy is recorded |

### 2.3 Central dependencies today

The long-term project vision may include community-operated sites and local
services. The current paid-access architecture still relies on centralized
application/database and controller functions, external payment/settlement
providers, and each site's ISP/gateway. Local routing can continue during some
WAN failures, but new online purchases and cloud reconciliation depend on
external services. Do not describe the present billing/control plane as
decentralized merely because traffic traverses multiple routers.

## 3. Scaling principles and expansion gates

### 3.1 Principles

1. **Prove one step before adding the next.** A second AP, second gateway,
   third routed site, offline controller and multi-operator service are
   distinct changes with distinct failure modes.
2. **Keep customer ownership explicit.** Every offer/site has one accountable
   service and billing owner, even if several organizations contribute
   equipment or support.
3. **Use unique identities and assigned scope.** New nodes must not copy
   lab keys, router IDs, prefixes, global queue credentials or inherited
   customer authority.
4. **Separate routing from entitlement.** IP reachability does not transfer
   a purchased allowance, billing authority, free-service policy or customer
   support responsibility.
5. **Capacity follows measurement.** Set admission limits from the actual
   gateway, backhaul, AP airtime, ISP and application policy under load.
6. **Design recovery before deployment.** Each site needs a custodian, local
   recovery access, backup/restore procedure and an operator able to act when
   the central platform is unreachable.
7. **Minimize shared blast radius.** A site operator should receive only the
   credentials, data and control authority needed for that site and role.
8. **Make free and paid resources transparent.** Agree who funds ISP, power,
   equipment, support and complimentary services, and state what happens when
   those resources are exhausted.
9. **Keep the long-term objective separate from present capability.** A
   roadmap describes intended evolution; it is not proof that the existing
   service is distributed, self-governing or resilient.
10. **Do not scale unresolved customer terms.** Resolve package validity,
    device count, sharing, support, privacy and remedies before multiplying
    sites or operators.

### 3.2 Expansion gates

Treat expansion as a gated sequence, not an informal “add another node” task:

| Gate | Expansion step | Evidence before proceeding |
| --- | --- | --- |
| G0: service definition | Select a specific new coverage or service need | Named sponsor/service owner, intended users, scope, approved terms, exclusions, support and funding assumptions |
| G1: current site proven | Establish a baseline at the operating site | Accepted topology/config/version, measured demand and capacity, incident/restore history, customer feedback and known limits |
| G2: site feasibility | Survey candidate location | Permission/access, ISP/backhaul, RF/channel, power, mounting, security, local custodian, cost and safe recovery |
| G3: isolated technical proof | Add a test segment or spare equipment | Unique identity/addressing, secure management, guest isolation, route policy, backup, rollback and test authorization |
| G4: service integration | Decide whether the site only routes, hosts local services, or enforces paid internet | Precisely scoped controller, billing, customer ownership, policy, provider and operational responsibilities; no implied roaming |
| G5: failure/capacity acceptance | Exercise representative load and relevant failures | Preapproved thresholds, client/radio/backhaul measurements, recovery and reconciliation results, no loss of management or customer state |
| G6: governance and economics | Approve operating model | Owner/partner agreements, cost allocation, treasury/records where applicable, data/privacy roles, support and exit terms |
| G7: limited opening | Admit users under the approved offer | Signed site acceptance, named contacts, public wording, admission envelope, monitoring, rollback trigger and review date |

Passing one site gate does not approve a different site; each site has unique
physical, ISP, power, radio, ownership and regulatory conditions. A site may
be a community IP transit peer without becoming a customer billing gateway.

## 4. First-site operating model

### 4.1 Proposed roles

The roles below are responsibilities to assign, not confirmed people or
existing organizational units:

| Role | Accountable for | Must not be assumed |
| --- | --- | --- |
| Mesh service/product owner | Customer offer, product scope, public wording and approved feature list | Router engineering or financial custody by default |
| Site owner/host organization | Permission to use location, physical access and agreed site obligations | Ownership of all Mesh code, customer data or funds |
| Site custodian | Equipment inventory, power/site condition, authorized hands-on recovery and local incident contact | Unrestricted administrator access or customer-support authority |
| Network operator | Addressing, routes, AP/gateway policy, monitoring, config backup and network recovery | Authority to change customer contract or financial destination |
| Access/billing operator | Approved catalogue, provider readiness, purchase/order reconciliation and customer remedies | Authority to alter network topology or use treasury without controls |
| Controller/platform operator | App/database/controller releases, scoped credentials, monitoring and tested recovery | Ownership of site equipment or authority to issue unreviewed site policy |
| Support contact | Customer communication, case capture and escalation | Ability to request PINs, seeds, full payment payloads or router credentials |
| Finance/treasury owner | Collection/settlement reconciliation, fees, balances, accounting and approvals | Automatic substitution for the customer-facing service owner |
| Privacy/security reviewer | Data access, retention, incident handling and security approval within assigned remit | Operational access to every account absent a need |
| Community liaison | Resident consultation, accessible explanation, feedback and notice coordination | Legal consent, financial approval or technical acceptance alone |

One person may hold more than one role at a small pilot, but the assignment
must be documented, conflicts and high-risk approvals identified, and a
second recovery contact provided. Do not imply separation of duties when one
person controls approval, money movement, deployment and audit without
independent review.

### 4.2 First-site principles

The field plan proposes a supervised site with one paid-internet gateway,
retaining the current application/database/controller and adapting the
verified site equipment. It also requires existing customer service to remain
under its present billing owner until a controlled migration is approved.

Before opening the first site, record:

- who owns the customer-facing offer and is responsible for complaints;
- who may authorize and inspect payments, settlement and access changes;
- who physically controls the gateway/AP and can recover it locally;
- who may approve a production configuration/release and who can roll it back;
- whether any site host/partner contributes premises, power, bandwidth,
  equipment or support and what they receive in return;
- what service is free, what is charged, what stops during an outage and who
  pays recurring costs;
- what customer and network data is collected, who can see it and for what
  purpose; and
- how an operator, host or partner may exit without stranding the site or
  customer records.

Use a written site memorandum/agreement reviewed by the relevant authorized
owners. This handbook supplies questions and operational roles, not legal
terms or conclusions.

### 4.3 Responsibility matrix

Complete a private, site-specific RACI or equivalent matrix. “R” is
responsible for performing work, “A” is the single accountable decision role,
“C” is consulted and “I” is informed. Multiple contributors may be R/C/I, but
each consequential decision should have a recorded accountable owner.

| Decision/work | Product/service owner | Site owner/custodian | Network operator | Finance owner | Platform operator | Community liaison |
| --- | --- | --- | --- | --- | --- | --- |
| Approve offer and service wording | A | C | C | C | I | C |
| Approve site location and access | C | A | C | I | I | C |
| Approve site network design | C | C | A/R | I | C | I |
| Enroll/retire gateway identity | A | C | R | I | R | I |
| Approve price/provider path | A | I | I | R | C | I |
| Reconcile a payment issue | C | I | I | A/R | C | I |
| Apply router/AP change | I | C | A/R | I | C | I |
| Restore controller/application | I | C | C | C | A/R | I |
| Respond to customer complaint | A | C | C | C | C | R/C |
| Approve data retention/access | A | I | C | C | R | C |
| Suspend service for safety/security | A | C | R | C | R | I |
| Approve public incident statement | A | C | C | C | C | R/C |

This example is a discussion aid, not an approved assignment. Replace role
labels with named people/organizations and revise assignments to fit actual
capability, conflicts and local obligations before operation.

## 5. Adding access points versus gateways

Adding radio coverage and adding an independent enforcement gateway have
different effects on customer terms, identity, billing, support and failure
domains.

| Change | Potential benefit | New obligations/risks | Minimum proof |
| --- | --- | --- | --- |
| Additional AP behind the existing gateway | Extends coverage in a planned access domain | VLAN/bridge transport, roaming behavior, airtime, isolation across APs, power/PoE, management and aggregate gateway load | Survey; test each SSID/band/AP, peer isolation, DHCP/DNS, reassociation, throughput/latency and unchanged entitlement |
| Routed transit node without customer access | Extends IP reachability or alternate path | Unique prefix/router ID, peer authorization, route filters, loop/failure behavior, management trust and physical custody | Peer admission, assigned route readback, end-to-end path, withdrawal/recovery and unauthorized-peer rejection |
| Customer AP at a routed site, one central gateway owns the service | Extends reach to a central access-control point if the intended guest domain is safely transported | L2/VLAN scope, broadcast size, MAC visibility, routed path, shared failure/capacity and central gateway dependence | End-to-end guest policy, correct source identity, isolation, DHCP, measured load and gateway-loss behavior |
| New customer enforcement gateway | Local policy or site independence may be possible | New enrollment identity, billing ownership, package/expiry semantics, payment and order scope, customer support, keys, backups, monitoring and field adapter acceptance | Full separate-gateway commissioning, isolation, purchase/activation/revoke/expiry, recovery and clear pass portability terms |
| New local-service host | Local content or application service at another site | Host lifecycle, data ownership, naming/discovery, access control, consent, moderation, replication, storage, backup, power and support | Service-specific acceptance on WAN loss, host loss/restart and remote-node access |

An AP is not automatically an IP router. A routed node is not automatically
an internet gateway. A gateway is not automatically entitled to administer
another gateway's customer service.

### 5.1 AP expansion limits

Before adding APs, establish whether the design is one intentionally shared
customer access domain or multiple routed customer domains. Routed transit
does not automatically extend a guest VLAN, DHCP scope or customer identity.
Validate permitted VLANs, tagging, client isolation, AP-to-AP traffic,
broadcast and DHCP behavior, IPv4/IPv6, captive detection, private MAC
behavior, roaming and firewall enforcement at the actual physical edge.

Additional APs can move the bottleneck to the gateway, backhaul, shared ISP,
radio airtime, channel interference or power. Capacity is not AP count
multiplied by a marketing association limit. Follow [Volume 09](09-operations.md)
and [Volume 04](04-ip-network.md) for measured acceptance.

### 5.2 When to add another gateway

Consider a separate enforcement gateway only when there is a documented need
that cannot be met by additional APs behind the existing gateway, and the
operator can support a separate trust and billing scope. Potential drivers
include a separate ISP/site owner, a physical failure boundary, distinct
customer policies or a topology where central forwarding is not viable.

Before approval, decide:

- whether the gateway owns separate customers, packages and access orders;
- whether a pass works at only one site or can be transferred/roamed;
- who observes the customer's device and issues/claims only its own orders;
- whether one device can have concurrent sessions at two gateways;
- how revocation and expiry work if controller connectivity is lost;
- how financial records match the site and gateway;
- what happens to customers if the gateway is sold, retired or disconnected;
- who holds its scoped keys and can revoke them; and
- how the new gateway is backed up, restored, upgraded and physically
  recovered.

Until these are implemented and accepted, do not sell a “network-wide,”
“roaming” or multi-device pass based only on routing reachability.

## 6. Multi-site topology and addressing

### 6.1 Topology sequence

The current accepted lab consists of two routers with two links between the
same pair. It proves link failover/failback in that topology, not arbitrary
multi-hop routing or node resilience. A proposed progression is:

1. **Document and reproduce the existing two-site configuration** with unique
   node identities, prefixes, protected transit roles, management restrictions
   and verified backup/rollback.
2. **Add a third routed test site** and show A-to-B-to-C reachability for
   assigned prefixes.
3. **Add an independent A-to-C path** (or equivalent separately engineered
   path), then remove B from the topology within an approved lab test.
4. **Measure convergence and service effects:** route withdrawal, packet loss,
   DNS/local service reachability, customer management isolation and restoration.
5. **Repeat on the intended hardware/software and site geometry** before
   claiming field multi-hop or failure tolerance.

The second A-to-C path matters: a three-node line does not route around B.
Multiple links that terminate on the same two routers do not tolerate the loss
of either router.

### 6.2 Address and route registry

Maintain a private, authoritative registry before adding sites. Each site/node
record should include:

- stable Mesh site ID and router ID, owner/custodian and lifecycle state;
- assigned client, management, transit and optional-service prefixes;
- WAN/default-route authority and allowed origination conditions;
- transit peer IDs, link type, interface roles and authentication/key
  references;
- AP/SSID/VLAN mapping and the authorized customer network boundary;
- route advertisements, permitted summaries and rejected/unknown prefixes;
- DNS/local-service naming and which paths require WAN;
- controller enrollment, service/billing ownership and approved gateway scope;
- software/config revision, backup, recovery contact and last verification;
- physical location and access information in a restricted record; and
- planned change, decommissioning and address-reuse procedures.

Check overlap against ISP/private upstream ranges, other Mesh sites, tunnel
peers, VPN clients and local-service networks before allocation. The lab
prefixes are evidence, not a reusable field address plan. Do not publish
management addresses, exact location data or credentials in an open topology
map.

Only authorized transit interfaces should form routing adjacencies. Customer
interfaces must not become routing peers. Authenticate peers where supported,
filter accepted/advertised prefixes, define default-origin ownership and test
unauthorized peer rejection. A route is not accepted merely because it appears
in a diagram or an admin UI.

### 6.3 Failure domains

Draw physical and logical dependencies for each expansion: sites, routers,
APs, power feeds, towers/buildings, ISP circuits, tunnels, DNS, cloud region,
database, payment providers, storage hosts and responsible operators. Two
paths may share the same tower, power, router, ISP duct or host and therefore
fail together.

For each claimed alternate path, record:

1. the component actually removed or made unavailable;
2. whether the failure was physically/logically independent;
3. the routes and traffic that remained;
4. convergence time, loss/latency and customer impact;
5. whether management and recovery stayed available;
6. whether app, payment and entitlement state remained correct; and
7. restoration and failback behavior.

Network path resilience does not by itself replicate content, preserve an
internet session across gateways, move a pass or make cloud purchase services
available.

## 7. Node enrollment, authority and lifecycle

### 7.1 Enrollment is an authority grant

Enrolling a router/gateway authorizes a specific identity to communicate with
defined control APIs and potentially affect customer access. Treat it as a
security and governance approval, not a convenience setting.

Each node should have a unique identity and scoped credentials, a pinned
management endpoint/host identity where applicable, an approved site profile,
explicit owner, allowed operations and revocation route. A node must not share
another site's key, serial, queue authority or customer scope. The existing
paid-access lane is recorded for one specific lab gateway; Node2's role in
transporting lab traffic does not make it a second paid customer gateway.

### 7.2 Admission checklist

Before a node is accepted:

- verify physical owner/permission and accountable site custodian;
- inspect exact model, serial, software, interfaces, power, uplink and recovery
  access;
- reserve unique router/site IDs and non-overlapping prefixes;
- document trust zones, transit peers, default-route scope and AP customer
  mapping;
- prove configuration backup and local recovery without depending on the path
  being changed;
- provision a unique, least-privilege credential through the approved secure
  process and test its scope;
- register the exact gateway/controller owner and allowed policy lane;
- state whether it routes only, serves clients, enforces paid access or hosts
  a local app; these are separate capabilities;
- verify all supported packet paths and guest/management separation;
- exercise upgrade, rollback, revoke and decommission procedures in a safe
  test setting; and
- record acceptance signatures/approvals, evidence location and next review.

No fleet wizard or automated multi-site enrollment is established as a
supported product in the reviewed plan. Operator-assisted manifests can be a
controlled first step if identity, change review and audit are enforced.

### 7.3 Lifecycle states

Use explicit lifecycle states in the private inventory:

| State | Meaning | Allowed posture |
| --- | --- | --- |
| Proposed | Candidate node/site only | No credentials, route advertisement or customer claim |
| Surveyed | Ownership, physical feasibility and candidate dependencies inspected | No production route or paid access until authorized |
| Test-enrolled | Unique identity and isolated scope accepted for bounded tests | Synthetic/specified test only; explicit expiry/owner |
| Service-active | Signed acceptance for named routes/services and owner | Only recorded capabilities and policy; monitoring and recovery required |
| Suspended | Access/routing/service intentionally held | Preserve records; no new customer scope; state reason and restoration authority |
| Retiring | Planned orderly removal and customer/service transition | Drain/revoke dependent use; archive evidence; do not orphan entitlements/data |
| Retired | Credentials revoked and routes/configuration removed or safely disabled | Preserve permitted records and prevent identity reuse ambiguity |

When a site leaves the network, remove its allowed prefixes and peer trust,
revoke its credentials, address its customer obligations, account for stored
data and equipment ownership, and update monitoring/inventory. Do not simply
power off a node if it is a route/default gateway or data host for others.

### 7.4 Site authority and escalation

A node custodian may report a physical issue and execute specifically delegated
safe tasks; they do not automatically receive admin access to customer records,
payments or other sites. A central platform operator may maintain service
software without automatically owning premises, customer terms or community
content. Record each access grant by person/role, scope, approver, reason,
expiry/review and revocation evidence, consistent with [Volume 08](08-security-and-privacy.md).

## 8. Accounting, passes and roaming

### 8.1 Current pass scope

The accepted purchase/access example is one observed customer device on one
enrolled gateway. A successful IP route between sites is not evidence that
the gateway at the second site knows the payment, owns the entitlement or will
enforce the same expiry/rate/data policy.

Before a pass spans sites, decide and implement:

- whether purchase selects a site/gateway or a network-wide service;
- whether the same device identity can be observed consistently across
  gateways and APs;
- whether one entitlement has one active session or several concurrent
  sessions;
- how simultaneous claims are serialized and how stale gateways are handled;
- how consumed time/data, disconnects, pauses and wall-clock validity work;
- how a site change or device replacement transfers remaining value without
  resetting or duplicating it;
- who funds each gateway's traffic and which operator receives revenue;
- how provider, gateway and customer records reconcile by site; and
- what the customer sees when roaming is unsupported or a destination site is
  full/unavailable.

Until these choices are supported by exact state transitions and acceptance,
market each pass as site/gateway-bound according to the approved product
contract. Do not infer roaming from common SSID names, shared routing or
database connectivity.

### 8.2 Accounting and RADIUS/NAS decision

The current native design is gateway-scoped and uses its own signed
observation/order/acknowledgment path. Adding RADIUS/NAS accounting or replacing
that design is not automatically beneficial and is not required by the
existing one-site plan.

Revisit centralized AAA/accounting only when measured requirements exceed the
current design, such as a documented need for interoperable gateways, roaming,
central session accounting, partner-operated access nodes or a specific
compliance/finance report. Before a change, compare:

- supported gateway vendor/protocol coverage and failure behavior;
- accounting update/stop reliability and missing-event reconciliation;
- session identity and duplicate/concurrent authorization semantics;
- offline behavior, local expiry/revocation and re-connect reconciliation;
- integration and migration cost versus the current native controller;
- credential trust boundaries and per-operator/site authorization;
- customer plan compatibility and historic balance/expiry mapping; and
- operational expertise, support, backup and independent test capacity.

Use a written decision record with measurable triggers and a rollback plan.
Do not introduce RADIUS solely because the network is called a mesh.

### 8.3 Multi-operator settlements and financial accountability

If sites have different operators, the commercial model must specify who
contracts with customers, collects KES, handles provider fees/taxes/refunds,
funds any treasury-backed settlement, pays the ISP/site host and reconciles
shared use. A technical usage counter does not automatically constitute a
financial ledger or settle partner allocations.

Do not split customer funds or promise site revenue share based on unverified
router counters. Establish an auditable allocation method, dispute process,
approval authority, statement cadence and qualified financial/legal review
before any multi-party settlement.

## 9. Local autonomy and disconnected operation

### 9.1 What local continuity means today

The home topology recorded local inter-router communication and local-service
reachability during WAN loss. That does not mean every Mesh function remains
available. External apps, cloud checkout, provider collection, hosted control
endpoints and online reconciliation require their corresponding dependencies.
Optional local service hosts have their own power/data/startup requirements,
and the computer-local experiments were paused in October.

Do not use “self-sufficient,” “fully decentralized,” “works entirely offline”
or equivalent claims for the current service.

### 9.2 Autonomy is a set of explicit design choices

A future site may be able to provide a subset of local functions while
disconnected, but each requires its own design:

| Function | Local-autonomy question |
| --- | --- |
| Packet routing | Which routes and local services remain when transit/WAN fails? How are loops/partitions controlled? |
| Existing paid access | Are valid grants enforced locally until exact deadlines? What revocations/updates are delayed? |
| New paid access | Is offline sale prohibited, deferred or supported by a locally verifiable entitlement? How does it avoid duplicate spending/allowance after reconnection? |
| Customer identity/device | What identity can be verified without cloud contact, and how are private MAC changes/recovery handled? |
| Voucher redemption | Can the site verify a one-use voucher offline without double redemption at another disconnected site? |
| Free internet exceptions | Which functions are truly local and which depend on external IP addresses/push/providers? |
| Local communications/content | Where does service/data live, how are peers discovered, and what happens at host loss? |
| Logs and audit | What is held locally, protected from alteration, minimized, and reconciled after reconnect? |
| Configuration updates | How can a site validate/safely stage policy and recover without central reachability? |
| Clock and expiry | What trusted time remains after power loss or clock drift? How are deadlines preserved? |

Offline multi-site operation creates partition and conflict questions. The
design must define whether each authority is single-writer, what data can be
used locally, how duplicate claims are prevented, and which system wins during
reconciliation. Do not casually promise offline voucher sales or pass roaming.

### 9.3 Decentralization roadmap language

Describe decentralization as dimensions rather than a binary:

- **data-plane distribution:** multiple routers carry traffic;
- **site control:** each site can operate/repair its local infrastructure;
- **service hosting:** chosen applications/data run on community-controlled
  hosts;
- **identity and enrollment:** sites can admit/retire nodes under transparent
  authority;
- **billing/payment:** financial decisions and settlement are not dependent on
  one platform/operator, or have a tested transparent alternative;
- **governance:** rules and changes have accountable community participation;
- **recovery:** no single unavailable operator/host can permanently strand
  sites or community data.

Current evidence most directly supports a bounded distributed IP data path in
the two-node lab. It does not establish the other dimensions as decentralized.
Record each future milestone, responsible party, dependencies and acceptance
evidence separately.

## 10. Capacity, cost and sustainability

### 10.1 Measure need before purchase

The available records do not establish an approved first-site budget, recurring
cost, community demand forecast, per-user cost, revenue, funding source or
hardware purchase. Do not invent a unit price or claim economic sustainability.

Before site expansion, gather and source:

- candidate households/users and expected peak concurrent devices;
- coverage/service needs and existing access alternatives;
- ISP circuit type, monthly fee, installation/contract/usage terms and
  measured busy-hour capacity;
- radio/backhaul equipment, towers/mounts, cabling, installation and
  permissions;
- router/AP/controller/service host, storage, spares, licenses and replacement
  cycle;
- energy consumption, outages, backup-power runtime, batteries and replacement;
- cloud/database, DNS/TLS, tunnel, provider and payment/settlement charges;
- support, site visits, training, safeguarding and maintenance labor;
- voucher print, retailer handling, cash reconciliation, breakage and
  inventory; and
- taxes, insurance, security/privacy review and contingency where applicable.

Use quotes and measured consumption with dates and currencies. Separate
one-time capital expenses, recurring operating costs, variable per-user costs
and contingent costs. State exchange-rate assumptions and sensitivity where
foreign-currency infrastructure is paid from local funds.

### 10.2 Unit-economics worksheet

Complete this worksheet privately with evidence; an empty cell is not zero:

| Measure | Definition / source | Value and date |
| --- | --- | --- |
| Installed site capital | Equipment + installation + initial permissions/spares | |
| Monthly fixed operating cost | ISP + cloud/database + site/power baseline + support | |
| Variable cost per active user | Metered data/provider/voucher/support effects as applicable | |
| Expected peak concurrent users | Measured demand or clearly labeled survey estimate | |
| Measured sustainable capacity | Accepted user experience at the exact policy/configuration | |
| Gross collections | Verified customer collections, not quotes or initiated prompts | |
| Provider/settlement costs | Fees and separately recorded settlement costs | |
| Shared/free-service allocation | Explicitly approved source and cap/budget | |
| Maintenance/replacement reserve | Approved method, amount and custodian | |
| Net operating position | Defined period and formula; reconcile to bank/provider/treasury records | |
| Subsidy or partner contribution | Source, restrictions, duration and expiry | |
| Service interruption impact | Who bears cost/communication duty during outage | |

Illustrative calculation only:

```text
monthly operating gap =
    recurring fixed cost
  + measured variable delivery cost
  + approved maintenance reserve
  - net settled service receipts
  - committed, unrestricted contributions
```

This is a planning identity, not a forecast. Do not count a quote, pending
collection, unsettled provider balance, donated equipment without replacement
cost, or uncommitted grant as spendable recurring income.

### 10.3 Free and paid resource budgets

Free educational and app exceptions consume shared WAN capacity, airtime and
support even when users do not buy a pass. Decide whether those resources are
subsidized, capped, restricted to named features or provided only while
capacity is available. Inform users if a free feature may be withdrawn or
temporarily limited, subject to approved terms.

Paid traffic does not imply priority over safety or network integrity. Define
fair-use and congestion behavior in the product contract; do not throttle
individuals based on unreviewed assumptions or claim a user cap can guarantee
perceived speed. Measure the aggregate gateway/ISP and protect operational
headroom.

### 10.4 Sustainability and maintenance

Every site requires people and time for:

- equipment inventory and safe physical access;
- monitoring, provider/payment reconciliation and customer support;
- configuration/software updates, security response and key custody;
- power, cable/radio inspection and hardware replacement;
- training and handover when a custodian/operator changes;
- restoring service and community data; and
- transparent reporting of service health, costs and changes.

Do not assume volunteers are continuously available or that a donated device
has zero lifetime cost. Document skills, backup coverage, training time,
support channel and the minimum funded maintenance budget before public launch.

## 11. Community governance and accountability

### 11.1 Governance is not implied by network participation

Joining Wi-Fi, hosting an AP, contributing bandwidth, paying for a pass or
using a local service does not automatically confer ownership or a vote over
every part of the Mesh project. Conversely, technical administrators should
not make unreviewed commercial, community-content or privacy decisions merely
because they hold credentials.

No approved constitution, membership model, operator council, voting
procedure, revenue-sharing policy or community dispute mechanism is found in
the reviewed records. The framework below is a list of issues for an
authorized group to decide, not a proposed legal entity or binding rule.

### 11.2 Minimum governance questions

Before inviting additional site operators or residents into a shared service,
record decisions on:

1. **Purpose and scope:** who the service is intended to serve, how priorities
   are set, and what the network does not promise.
2. **Membership/participation:** who may propose a node or service, who may
   approve it, and whether residents, hosts, maintainers and customers have
   different participation rights.
3. **Operator authority:** who can configure routes, paid policy, free
   exceptions, user accounts, moderation and payment settings.
4. **Community data:** who controls access, retention, deletion, exports,
   backups and incident response for each service.
5. **Costs and contributions:** how cash, bandwidth, power, premises,
   equipment and labor are recorded and whether any contribution is
   compensated.
6. **Customer accountability:** which entity/role owns the offer, support,
   receipts, disputes, refunds and customer notice.
7. **Changes and emergencies:** approval thresholds, maintenance notice,
   emergency isolation authority, evidence preservation and later review.
8. **Abuse and fairness:** reporting, investigation, privacy, proportionate
   restriction, appeal and reinstatement.
9. **Conflicts of interest:** disclosure and independent approval where an
   operator controls funds, procurement, data or a decision affecting their
   own site.
10. **Exit and continuity:** how a host/operator may leave, who retains
    equipment/data, how credentials are revoked, customers are transitioned
    and service is safely retired.
11. **Transparency:** what service, cost, capacity, outage and decision
    information is shared publicly, with what privacy/security redactions.
12. **Review:** how residents/operators can challenge a rule and how often
    policies and site agreements are reconsidered.

### 11.3 Change classes and approval model

Define approval levels before scale. A starting discussion model:

| Change class | Example | Approval expectation to decide |
| --- | --- | --- |
| Routine reversible maintenance | Certificate renewal, reviewed patch, planned local service restart | Named service owner/operator under a documented runbook; notice as terms require |
| Site-local configuration | AP channel, VLAN, gateway policy or node credential replacement | Site custodian plus authorized network/security owner; test/rollback record |
| Customer/product change | Price, validity, speed, free-service scope, sharing, support or retention | Product/service owner, finance/privacy reviewers as applicable, affected-site/community notice |
| Multi-site/network change | New route peer, default gateway, prefix, shared controller or pass portability | Network owner and each affected site owner; security, capacity and recovery evidence |
| Financial/treasury change | Receiving destination, provider, settlement, fee treatment or revenue allocation | Authorized finance/treasury owner plus independent approval and reconciled evidence |
| Emergency containment | Isolate a compromised gateway or stop new sales during a critical failure | Predelegated incident authority; prompt notice and post-incident review |

The responsible project group must define quorum, veto/stop authority, notice,
appeal and the exact roles for each class. This sample is neither adopted
policy nor legal advice. Keep technical approval separate from permission to
change customer terms or move funds.

### 11.4 Transparency without unsafe disclosure

Possible community reporting includes:

- active sites and broad service areas at a level that does not expose
  sensitive physical/security details;
- which services are local, external/free-without-pass or paid;
- service hours, known limits and measured capacity methodology;
- aggregated availability/outage and support outcomes;
- aggregated collections, fees, maintenance cost and subsidy sources where
  approved;
- dates and reasons for significant policy/site changes; and
- a clear contact and dispute/reporting path.

Do not publish customer lists, device identifiers, exact management
topologies, credentials, private incident evidence, voucher secrets or
security-sensitive facility details. Have the privacy/security owner review
the aggregation and disclosure method.

## 12. Research and expansion roadmap

The following is a dependency-aware sequence, not a committed schedule or
funding request:

### Stage A — Operate one supervised site responsibly

- Complete the site inventory, owner assignments, customer contract and
  operational contacts.
- Finish isolation, approved package/payment, support, capacity, backup/restore,
  expiry and rollback acceptance.
- Establish an actual first-site measurement baseline and cost worksheet.
- Keep unsupported TV/family/multi-site passes outside the offer.

### Stage B — Add access coverage without changing entitlement scope

- Survey one additional AP location and prove its guest policy end to end.
- Confirm the single gateway remains within measured capacity with headroom.
- Document roaming/reassociation behavior without claiming cross-gateway
  roaming.
- Review site power, physical security, maintenance and customer notice.

### Stage C — Prove routed third-site topology

- Register unique node IDs/prefixes and authorized transit relationships.
- Demonstrate A–B–C communication.
- Add an independent A–C route and test B loss, convergence, management and
  local service reachability.
- Report measured link quality/capacity and correlated failure risks.
- Keep this topology experiment separate from paid gateway enrollment unless
  that is explicitly in scope.

### Stage D — Make a multi-gateway decision

- Define gateway/customer ownership, device binding, entitlement portability,
  accounting, provider allocation, refunds, support and billing.
- Implement and test per-gateway identity, isolated policy, command ownership,
  telemetry, backups and fleet operations.
- Compare current native access with any RADIUS/NAS proposal against measurable
  requirements and migration cost.
- Pilot one second gateway with synthetic/approved access, then test real
  customer terms only under explicit authorization.

### Stage E — Add community-operated local services selectively

- Select one service that addresses a demonstrated community need.
- Decide data, hosting, moderation, cost, support and exit ownership before
  upload or enrollment.
- Prove discovery across the intended routes, WAN loss behavior, host restart,
  recovery and retention/deletion.
- Add independent copies/backups only under tested service-specific policy.

### Stage F — Evaluate local autonomy and alternative transport

- Define precisely which functions must work during WAN/controller loss.
- Design safe offline authorization/reconciliation before selling or issuing
  offline entitlements.
- Test local service discovery and state reconciliation under partitions.
- Evaluate LoRa only for a documented need and after hardware/regulatory
  review; do not use it as a substitute for IP capacity or ordinary phone Wi-Fi.

### 12.1 Research backlog with stop criteria

| Topic | Evidence needed before advancing | Stop/hold condition |
| --- | --- | --- |
| Third routing site | Address/peer admission, A–B–C route, independent A–C path, tested B loss/recovery | No independent path, management exposure, route leak or unsafe site access |
| More APs | Survey, isolation/roaming, actual client load, measured backhaul and gateway headroom | Any guest-to-management path, unmeasured shared link or unacceptable service degradation |
| Multi-gateway pass | Supported state/ownership design, no duplicate entitlement, device transfer and full financial/access reconciliation | Ambiguous billing owner, stale duplicate order, allowance reset or unclear customer site scope |
| RADIUS/NAS/accounting | Documented requirement and comparative architecture/test plan | Adoption is only fashionable or does not solve a measured problem |
| Local service growth | Named owner, privacy/moderation/retention, tested startup/backup and cost | Unowned data, no recovery path, unsupported sensitive-use claims or paused host |
| Community cost-sharing | Sourced quotes, settled receipts, defined formula, dispute/audit and approved entity/roles | Relying on uncommitted donations, speculative revenue or raw counters as a ledger |
| LoRa | Exact equipment/profile, local legal review, coverage/capacity trials and user need | Unsupported frequency/power claims, no transceiver or emergency promise without acceptance |

## 13. Decisions and approval register

No named decision owner is inferred. Assign roles and dates through the
project's normal review process.

| ID | Decision | Current status | Evidence/output needed |
| --- | --- | --- | --- |
| SG-01 | First-site accountable service operator and host/site agreement | Not recorded as approved | Named entity/roles, site permission, service/support responsibility and exit plan |
| SG-02 | Site custodian and out-of-band recovery contact | Required by deployment plan; actual names must be recorded privately | Confirmed access, training, escalation and recovery method |
| SG-03 | Community participation and decision process | No adopted charter or membership/voting method found | Approved participation, change, appeal, conflict and transparency rules |
| SG-04 | Per-site funding/cost allocation and maintenance reserve | No approved unit economics or budget found | Dated quotes, actual measured costs, contribution/source restrictions and audit method |
| SG-05 | Free service resource budget and withdrawal/notice process | Product decision not recorded | Owner, scope, capacity impact, customer wording and review date |
| SG-06 | AP expansion versus separate gateway trigger | No universal numeric trigger established | Site-specific measured bottleneck and comparative cost/ownership analysis |
| SG-07 | Third-site topology and failure proof | Proposed; no third site accepted | Unique identity/prefix, independent path, peer rejection and B-loss recovery record |
| SG-08 | Multi-site pass/roaming and accounting model | Not implemented as a supported service | Customer terms, state machine, finance ownership, router acceptance and migration plan |
| SG-09 | Central versus local authorization during WAN loss | Open architecture/product question | Threat model, conflict/idempotency policy, expiry/clock handling and reconciliation tests |
| SG-10 | Multi-operator settlement/revenue sharing | No agreement recorded | Authorized commercial/legal review, ledger formula, reporting and dispute process |
| SG-11 | Local-service ownership and community data policy | Optional experiments only; local lab paused | Per-service owner, content/consent/access/moderation, storage/restore and funding |
| SG-12 | Trigger for RADIUS/NAS or replacement accounting | No measured migration need recorded | Requirements, comparative design, test results, cost and rollback |
| SG-13 | LoRa requirement and procurement decision | Research only; no current transceiver recorded | Need, exact compliant configuration, measured trial, operator and support model |
| SG-14 | Public claims about decentralization, availability and community ownership | Must be reviewed before publication | Claims map to implemented, dated, accepted evidence and approved governance terms |

## 14. Source records

| Topic | Source |
| --- | --- |
| Current evidence and maturity boundary | [Volume 00](00-start-here.md); [status and roadmap](../mesh-status-and-roadmap-2026-10-06.md) |
| Expansion stages, roles and first-site plan | [Field deployment plan](../mesh-field-deployment-plan.md); [Volume 02](02-field-deployment.md) |
| Current network and third-site gap | [Network readiness](../kibera-mesh-network-readiness.md); [IP network and hardware](04-ip-network.md) |
| Gateway and AP roles/capacity | [Production operations](../mesh-production-operations.md); [operations and reliability](09-operations.md) |
| Billing, product scope and device limits | [Product and service contract](01-product-and-service.md); [payments and vouchers](07-payments-and-vouchers.md) |
| Platform dependencies and centralized control | [Architecture and dependencies](05-architecture.md); [API and data contracts](06-api-and-data.md) |
| Security, privacy and enrollment | [Security and privacy](08-security-and-privacy.md); [field deployment](02-field-deployment.md) |
| Community hardware and storage concepts | [Node and storage architecture](../kibera-mesh-node-and-storage-architecture.md) |
| Optional apps, local services and LoRa | [Apps, education and offline services](10-apps-and-local-services.md); [IP/LoRa direction](../mesh-ip-and-lora-direction.md) |
| Customer-facing service/support limits | [Product and service contract](01-product-and-service.md); [operations and reliability](09-operations.md) |

These are source records and proposed decision aids, not an adopted governance
agreement. Re-check site, service, ownership, funding and technical status
before making or publishing an expansion commitment.

Rights, contributor title, brand clearance and publication decisions are
tracked separately in [Volume 12](12-ip-and-stewardship.md) and the restricted
internal [IP stewardship dossier](../../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md).
