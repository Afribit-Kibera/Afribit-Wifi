# Mesh documentation, IP dossier and whitepaper plan

**Prepared:** 22 October 2026. **Status:** Volumes 00–12 and the first whitepaper narrative are drafted for review; the whitepaper is not approved for publication.

Use **Mesh** as the product name, the current woven logo/strong typography, and a separate **Powered by Afribit** footnote. Historical “3WEST” refers to the existing site/service context, not a replacement brand. Keep internal IDs stable unless a technical migration requires otherwise.

This plan covers both meanings of **IP**: **Internet Protocol/addressing** in the engineering volumes and **intellectual property/stewardship** in the rights dossier. Build on the existing [IP dossier](../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md); do not infer ownership or licensing from a public GitHub repository.

## 1. Publication structure and readers

Prefer a linked documentation set with a concise whitepaper rather than one enormous file mixing field commands, legal evidence, customer data and product claims.

| Volume | Readers / purpose | Proposed future home | When needed |
| --- | --- | --- | --- |
| 00. Start here and evidence register | Everyone; what Mesh is, what is deployed, how to find trusted instructions | `Doc/mesh/handbook/00-start-here.md` | First |
| 01. Product and service contract | Operator, support, product; what customers receive | `Doc/mesh/handbook/01-product-and-service.md` | Before selling field service |
| 02. Field deployment pack | Onsite technician; equipment, inventory, configuration, acceptance and rollback | `Doc/mesh/handbook/02-field-deployment.md` | Before travel; site appendix completed onsite |
| 03. Administration and support | Daily operator; stats, billing, access and troubleshooting | `Doc/mesh/handbook/03-administration.md` | With the working admin slice |
| 04. IP network and hardware | Network engineer; addressing, topology, radio, routing and enforcement | `Doc/mesh/handbook/04-ip-network.md` | Core site sections before commissioning |
| 05. Architecture and dependencies | Developers/SRE; components, data, trust boundaries and third-party dependencies | `Doc/mesh/handbook/05-architecture.md` | Core component/failure map before release |
| 06. API and data contracts | Developers/integrators; implemented endpoints, schemas and state machines | `Doc/mesh/handbook/06-api-and-data.md` | Updated with each API release |
| 07. Payments, Bitcoin and vouchers | Finance/support/engineers; money and entitlement reconciliation | `Doc/mesh/handbook/07-payments-and-vouchers.md` | Launched payment/stock sections before sales |
| 08. Security and privacy | Security/operator; controls, threat model, abuse and evidence | `Doc/mesh/handbook/08-security-and-privacy.md` | First-site critical sections before launch |
| 09. Operations and reliability | On-call/SRE; deploy, observe, restore and handle incidents | `Doc/mesh/handbook/09-operations.md` | Core runbooks before launch |
| 10. Apps, education and offline services | Community/product/network; free internet exceptions versus local services | `Doc/mesh/handbook/10-apps-and-local-services.md` | Launched free-app matrix before launch; research later |
| 11. Scale and community governance | Planning/community leads; expansion, funding, responsibility and trade-offs | `Doc/mesh/handbook/11-scale-and-governance.md` | After the first-site contract is stable |
| 12. IP, licensing and asset provenance | Maintainers/legal reviewers; ownership, reuse, marks and third-party obligations | `Doc/mesh/handbook/12-ip-and-stewardship.md` | Resolve launch rights/notices first; full dossier later |
| Public whitepaper | Community, partners, funders and technical readers; coherent whole-network account | `Doc/mesh/whitepaper/mesh-whitepaper.md` | Draft after contract/architecture; publish after review |

These are planned destinations. Volumes 00–12 are drafted:
[`handbook/00-start-here.md`](handbook/00-start-here.md),
[`handbook/01-product-and-service.md`](handbook/01-product-and-service.md),
[`handbook/02-field-deployment.md`](handbook/02-field-deployment.md),
[`handbook/03-administration.md`](handbook/03-administration.md),
[`handbook/04-ip-network.md`](handbook/04-ip-network.md),
[`handbook/05-architecture.md`](handbook/05-architecture.md),
[`handbook/06-api-and-data.md`](handbook/06-api-and-data.md) and
[`handbook/07-payments-and-vouchers.md`](handbook/07-payments-and-vouchers.md),
[`handbook/08-security-and-privacy.md`](handbook/08-security-and-privacy.md),
[`handbook/09-operations.md`](handbook/09-operations.md),
[`handbook/10-apps-and-local-services.md`](handbook/10-apps-and-local-services.md),
[`handbook/11-scale-and-governance.md`](handbook/11-scale-and-governance.md), and
[`handbook/12-ip-and-stewardship.md`](handbook/12-ip-and-stewardship.md).
The whitepaper exists as an internal review draft at
[`whitepaper/mesh-whitepaper.md`](whitepaper/mesh-whitepaper.md); it is not
approved for external release. The current handoff, roadmap and operations documents remain usable references. The
[field implementation plan](mesh-field-deployment-plan.md) defines
first-release priorities.

