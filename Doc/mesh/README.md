# Mesh documentation

The handbook is underway. Start with [00 — Start here and evidence register](handbook/00-start-here.md)
for a plain-language summary and dated evidence. [01 — Product and service contract](handbook/01-product-and-service.md)
records the current product scope, historical package reference and decisions
still required before a field offer is approved. [02 — Field deployment pack](handbook/02-field-deployment.md)
provides gated site-survey, commissioning, acceptance and rollback templates;
it is not authorization to change live equipment. [03 — Administration and support](handbook/03-administration.md)
documents current operator-interface limitations, safe state interpretation,
customer/payment triage and escalation boundaries. [04 — IP network and hardware](handbook/04-ip-network.md)
explains the tested lab topology, network roles, addressing and field
verification requirements without treating lab settings as a deployment plan.
[05 — Architecture and dependencies](handbook/05-architecture.md) maps the
application, database, payment, gateway and optional local-service roles, and
distinguishes source implementation from a verified deployment.
[06 — API and data contracts](handbook/06-api-and-data.md) inventories the
current route surface, caller boundaries, native gateway protocol and
database state without presenting it as a stable public API.
[07 — Payments, Bitcoin and vouchers](handbook/07-payments-and-vouchers.md)
separates collection, settlement, access entitlement and voucher-stock
responsibilities, with customer-safety boundaries for uncertain transactions.
[08 — Security and privacy](handbook/08-security-and-privacy.md) records
source-based controls and dated evidence alongside field, privacy and
operations risks that remain unaccepted. [09 — Operations and reliability](handbook/09-operations.md)
provides the service inventory, release and incident procedures, recovery
boundaries and explicit limits on what is currently verified. [10 — Apps,
education and offline services](handbook/10-apps-and-local-services.md)
separates free internet exceptions from offline/local trials and records
onboarding, content, service-host and LoRa limits. [11 — Scale and community
governance](handbook/11-scale-and-governance.md) sets out expansion gates,
site/node authority, cost questions and community decisions still to be made.
[12 — IP and stewardship](handbook/12-ip-and-stewardship.md) gives authorized
reviewers a rights/provenance checklist and release controls, while keeping the
separate legal dossier internal.

The initial [Mesh whitepaper](whitepaper/mesh-whitepaper.md) is an **internal
review draft, not approved for publication**. It summarizes the concept,
architecture, dated lab evidence, limits and proposed next steps. It must pass
technical, operational, financial, privacy, rights and communications review
before any external use.

For the next deployment, start with the [field/admin implementation plan](mesh-field-deployment-plan.md)
and [documentation programme and whitepaper TOC](mesh-documentation-plan-and-toc.md),
prepared 22 October 2026 for operator review. Brand: **Mesh**, with a separate
**Powered by Afribit** footnote. These are plans, not a new deployed release.

Start with [where we are and what remains](mesh-status-and-roadmap-2026-10-06.md)
and the [product roadmap](../PRODUCT_ROADMAP.md). These distinguish accepted
home tests from the current operating hold and field-production gates.

For the present pilot decision, security/load evidence and TV/family-device
policy, read [pilot readiness and device plans](mesh-pilot-readiness-and-device-plans.md).

## Current operations

- [24 October CDN polling incident, live containment and required resumption](mesh-cdn-incident-2026-10-24.md)
- [Local computer lab paused, with recovery notes (14 October)](mesh-local-lab-pause-2026-10-14.md)
- [Published source, deployed versions and verification](mesh-release-2026-10-06.md)
- [Developer setup, deployment and recovery handoff](mesh-developer-handoff.md)
- [Pilot go/no-go, stress-test status and device plans](mesh-pilot-readiness-and-device-plans.md)
- [3WEST production review and migration evidence](3west-production-readiness.md)
- [Home-to-field operations guide](mesh-production-operations.md)
- [Controller connectivity investigation](mesh-controller-connectivity-2026-10-06.md)
- [HTTPS onboarding and safe activation](mesh-secure-join.md)
- [Bitika-first checkout and receiving address](mesh-bitika-primary.md)
- [Recovered Bitika purchase and customer completion release](mesh-bitika-pending-ack-incident-2026-10-06.md)
- [Paystack backup and Bitcoin treasury settlement](mesh-engine-bitcoin-settlement.md)
- [Security release, audit and rollback limits](mesh-security-release-2026-10-06.md)
- [Signed controller replay protection and safe release order](mesh-agent-replay-protection.md)
- [Device binding and access-abuse controls](mesh-device-access-security.md)

## Network and app evidence

- [Network foundation and limits](kibera-mesh-network-readiness.md)
- [Wi-Fi/IP and optional LoRa direction](mesh-ip-and-lora-direction.md)
- [Free Signal trial](mesh-signal-text-trial.md)
- [Free Blink scope](mesh-blink-free-access.md)
- [Scoped mobile notification trial](mesh-mobile-push-trial.md)
- [Offline Jami trial](mesh-jami-local-trial.md)
- [Offline Berty trial](mesh-berty-local-trial.md)
- [Local Nostr relays](kibera-mesh-nostr-lab.md)
- [Local Blossom media storage](kibera-mesh-blossom-lab.md)

## Design and original lab plan

- [Captive portal build](mesh-portal-build.md)
- [Pocket-ticket release](mesh-pocket-tickets-release.md)
- [Physical voucher concepts](mesh-physical-voucher-cards.md)
- [Original lab concept](kibera-mesh-lab-01-concept.md)
- [Original step-by-step runbook](kibera-mesh-lab-01-runbook.md)

Dated commissioning notes retain historical evidence. An earlier “active” or
“passed” checkpoint does not override a newer operating hold. Private receipts,
logs, backups and credentials stay outside these public documentation pages.