## 2. Chapter TOCs and content briefs

### Volume 00 — Start here and evidence register

1. **One-page explanation:** Mesh, optional paid internet, approved free services, Afribit's role and community benefit.
2. **Current release:** source commit, deployed app/controller/router versions, date, site scope and owner.
3. **Evidence labels:** implemented, deployed, physically accepted, proposed, research and retired. State what each test actually establishes.
4. **Reader paths:** technician, operator, developer, finance, community member and rights reviewer.
5. **Known limits:** controller/WAN dependence, limited tested topology, unsupported devices/packages and communication limitations.
6. **Decision register:** ADRs, open choices, named role owners and review dates.
7. **Glossary:** network node, AP, gateway, controller, site, segment, entitlement, session, collection, settlement and voucher.
8. **Evidence index:** sanitized public summaries pointing to protected detailed test/recovery records.

Deliverables: documentation map, current-status matrix, glossary and claim/evidence table. Do not place credentials or real customer identifiers in the index.

### Volume 01 — Product and service contract

1. **Purpose and audience:** community connectivity, access without prior Bitcoin knowledge and the role of paid passes.
2. **Brand system:** Mesh wordmark, Powered by Afribit footnote, colours/type, Bitcoin attribution and customer-facing tone.
3. **Customer journeys:** join open Wi-Fi, discover free services, choose/pay, await M-Pesa, connect automatically, view status and renew after expiry.
4. **Captive versus browser:** welcome-popup responsibilities, OS-owned dismissal, full-browser handoff and persistent router-local purchase entry.
5. **Package contract:** KES price, connected-time allowance, fixed validity, first-use start, calendar month, rates, data, devices and displayed terms.
6. **Device policy:** MAC/private-address behaviour, wired versus Wi-Fi TV identity, reconnects and legitimate recovery.
7. **Outage journeys:** ISP/controller/provider unavailable, paid but not active, no repeated charge, offline local resources versus external free sites.
8. **Support and fairness:** receipt lookup, refund/escalation process, service availability and acceptable use.
9. **Launch exclusions:** unsupported TV/family/roaming/offline-notification features clearly separated from future work.

Deliverables: approved package matrix, customer screenshots, state/error-copy map and bilingual content scope if requested. Preserve existing customer terms; do not present proposed features as available.

### Volume 02 — Field deployment pack

1. **Deployment scope and service owner:** new segment versus migration; one billing owner per segment.
2. **Site survey:** location, expected clients, ISP handoff, radio/line-of-sight, power, permission and physical access.
3. **Equipment schedule:** model/serial/firmware, ports/link rates, AP capabilities, PoE compatibility, enclosures and spare parts.
4. **Private inventory and backups:** sanitized exports, encrypted binary backup, fingerprints and custodian.
5. **Network worksheet:** WAN, guest, management, transit, VLANs, tunnel, DHCP/DNS and overlap checks.
6. **Onboarding:** actual router identity, site profile, scoped credentials, standby checks and approval to activate.
7. **Installation sequence:** management path first, isolated SSID/customer path, captive/TLS, enforcement, free policy and plans.
8. **Acceptance:** unpaid/paid separation, one authorized payment, activation, revoke, expiry, power/WAN/controller failure and bounded capacity.
9. **Existing customer migration:** source inventory, remaining allowance, TV/family dependencies, financial mapping and no duplicate renewals.
10. **Rollback and field recovery:** trigger thresholds, physical cable/console route, scoped config removal, retained receipts and recovery contact.
11. **Handover/signoff:** tested versions, support owner, unresolved issues and admission envelope.

Deliverables: printable checklist, labelled topology/port map, config preview, acceptance form and rollback sheet available offline. Public examples use fictitious addresses; actual private manifests remain protected.

### Volume 03 — Administration and support

1. **Operator access:** passkey provisioning, approved-device limit, second recovery device and revocation.
2. **Dashboard semantics:** heartbeat, actual router observation, WAN, AP evidence, cloud/provider state and stale/unknown display.
3. **Customer/device lookup:** protected search, observed session versus entitlement, private MAC and disconnected customers.
4. **Access operations:** disconnect versus revoke, pending commands, readback, authorization/reasons and unsupported extension controls.
5. **Billing console:** provider collection, verified Bitcoin receipt, fees, activation and paid-but-not-connected cases.
6. **Free-service policy:** approved list, preview, apply, drift, dependency changes and rollback.
7. **Packages:** approval, visibility, versioning and immutable sold terms.
8. **Voucher stock:** export custody, activation, retailer tracking and lost stock.
9. **Troubleshooting playbooks:** no captive, slow catalogue, no prompt, ambiguous payment, no activation, slow link, missing free app and unreachable router.
10. **Audit and escalation:** who changed what, correlation IDs, redacted evidence and support boundaries.
11. **Routine checks:** opening/closing checks, failed commands, unresolved money, backups and credential contacts.

Deliverables: operator screenshots for implemented screens, role/action matrix and decision trees. Each action must show its true completion condition, not just database success.

### Volume 04 — IP network and hardware

1. **Layered topology:** phones/APs, LAN/routed backhaul, gateway, ISP, control tunnel and optional service hosts.
2. **Node definitions:** forwarding node, client AP, paid gateway and service host; computers/phones are not interchangeable roles.
3. **IPv4 addressing:** site allocation, CIDRs, pools/reservations, transit links, routing summaries, NAT/CGNAT and overlap prevention.
4. **IPv6 strategy:** explicit availability/enforcement policy, router advertisements, DNS and bypass tests; no silent assumption of IPv4 equivalence.
5. **VLAN and trust zones:** management/customer/transit/service, tagged/untagged ports, dedicated-port alternatives and customer isolation.
6. **DHCP, DNS and local discovery:** router-local names, HTTPS names, WAN-loss behaviour and privacy/DNS-over-HTTPS interactions.
7. **Routing:** installed static/OSPF paths, metrics, failover, third-site requirements and loop/partition risks.
8. **Wireless design:** client access versus backhaul, channels, airtime, interference, mounting, link budget and measured coverage.
9. **Enforcement:** HotSpot, walled garden/filtering, per-device rate/time/data limits, clock/boot guards and packet paths.
10. **Remote management:** WireGuard routing, narrow firewall rules, SSH pins and recovery when upstream addresses change.
11. **Equipment compatibility:** RouterOS/feature matrix, AP bridge support, vendor controller boundaries, port speed and PoE/power constraints.
12. **Measurement:** latency, throughput, capacity, counter resets, client distribution and CPU/airtime bottlenecks.
13. **Failure matrices:** WAN, router, backhaul, AP, power, DNS and clock failure; actual redundancy versus shared failure points.

Deliverables: logical/physical diagrams, per-site worksheets, routing/VLAN matrix and evidence-backed compatibility list. Do not call ordinary AP expansion resilient multi-hop routing without measured alternate paths.

### Volume 05 — Architecture and dependencies

1. **System context:** customers, operators, router vendors, ISP and financial providers.
2. **Component architecture:** Next.js/Vercel, Neon/Drizzle, controller/systemd, Caddy, WireGuard, Python/SSH and RouterOS/APs.
3. **Data flow/trust boundaries:** browser ownership, device attestation, payment callbacks, orders and router acknowledgements.
4. **Service ownership:** secrets, credentials, financial recipient, database, VM, DNS/TLS and gateway.
5. **Core workflow/state diagrams:** join, payment/settlement, grant, reconnect, revoke and policy update.
6. **Durability:** transactions/outbox, leases, idempotency, ledger, backups and schema compatibility.
7. **Dependency register:** component/version, purpose, owner, contract/license, credential scope, failure effect, replacement and update procedure.
8. **Build/runtime split:** Node/package lock, Python dependencies, bundled controller build, native helpers and RouterOS-version constraints.
9. **Provider adapters:** Bitika primary, Paystack/Insats fallback, Blink/Lightning roles and disable/uncertainty rules.
10. **Cloud versus local availability:** what survives WAN loss, what needs a local edge host and what cannot function offline.
11. **Security architecture:** scoped machine credentials, operator passkeys, encryption/lookup key separation, replay/body/rate limits.
12. **ADRs:** keep existing hosting for one site, defer fleet UI/RADIUS, native versus legacy worker, and conditions for revisiting each decision.

Deliverables: component and sequence diagrams, software/service inventory, secret-owner matrix and dependency-failure table. Installed versions and vendor documentation must be reverified when writing, rather than treating 6 October package versions as indefinitely current.

### Volume 06 — API and data contracts

1. **API catalogue:** implemented versus proposed routes; human, browser and machine boundaries.
2. **Authentication/authorization:** passkeys, browser ownership, router scope, credential lifecycle and trusted proxies.
3. **Contract conventions:** bounded bodies, validation, error codes, pagination, timestamps, idempotency, concurrency and versioning.
4. **Site/router/agent model:** identity, capabilities, credentials references, lifecycle and approved manifests.
5. **Access model:** payment/voucher linkage, entitlement, immutable purchased limits, actual sessions and desired-state revision.
6. **Command protocol:** claim/lease, bounded retries, deduplication, terminal revocation, completion readback and stale workers.
7. **Payment/webhook contracts:** raw-body verification, provider references, callback deduplication and status mapping.
8. **Observation/diagnostic schemas:** freshness, bounded counters, boot/session IDs, safe errors and sample retention.
9. **Policy contracts:** desired/applied version, preview diff, preconditions and rollback.
10. **Audit and privacy:** actor/action/target/outcome, protected fields, retention and exports.
11. **Schema migrations:** additive rollout, compatibility, restoration and encryption/lookup key transitions.
12. **Examples and tests:** fictitious request/response fixtures, negative/concurrent cases and compatibility matrix.

Deliverables: OpenAPI/reference generated from the implemented contract where practical, example fixtures, ER diagram and state transition tables. Planned endpoints are labelled, not published as working integrations.

### Volume 07 — Payments, Bitcoin and vouchers

1. **Business model:** KES customer prices, Bitcoin settlement, provider fees and customer access terms.
2. **Financial actors:** payer, collector, converter/settler, receiving wallet and support responsibilities.
3. **Bitika path:** collection acknowledgement, `qadi_` references, original idempotency key, webhook/status lookup and delivered-Bitcoin evidence.
4. **Fallback path:** Paystack collection, Insats conversion/treasury dependency, Bitcoin receipt and independent readiness.
5. **Reconciliation:** one purchase timeline and exact matching across amount/currency, reference, recipient and grant.
6. **Failure cases:** paid but pending settlement, paid but no activation, duplicate callback, ambiguous request and provider outage.
7. **Rates/fees/accounting:** quoted versus delivered sats, KES/sats presentation, fee treatment, financial exports and daily reconciliation.
8. **Refund/support decisions:** responsibility, evidence, approval and customer communication; no invented automatic reversals.
9. **Voucher lifecycle:** package-bound six-digit code, encrypted export, keyed lookup, active stock, redemption budgets and namespace exhaustion.
10. **Physical tickets:** cheetah daily/lioness weekly/tiger monthly themes, 50 x 40 mm masters, scratch area, package mapping, dummy proofs and printer acceptance.
11. **Retail operations:** serial separate from secret, batch/retailer custody, issuance/sales reconciliation, damage/loss and reprint controls.
12. **TV/family/complimentary access:** distinct future entitlement/device and aggregate-limit contracts.

Deliverables: money/entitlement state diagrams, reconciliation worksheet, package/fee table, stock ledger and print checklist. Never embed production keys, complete phone numbers, active codes or customer receipt payloads.

### Volume 08 — Security, abuse and privacy

1. **Assets and adversaries:** customer access, operator credentials, router management, payments, vouchers, ledger and local services.
2. **Trust boundary map:** open Wi-Fi, customer/AP/router, tunnel, cloud, providers and administrators.
3. **Access integrity:** attested device, browser ownership, MAC spoofing/private addresses, replay and stale/reordered command protection.
4. **Payment integrity:** signed callbacks, mode/amount/recipient checks, uncertainty, duplicate prevention and no fictitious Bitcoin receipts.
5. **Abuse limits:** voucher guessing/exhaustion, prompt spam, resource abuse, NAT/tethering visibility and realistic per-device enforcement.
6. **Network isolation:** management, client/peer, upstream/private destinations, IPv6/FastTrack and allowed-service exceptions.
7. **Free-app policy exposure:** shared IP/CDN, encrypted traffic, push ecosystems and inability to promise perfect app-exclusive access.
8. **Credential/key lifecycle:** storage, provisioning, least privilege, pins, rotation, recovery, revocation and incident containment.
9. **Application/platform security:** passkeys, authorization, origin/body/rate checks, dependency/build and secret scanning.
10. **Privacy/data map:** MAC/IP/payment/contact data, purposes, access, retention, minimization, deletion constraints and logs.
11. **Responsible disclosure:** contact, testing authorization/scope, no destructive payment/customer tests, triage and verified fixes.
12. **Assurance evidence:** regression, packet-path tests, load/restore exercises, residual risk and independent assessment scope.

Deliverables: threat model, control/evidence register, abuse cases and reviewed privacy/disclosure drafts. Do not call dependency scans or mocked tests a penetration test, compliance certification or a guarantee.

### Volume 09 — Operations and reliability

1. **Service inventory and owners:** hosts, DNS, certificates, providers, routers, secrets and support contacts.
2. **Environments/release process:** disposable development, staging, production, schema-before-code ordering and feature gates.
3. **Observability:** service/router health distinction, stale/unknown data, paid-but-not-active alerts, safe logs and correlation IDs.
4. **Operational targets:** agreed service hours, acknowledgement/recovery targets and measurable availability; values require operator approval.
5. **Routine work:** provider readiness, unpaid/paid probes, disk/load/backups, stock and unresolved payments.
6. **Incidents:** tunnel loss, controller/DB outage, payment ambiguity, policy leak, compromised credential, power/radio failure.
7. **Recovery:** preserved financial state, exact original reference, no allowance reset and no duplicate controller.
8. **Backup/restore:** database, ledger, VM config, router/AP config, private inventories and tested recovery location.
9. **Change/rollback:** preview, site-owned objects, remote lockout fallback, version pairing and retained revocations.
10. **Capacity and cost:** measured clients/airtime, ISP/VM/database/provider costs, alerts and upgrade triggers.
11. **Local service lifecycle:** start/pause/restore notes, edge-host dependencies and separation from internet billing.
12. **Handover/on-call:** access prerequisites, named escalation contacts, safe evidence collection and maintenance notes.

Deliverables: actionable runbooks with prerequisites, commands/examples, expected results, stop conditions and rollback. Keep an offline field copy; no runbook may depend only on reaching the service it repairs.

### Volume 10 — Apps, education and offline services

1. **Service taxonomy:** router-local pages, local hosted services, free external apps and paid general internet.
2. **Free learning:** approved sites, Bitcoin Diploma licensing/link/optional cache, photo-led discovery and accessibility.
3. **Signal:** tested scope, endpoint dependencies and internet/push requirements.
4. **Blink:** balance/login/payment/push separately, credentials handled only by the wallet, no custody claims.
5. **Jami and Berty:** exact app/platform/settings tested, WAN-absent foreground results, failed proximity-only tests and unresolved background delivery.
6. **Local hosting:** who runs the service, power, discovery, authentication, resource limits, updates and backups.
7. **Nostr/Blossom/media research:** protocol role versus storage, replication, availability, moderation and retention; avoid assuming a relay is durable media storage.
8. **Installation/distribution:** app-store dependency, approved downloads, onboarding without broad free-store access and update policy.
9. **Phone/node roles:** phone as client/application participant versus persistent routing/service host; operating-system limits.
10. **Optional LoRa:** separate text/sensor transport, hardware/range/capacity limitations and regulatory verification before procurement.

Deliverables: app capability/dependency/test matrix and supported onboarding instructions. App names, trademarks, fork licensing and background delivery require current verification before public commitments.

### Volume 11 — Scale and community governance

1. **First-site operating model:** roles, permissions, commercial owner, site custodian and community expectations.
2. **Adding APs versus gateways:** hardware compatibility, management and billing scopes.
3. **Multi-site topology:** address allocation, route advertisements, independent backhaul paths and failure domains.
4. **Fleet enrollment/authorization:** unique identities/keys, ownership, policy deployment and retirement.
5. **Accounting/roaming:** measured triggers for RADIUS/NAS/accounting or other changes; no unnecessary first-site replacement.
6. **Local autonomy:** local controller/service dependencies, offline authorization design, consistency and reconciliation on reconnect.
7. **Capacity/economics:** measured demand, shared uplink, free/paid resource budgets, power and host maintenance.
8. **Governance:** who may add nodes, manage free resources, handle abuse, access customer data and change policies.
9. **Community sustainability:** support, training, maintenance funding and transparent service terms.
10. **Research roadmap:** TV/family, replicated storage, offline communications, alternate transports and interoperability.

Deliverables: expansion criteria, ownership matrix, unit-economics assumptions and governance proposals. Distinguish the long-term decentralized objective from the currently centralized billing/control dependencies.

### Volume 12 — Intellectual property and stewardship

1. **Project identity/legal operator:** intended rights holder, service entity and contributor responsibilities.
2. **Source/provenance inventory:** repository history, contributor evidence, contracts/assignments and original versus third-party expression.
3. **Licensing decision:** source, documentation, config templates and assets; public visibility is not an open-source license.
4. **Dependency obligations:** direct/transitive packages, vendor software, server components, notices and any distribution/network-use requirements to verify.
5. **Brand:** Mesh/Powered by Afribit, logo provenance, third-party marks and clearance questions.
6. **Visual/font/content provenance:** Geist/OFL, photos/generated images, app/payment logos, voucher artwork and education PDFs.
7. **Protocol boundaries:** standards and external systems Mesh uses but does not own.
8. **Confidentiality:** secrets, private site manifests, customer records and publication redaction.
9. **Provider/ISP/content agreements:** API terms, resale/service obligations, permissions and supplier ownership.
10. **Privacy/telecom/payment review:** jurisdiction-specific questions and facts for qualified review, without asserting unverified approval.
11. **Disclosure and invention review:** decide what is published and what requires review before disclosure; no unsupported patent claims.
12. **Maintainer policy:** contribution terms, evidence retention, notices, security contacts and review cadence.

Deliverables: update the existing dossier, rights/asset/dependency matrix, decision log and approved notices. Legal conclusions, assignments, licenses and policies require the appropriate authorized review; this TOC grants no rights and makes no regulatory determination.

## 3. Public whitepaper — proposed table of contents

Working title: **Mesh — Community connectivity, free local services and Bitcoin-powered internet access**. Cover/footer: **Powered by Afribit**. Describe the Bitcoin role accurately without implying every customer must own a wallet or that settlement itself provides decentralization.

| Chapter | Content to include | Evidence/visual required |
| --- | --- | --- |
| Abstract and executive summary | Problem, service model, implementation scope and principal limitations | One-page architecture and dated maturity statement |
| 1. Context and motivation | Community connectivity needs, affordability, local utility and user journeys | Sourced community/site facts; distinguish assumptions from measured demand |
| 2. What Mesh is | Product, operator/community roles, network versus internet versus application services | Plain-language layered diagram and glossary |
| 3. Design principles | Local usefulness, optional internet, open-protocol interoperability, accountability and honest limits | Requirements linked to engineering decisions |
| 4. Physical and IP network | APs, forwarding nodes, wired/radio backhaul, routing, addressing and failure domains | Sanitized topology; measured rather than advertised coverage |
| 5. Access and customer experience | Open join, captive, free resources, paid passes, vouchers and device binding | Customer sequence and implemented screenshots |
| 6. Bitcoin and payment architecture | Bitika-first, conditional fallback, conversion, fees, verification and receipt-to-access | Money/state diagram with representative dummy values |
| 7. Operator platform and control | Admin API, site enrollment, commands, observations, private management and audits | Trust/control diagram; implemented versus proposed API map |
| 8. Security, abuse and privacy | Network/payment/operator boundaries, threat model and realistic sharing limits | Control/evidence matrix and residual risks |
| 9. Local apps and offline utility | Free external apps versus offline protocols, hosting, storage and phone constraints | Capability matrix including negative/background results |
| 10. Deployment and operations | Existing-router adaptation, staged cutover, support, backups and failure recovery | Sanitized first-site checklist and verified deployment record |
| 11. Validation and limitations | Test methods, dated results, capacity, failure modes and unproven claims | Reproducible methodology, tables, observed load and honest exclusions |
| 12. Sustainability and scale | Costs, paid/free resource allocation, site roles, more APs/gateways and upgrade triggers | Assumption-labelled economics and measured scaling constraints |
| 13. Decentralization roadmap | Forwarding/control/payment/content dependencies, present central points and proposed local autonomy | Dependency/failure matrix; milestones rather than invented completion |
| 14. Governance and stewardship | Community participation, operator accountability, source/asset rights and protocol ownership | Reviewed governance and licensing statements |
| 15. Roadmap and participation | Committed next steps, research tracks and how operators/developers contribute | Gate-based roadmap and public contribution/security contacts |
| Appendices | Glossary, protocol/dependency summaries, methodology, referenced ADRs and bibliography | Current primary sources, date/version and link checks |

Exclude live credentials, actual router management coordinates, customer identifiers, private support exports and active voucher codes. Do not publish a full private field configuration as the whitepaper's example.

## 4. Writing order and review gates

| Wave | Write | Exit condition |
| --- | --- | --- |
| A — before field release | Volumes 00/01, field pack, core 03/04/05/06/07/08/09 sections and actual free-app matrix | Operator can deploy/recover from the pack; customer terms and implemented API match; launch rights/privacy questions assigned/resolved for the service |
| B — after first-site acceptance | Site evidence, support screenshots, performance/recovery results, fuller API reference and dependency/licensing register | Dated evidence tied to deployed versions; no copy/paste of superseded lab state |
| C — public narrative | Whitepaper, accessible technical/community summaries and governance/scale proposals | Technical/operator/financial/rights review complete; every strong claim has a source or is explicitly a proposal |
| D — continuing maintenance | New sites, dependencies, free-app changes, incidents and roadmap | Docs updated with their release; previous evidence retained as history |

This is a substantial writing programme, not a request to fill every chapter before the first site can be commissioned. Essential instructions and service terms precede launch; deeper research and public narrative follow. Do not manufacture field results to complete a chapter.

## 5. Authoring and evidence standards

- Every chapter names its reader, owner role, scope, last-reviewed date and implementation/release references. Runbooks additionally state prerequisites, expected results, stop conditions, rollback and escalation.
- Label history and superseded instructions. The older admin proposal and controller provisioning documents contain useful design history, not a canonical current installation guide.
- Keep one source of truth for plan semantics, IDs/addressing rules, API schemas, supported apps and service owners. Link summaries instead of copying changing tables across many documents.
- At drafting time verify vendor/protocol/security/legal references against primary sources, record version/date and use short attributed excerpts only where necessary. Distinguish inference from observed behaviour.
- Publish sanitized examples and summary evidence; protect raw inventories, payment traces, secrets and full site recovery kits. `artifacts/` is ignored and not available in a developer clone: promote selected redacted/rights-cleared illustrations into a tracked documentation asset directory when approved.
- Images/diagrams need captions, alt text, provenance and claim boundaries. Generated voucher backdrops are illustrations, not documentary wildlife photography. Print proofs remain SAMPLE / NOT VALID until actual issuance/stock acceptance.
- Add Markdown/link checks, cross-reference/code-contract checks and reviewer signoff to the writing workflow. Missing documentation is a visible task; do not silently mark it complete because a similarly titled historical note exists.

## 6. Existing material to reuse

| Material | Reuse / reconciliation |
| --- | --- |
| [Field plan](mesh-field-deployment-plan.md), [developer handoff](mesh-developer-handoff.md) | Implementation scope, source map and private-state boundaries |
| [Admin design](../ADMIN_CONTROL_PLANE.md) | Proposed API/enrollment concepts; reconcile with actual native controller before writing instructions |
| [Production operations](mesh-production-operations.md), [3WEST review](3west-production-readiness.md) | Field checklist, package parity and migration gaps; historical checkpoints clearly dated |
| [Network readiness](kibera-mesh-network-readiness.md), [IP/LoRa direction](mesh-ip-and-lora-direction.md) | Tested topology and honest transport boundaries |
| [Native automatic access](mesh-native-automatic-access.md), [HTTPS join](mesh-secure-join.md), [replay protection](mesh-agent-replay-protection.md) | Access/state/security mechanisms and version-compatible rollout |
| [Bitika](mesh-bitika-primary.md), [incident recovery](mesh-bitika-pending-ack-incident-2026-10-06.md), [fallback settlement](mesh-engine-bitcoin-settlement.md) | Provider differences, original-reference safety and delivered-Bitcoin evidence |
| [Security audit](mesh-security-audit-2026-10-06.md), [release](mesh-security-release-2026-10-06.md), [device plans](mesh-pilot-readiness-and-device-plans.md) | Controls versus remaining risk; distinguish historical audit from fresh assurance |
| [Physical vouchers](mesh-physical-voucher-cards.md), [six-digit vouchers](mesh-six-digit-vouchers.md) | Design/stock/printing versus implementation and actual issuance |
| [Free Blink](mesh-free-access.md#blink), [Signal](mesh-free-access.md#signal), [push](mesh-mobile-push-trial.md), [background options](mesh-background-delivery-options.md) | Per-feature app dependencies and accepted versus missing outcomes |
| [Jami](mesh-jami-local-trial.md), [Berty](mesh-berty-local-trial.md), [storage/node research](kibera-mesh-node-and-storage-architecture.md) | Separate research evidence from a production local-service promise |
| [IP/stewardship dossier](../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md) | Maintain counsel questions, ownership/asset inventory and public-claim limits |

## 7. Remaining work and operator handoff

The planned handbook set is drafted: Volumes 00–12 are present, and the
whitepaper has an internal narrative draft. **Documentation drafting is not
the remaining launch gate.** Review, real-world evidence, owner decisions and
publication approval remain outstanding. No owner, approval, field test or
legal decision is implied by the existence of these documents.

### P0 — decisions and checks before any field service

1. **Name accountable owners:** identify the legal/service entity and the
   people responsible for the site, network, customer support, finance,
   privacy, security, releases and rights records.
2. **Reconcile current reality:** verify deployed application/controller
   versions, connected target equipment, provider configuration and actual
   site permissions using authorized read-only checks. The October 22 field
   plan records that the router was disconnected and site inventory was not
   verified during planning.
3. **Approve the customer offer:** decide the package price and exact
   allowance/validity/start rules, supported devices, free-service scope,
   payment path, customer-facing language, support and refund process.
4. **Complete site-specific design and acceptance:** survey power, mounting,
   radio/interference and upstream terms; approve the isolated site profile,
   recovery/rollback and safety controls; physically test customer isolation,
   payment-to-router activation, expiry/revocation, outages and measured
   capacity before signoff.
5. **Resolve launch-blocking rights and compliance questions:** have
   authorized reviewers assess contributor/title evidence, source and asset
   terms, provider/ISP agreements, customer/privacy obligations and
   jurisdiction-specific telecom/payment/radio matters. Do not infer a legal
   outcome from the handbook.

### P1 — evidence-led improvements after an authorized first site

- Record actual coverage, performance, customer/device behavior, support
  cases, failure recovery, uptime observations and operating costs with
  methods, dates, versions and limitations.
- Reconcile operating and customer terms with the deployed implementation;
  update the API, dependency/SBOM, security and field documentation for the
  exact release.
- Use customer/community feedback, with appropriate consent and privacy
  safeguards, to evaluate language, accessibility, learning resources and
  service priorities.
- Keep experimental offline apps, local storage, alternate transport,
  multi-gateway operation and decentralization clearly separate from
  supported customer promises until each has an owner and acceptance evidence.

### P2 — before external whitepaper or public campaign

- Reconcile every date-sensitive statement against the current deployment and
  the evidence register; replace internal-only references with approved
  public sources or remove them.
- Obtain technical, operator, finance, privacy, security, rights/legal and
  communications approvals. Confirm approved brand use, asset permissions,
  contributor/publication terms, public contact and intended audience/language.
- Produce an accessible final layout and diagrams with text alternatives,
  source/provenance records and image rights clearance; then record the
  approved version, approvers, date and publication channels.

### Continuing documentation work

Update handbook chapters when the implementation, field configuration,
customer contract, providers, supported apps, legal decisions or operating
territories change. Preserve superseded evidence as dated history. Re-run
local link/anchor checks and `git diff --check` after documentation changes;
perform code tests only when a change affects code or executable examples.

**Operator review requested:** prioritize the P0 decisions, assign accountable
roles, confirm the intended first-site scope, and identify the audience and
languages for a future public narrative. Until those decisions and evidence
exist, keep the whitepaper marked **INTERNAL REVIEW DRAFT — NOT FOR
PUBLICATION**.
