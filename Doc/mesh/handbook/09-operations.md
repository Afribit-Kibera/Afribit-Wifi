# Mesh operations and reliability

**Audience:** Service owners, on-call operators, site custodians, support,
developers and SRE reviewers  
**Document owner:** Mesh operations owner role (individual not yet recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Operating model and runbook framework based on checked-in source and
dated home-lab records. It is not authorization to change a serving router,
restore production data, resume paused services or promise uptime. Site
procedures require named owners, current inventories and witnessed acceptance.

> **Current operating position:** Home-lab tests and a supervised paid-access
> flow were recorded in October. The computer-local lab was then deliberately
> paused on 14 October. The pause record does not establish the current state of
> remote cloud services, routers or any other host. The serving 3WEST customer
> service has not been replaced. Before an operation, verify the specific
> service and site rather than relying on an earlier “active” or “passed” note.

## Contents

- [1. Purpose and evidence rules](#1-purpose-and-evidence-rules)
- [2. Service inventory and ownership](#2-service-inventory-and-ownership)
- [3. Environment and release controls](#3-environment-and-release-controls)
- [4. Health, monitoring and operational signals](#4-health-monitoring-and-operational-signals)
- [5. Service targets and capacity](#5-service-targets-and-capacity)
- [6. Routine operating cadence](#6-routine-operating-cadence)
- [7. Runbooks](#7-runbooks)
- [8. Backup and restore](#8-backup-and-restore)
- [9. Change, rollback and field recovery](#9-change-rollback-and-field-recovery)
- [10. Local services and lab lifecycle](#10-local-services-and-lab-lifecycle)
- [11. On-call, support and handover](#11-on-call-support-and-handover)
- [12. Operational decisions and launch gates](#12-operational-decisions-and-launch-gates)
- [13. Source records](#13-source-records)

## 1. Purpose and evidence rules

Operations connect the application and payment state to the network service a
customer actually experiences. A green cloud health check is not proof that a
phone can join, that a paid pass is active, or that unpaid devices are
restricted. A router heartbeat is not proof that the ISP, access point, packet
policy or local service is healthy.

Use the evidence labels from [Volume 00](00-start-here.md):

- **Source-observed:** current checked-out code or configuration implements a
  behavior. This does not prove it is deployed.
- **Dated release evidence:** a dated record reports a deployment/check and
  states its scope.
- **Home-lab observation:** a result for identified home equipment and test
  conditions. It is not field evidence.
- **Current site observation:** a timestamped check against the named
  production/test site, revision and device.
- **Proposed procedure/target:** a recommendation pending explicit owner
  approval and a tested implementation.
- **Unknown:** the records do not establish the current answer.

Record operations in Africa/Nairobi time with an unambiguous date and timezone.
Each observation should include the site and gateway ID, application/controller
revision, configuration revision, time window, operator, test conditions,
result, and any follow-up. Keep customer identifiers, credentials, payment
payloads, private IP/MAC inventories and unredacted logs in the approved private
evidence location, not in this handbook or public issue trackers.

### 1.1 Scope boundary

This chapter covers the Mesh service lifecycle: application and controller
release, gateway connectivity, paid-access reconciliation, network health,
backup/restore, incident response and handover. It does not define:

- a legal service-level agreement or approved uptime target;
- customer pricing, refund policy or the service contract;
- authorization to access a third-party network or provider;
- permission to collect real money, send Bitcoin, alter a live router or test
  customer traffic;
- a field deployment plan for any particular site; or
- an assurance that controls mentioned here exist in the current deployment.

Use [Volume 01](01-product-and-service.md) for customer-facing scope,
[Volume 02](02-field-deployment.md) for site acceptance and change boundaries,
[Volume 07](07-payments-and-vouchers.md) for financial reconciliation, and
[Volume 08](08-security-and-privacy.md) for security/privacy controls.

## 2. Service inventory and ownership

The reviewed architecture identifies a web application, database, payment
providers, controller host, tunnel, router/adapters, access points, ISP and
optional local-service hosts. Operations are not ready until a responsible
person and recovery path are recorded for each production dependency.

The following is a **template**, not a statement that all entries are deployed
or currently available:

| Service/resource | What it does | Minimum owner information to record | Recovery dependency |
| --- | --- | --- | --- |
| Mesh web application | Catalogue, purchase flow, payment/status APIs and administration | Deployment/project owner, production alias, source revision, access approver | Deployment platform, source repository, environment secret owner |
| Application database | Durable customer/payment/access state and migrations | Account owner, database identity/location, authorized operators, retention/restore owner | Provider access, backup location, compatible schema/application |
| Controller host | Reconciles approved gateway orders and communicates with enrolled router | Host owner, instance identity, OS/runtime, release path, on-call contact | Provider console, disk/ledger, service configuration, tunnel |
| Private management tunnel | Connects controller and owned gateway over a restricted path | Tunnel owner, peer identity/key custodian, address plan, revocation path | Current config and replacement-key rollout |
| Enforcement gateway | Applies customer policy, deadlines, accounting and router-local portal | Site custodian, make/model/serial, RouterOS version, customer-service owner | Validated backup, local access/console, power and authorized rollback |
| Customer access points | Wi-Fi coverage and guest isolation | Location, owner, radio/config revision, uplink/PoE dependency | Site access, power, saved config and working management path |
| ISP/backhaul | Upstream and inter-site transport | Contract/account contact, circuit/link identity, support route and demarcation | Provider support, physical access, alternate path if actually tested |
| Bitika | Preferred collection and direct Bitcoin delivery path in reviewed records | Business/account owner, support contact, readiness method, key scope | Original transaction reference and provider status lookup |
| Paystack and Insats Engine | Separate collection and treasury-funded settlement fallback | Separate provider/treasury owners, liquidity and settlement contacts | Collection reference, Engine balance and independent reconciliation |
| Local application/service hosts | Optional offline communications, media or learning services | Per-service owner, supported build, discovery address, storage/backup | Host power/network, service data and client compatibility |
| Secrets and signing/encryption keys | Authenticate services and protect durable records | Named custodian, purpose, scope, storage, rotation and revocation procedure | Coordinated replacement and compatibility/migration plan |
| Support and incident channel | Receives customer/operator reports and coordinates response | Monitored contact, backup contact, hours, escalation route | Access independent of the affected Mesh service |

For each row, complete a private inventory with:

1. Stable resource/site identifier; do not use a customer MAC or secret as the
   label.
2. Named primary and backup owner, authorized operator group and escalation
   contact.
3. Current verified version/revision and last successful health/recovery check.
4. Customer/data classification, permitted log access and approved evidence
   location.
5. Dependency and failure effect; whether the function is local, cloud-only,
   provider-dependent or optional.
6. Backup location, last restore exercise and who may authorize restoration.
7. Change owner, maintenance window, stop conditions and safe recovery method.

Do not write actual secrets, private keys, full customer records, payment
credentials or voucher codes into the inventory. Record a secret reference and
custodian, not the secret itself.

### 2.1 Service ownership and conflict prevention

There must be one explicitly named owner for each live customer access policy
and one controller lane authorized to issue that policy. Running a laptop worker
and cloud controller against the same gateway can duplicate or conflict with
orders. The 14 October local pause explicitly says to keep the laptop
`AfribitMeshAutomaticAccess` task disabled while the LunaNode controller owns
that router.

Before starting or migrating any worker:

- confirm which controller currently owns the gateway and customer queue;
- inspect running services/tasks and recent heartbeat/order activity;
- identify any claimed legacy jobs or existing bindings;
- verify the intended controller revision and site identity;
- obtain approval from the service owner; and
- establish a stop/rollback plan that will not reset a customer's allowance.

Do not infer ownership from a dashboard label, a scheduled task's presence or
an old runbook.

## 3. Environment and release controls

### 3.1 Environment separation

Maintain an explicit inventory of development, disposable test, staging and
production resources. The records document home-pilot and production-facing
services, but do not establish a complete independently isolated staging
environment. Do not label a workspace “staging” unless credentials, database,
provider effects and network targets are separated and verified.

| Environment | Allowed purpose | Required controls |
| --- | --- | --- |
| Development/disposable | Unit tests, fixtures, schema checks and simulated provider responses | No production keys or real customer data; disposable state; no accidental live collection |
| Home pilot | Explicitly authorized supervised testing on identified lab equipment | Named operator, bounded test, known policy/configuration, recovery access and no assumption of field capacity |
| Field test | Separate test SSID/VLAN or spare gateway under site authorization | Written scope, customer isolation, field inventory, measured acceptance and rollback |
| Production/customer service | Approved service only after owner signoff | Named owners, monitored support, backups with restore evidence, controlled release and incident path |

Use synthetic users and provider fixtures for load and regression testing.
Never load-test a live payment provider by generating customer prompts or
Bitcoin transfers.

### 3.2 Release sequence

Follow the release-specific [developer handoff](../mesh-developer-handoff.md)
and [replay-protection rollout](../mesh-agent-replay-protection.md). The
checked-in handoff says not to use `db:push` or `db:seed` as a production
migration procedure, and describes controller/application pairing and guarded
controller upgrade behavior. Reverify those instructions against the current
source revision before use.

For an approved release:

1. **Authorize and scope.** Name the release owner, affected app/controller/
   gateway/site, test window, user impact, required access and stop conditions.
2. **Identify the baseline.** Record source commit, app deployment identifier,
   controller release, schema/migration level, gateway/router software and
   relevant configuration revision. Capture the current service owner.
3. **Review the change.** Inspect migrations, API/state compatibility, feature
   flags, secrets, provider configuration, revocation behavior and rollback
   limits. A source build is not deployment verification.
4. **Prepare recovery.** Confirm verified backups/readback and an authorized
   independent way to reach the host/router if the service being changed fails.
   Identify which records and deadlines must not be rolled back.
5. **Run safe checks first.** Use tests and read-only readiness checks. A
   preflight that reports home-test readiness does not authorize field changes
   or payments.
6. **Apply in compatible order.** Install reviewed additive schema changes
   before code that depends on them, then deploy the application and the
   compatible controller/adapter. Do not run two controller versions
   concurrently against the same access lane.
7. **Verify the exact outcome.** Check app health, database connectivity,
   controller tunnel/heartbeat, signed request behavior, replay rejection,
   router readback and provider readiness as appropriate. Use an unpaid
   comparison device and synthetic/approved test access.
8. **Record and hand over.** Save versions, check results, timestamps, operator,
   anomalies, remaining risks and explicit decision. Update the private
   inventory and next-shift owner.

For customer-facing purchase tests, obtain separate approval for the amount,
provider, recipient and test account. Never issue a second payment attempt to
resolve an uncertain first attempt.

### 3.3 Post-release minimum verification

At minimum, establish the checks that apply to the changed surface:

| Surface | Check | Not established by this check |
| --- | --- | --- |
| Web app | Correct deployment/revision, expected health response and catalogue/status behavior | Router connectivity, payment completion, captive-window behavior or customer capacity |
| Database | Connection and schema compatibility; no unexpected migration/backlog errors | Valid backup unless restored, correct customer-facing state or financial correctness |
| Controller | Expected service active, cloud/tunnel connection and fresh site-scoped heartbeat | Physical router forwarding, local expiry or AP isolation |
| Gateway | Site identity, adapter/agent health, scoped readback and correct order acknowledgment | Correct behavior across every packet path, radio coverage or unrelated sites |
| Payment | Read-only provider readiness or synthetic fixture result; original reference retained for an approved live test | Actual settlement unless provider evidence confirms delivery; access unless gateway acknowledges |
| Portal/access | One unpaid and one explicitly authorized test device, expected status and expiry behavior | Many-client load, device transfer policy or arbitrary mobile OS popup behavior |
| Local service | Named service starts, clients discover it and local route works under defined test | Internet independence unless WAN/cellular are actually absent during the test |

If any required check fails, stop the rollout, preserve evidence, prevent
additional purchases on the affected lane if the owner authorizes that action,
and use the incident/recovery procedure. Do not broaden firewall access or
disable access controls as a release workaround.

## 4. Health, monitoring and operational signals

Health must be expressed by component and freshness. “Online” should not hide a
stale heartbeat or conflate a successful payment with working internet.

### 4.1 Separate health domains

| Signal | What it answers | Example stale/unknown condition |
| --- | --- | --- |
| Web application | Can the expected deployment answer its scoped health/status request? | Alias resolves but deployment is old, database unavailable or one API route fails |
| Database | Can the application use its required schema and durable records? | Connection works but migration level is incompatible, writes are failing or backup is untested |
| Payment provider | Can an approved readiness/status query be made? | Provider configured but quote/collection/settlement capability or treasury is not ready |
| Controller | Is the intended release running and connected to its owned service? | Host responds but tunnel/API authentication fails or heartbeat is stale |
| Gateway | Is the enrolled gateway fresh and processing the intended order lane? | Agent heartbeat is current but router cannot apply/read back access |
| Customer network | Can a controlled device join and reach its expected destinations? | AP beacon is visible but DHCP, DNS, isolation, captive handling or WAN fails |
| Local service | Is the optional service reachable from the intended local scope? | Process is running but discovery, storage, client path or locked-screen delivery fails |
| Financial/access reconciliation | Do collection, settlement, entitlement, order, acknowledgment and customer state agree? | Payment is confirmed but access is absent, or an order is active without current payment evidence |

For all timed signals, record when the observation was generated and when it
was last received. A stale response is not a current pass. Show **unknown** or
**stale** rather than silently treating missing data as healthy.

### 4.2 Reconciliation states to watch

Alert/report on durable states and their age, rather than only HTTP errors:

- initiated collections that have no final provider result;
- confirmed collections awaiting settlement or reconciliation;
- settlement delivered but no corresponding access order;
- queued/claimed/failed order whose lease or retry window has elapsed;
- order acknowledged by the gateway but no matching customer status/readback;
- customer pass approaching or beyond its immutable deadline;
- controller heartbeat overdue for the configured, owner-approved interval;
- database migration/schema mismatch or repeated connection/write failure;
- low treasury readiness, provider rejection or quote failure;
- voucher redemption/export/stock anomaly;
- backup missing, outdated, failed or not restorable;
- disk, memory, CPU, connection-table, queue, airtime or link pressure nearing
  an accepted site threshold; and
- configuration drift or unreviewed change to the live gateway.

An alert must include a stable correlation/payment/order reference, component,
site, first-seen timestamp, last-seen timestamp, observed state and next safe
action. Redact secrets, full phone numbers, payment payloads, bearer codes and
unnecessary customer network identifiers.

### 4.3 Minimum log and dashboard behavior

Logs and reports should support cross-component tracing without using secrets
as correlation identifiers. Preserve the original provider reference and
internal purchase/order IDs where authorized, and identify collection, delivery,
entitlement, router acknowledgment and customer browsing as separate facts.

Do not mark “customer online” from any of these alone: web app health, provider
payment status, a reserved device, an order submission, a controller heartbeat
or a configured whitelist rule. The gateway acknowledgment establishes the
recorded access state; customer browsing remains a separate user/network
observation.

Confirm retention, access permissions and deletion process with the privacy
owner before expanding logs or collecting packet-level evidence. Follow
[Volume 08](08-security-and-privacy.md); observability is not a reason to retain
unbounded device histories.

## 5. Service targets and capacity

### 5.1 Targets are an owner decision

The reviewed records do not establish approved public service hours,
availability SLO, response/acknowledgment target, recovery time objective (RTO),
recovery point objective (RPO), or first-site user capacity. Do not invent or
advertise numeric commitments.

Before field operation, the service owner and support owner must approve and
publish internally:

| Measure | Required decision |
| --- | --- |
| Service hours | When support is actively monitored and what customers may expect outside those hours |
| Availability measure | Which customer-critical service is measured, measurement location/window and exclusions |
| Alert acknowledgement | Who acknowledges an alert during and outside staffed hours |
| Recovery targets | Target restore time and acceptable data loss for app, database, controller, router and optional local services |
| Escalation | Trigger, recipient, alternate contact and authority to suspend new sales or isolate a site |
| Capacity | Measured concurrent devices and sustained customer experience for the exact site configuration |

Choose independent checks that reflect customer experience. Do not calculate
“uptime” from a controller process alone or from a cloud endpoint that cannot
see the guest path.

### 5.2 Capacity evidence and admission

The 6 October pilot record explicitly states that a full system/radio/forwarding
stress test was not completed. Proposed five-then-ten-device tests in that
record are test stages, not today's validated capacity. The local lab pause on
14 October also means those tests must not be assumed currently running.

For each site, measure the intended customer policy enabled, including:

- actual ISP goodput and latency/loss at busy and quiet times;
- backhaul throughput independent of the ISP using an authorized local test;
- both directions, concurrent load and queue behavior;
- router CPU, free memory, connection table, DHCP state and packet/queue
  counters;
- AP airtime, retransmissions, coverage and client distribution;
- paid/free policy interactions and unpaid-device restrictions;
- join, catalogue, activation, status and expiry behavior; and
- behavior on the intended backup path and after a bounded recovery event.

Record the exact equipment, software, channel/power, topology, client count,
duration, offered traffic, test endpoints and stop reason. Keep financial
effects synthetic; no provider load generation.

The production operations record proposes sustained CPU above 80% as an alert
candidate, not a capacity guarantee. An operator must set and approve actual
thresholds with headroom, expected peaks and device behavior. Stop a test for
management-plane instability, rapidly increasing loss/latency, customer
impact, overheating/power issues or any pre-agreed threshold breach. Never
continue just to reach a target client count.

AP count does not create ISP bandwidth. A speed cap divided into nominal uplink
capacity is not a safe admission calculation; protocol overhead, contention,
free-service traffic, burst behavior and shared airtime reduce usable capacity.
Publish only a site-specific measured limit and its conditions.

### 5.3 Failure-domain statement

Current recorded topology is a two-router home lab with preferred Ethernet and
alternate radio transit. It accepted link failover/failback, not router-loss
resilience. A failure of either router is not avoided by two links between the
same pair. WAN, controller, gateway, AP, power, local-service host, ISP and
settlement provider are separate dependencies and need separate tests.

Use the [network chapter](04-ip-network.md) for topology and addressing; use the
current [production operations record](../mesh-production-operations.md) for
its dated failure matrix. Do not describe the overall service as redundant or
highly available unless independent failure paths and recovery have been
measured.

## 6. Routine operating cadence

The cadence below is a proposed minimum checklist. Assign it to named roles
and adjust frequency to the approved service hours and actual alerting
capabilities. A checklist without a monitored owner does not constitute
monitoring.

### 6.1 At the start of an operating shift

1. Confirm the current on-call/operator contact and site/service ownership.
2. Verify that the correct application and controller revisions are running.
3. Check freshness of the database, controller and enrolled gateway signals.
4. Review aged/unresolved collection, settlement, access-order and support
   cases; reconcile using the original provider reference.
5. Confirm provider readiness using read-only/synthetic checks and confirm
   treasury readiness separately for any Engine-funded settlement path.
6. Review recent configuration/release changes, backup status and known
   maintenance/outage notices.
7. Check site load and physical observations where approved; record “not
   checked” rather than treating missing telemetry as normal.
8. Ensure the unpaid comparison path and intended free-service scope remain
   within the approved policy if a supervised check is scheduled.

### 6.2 During an incident or customer report

- Capture the exact time, symptom, affected site/device scope and customer
  report without requesting an M-Pesa PIN, wallet seed or router credentials.
- Check the service chain in order: device association, DHCP/address, DNS,
  captive/status page, entitlement/order state, gateway acknowledgment,
  packet policy, backhaul and WAN. Record which layer is proven and which is
  still unknown.
- For a payment issue, stop repeat collection attempts and use the original
  reference and provider status path. Do not send a second Bitcoin transfer to
  compensate for an uncertain first result.
- For broad network/security impact, use the authorized containment owner and
  field/site procedure. Do not improvise by disabling guest isolation, opening
  management access or resetting the router.
- Keep customer communication factual: what is unavailable, what is being
  checked, whether payment/access is confirmed, and the next update channel.

### 6.3 At shift handover

Transfer the incident/change ID, current impact, verified facts, unknowns,
last action, next safe action, deadlines/leases, provider references, owner,
contact route and evidence location. Explicitly identify whether a purchase is
uncertain; a succeeding operator must not create a new one.

### 6.4 Periodic review

On a schedule approved by the service owner:

- perform a restore exercise in an isolated environment;
- review access to accounts, secrets and customer/financial records;
- review provider readiness, treasury and financial reconciliation;
- inspect backup age, disk/power headroom, router/AP health and site inventory;
- review certificate/runtime/software support and security notices;
- verify no competing controller or obsolete worker has started;
- remeasure capacity after material changes to equipment, policy or demand;
- review exception/whitelist ownership and expiry; and
- close actions only with evidence and a named approver.

The cadence, owners and actual completion history belong in the private
operations register, not in an unsupported claim in this handbook.

## 7. Runbooks

All procedures below assume explicit authorization for the relevant system.
Start with read-only inspection, capture state, and stop when expected
identities or results do not match. A failed check is not permission to broaden
access, repeat a payment or apply an unreviewed configuration.

### 7.1 Gateway heartbeat or controller connectivity lost

**Purpose:** Determine whether the issue is stale telemetry, controller
unavailability, tunnel/authentication failure or gateway loss.

**Prerequisites:** Named controller and gateway IDs, approved access to
read-only health/logging, current release/configuration, site contact and a
separate recovery path.

1. Record last-known-good heartbeat, expected reporting interval and current
   time. Treat the gateway state as **unknown** until current evidence arrives.
2. Check application/controller deployment and host/service state using the
   approved monitoring and operator access. Verify identity and revision; do
   not start another worker to “see if it helps.”
3. Check tunnel endpoint/peer status and recent authentication/connection
   errors. Do not print keys or copy secrets into the incident ticket.
4. Ask the site custodian to verify power, link indicators and physical
   availability only if authorized and safe.
5. When connectivity returns, verify a fresh site-scoped heartbeat and the
   expected controller lane. Inspect queued/claimed/failed order states before
   resuming activity.
6. Confirm existing customer deadlines and restrictions have not reset.

**Expected result:** A current heartbeat from the expected gateway/release, or
a documented isolated failure domain with named owner and next action.

**Stop/escalate:** Gateway identity mismatch, unexpected second worker,
claimed legacy jobs, missing tunnel pin, suspected credential exposure, or
customer access state that cannot be reconciled.

**Do not:** Re-enroll with a copied/shared key, change router management
exposure, clear the durable ledger, or run first-time provisioning scripts
against an existing host.

### 7.2 Paid but not active, or payment outcome uncertain

**Purpose:** Resolve the exact purchase without duplicate collection,
settlement or allowance.

**Prerequisites:** Authorized finance/support operator, internal purchase ID,
original provider reference/idempotency data, provider status access and
gateway order view. Use [Volume 07](07-payments-and-vouchers.md) and the
[documented Bitika recovery incident](../mesh-bitika-pending-ack-incident-2026-10-06.md).

1. Tell the customer not to approve another prompt while the first result is
   checked. Never request their payment PIN or wallet recovery phrase.
2. Find the original purchase and record its current durable state; do not
   create a replacement reference or switch providers for the same uncertain
   attempt.
3. Query the provider using the original reference/idempotency path. Match
   amount, currency, payer/reference and recipient/delivery evidence as
   required for that provider. A `PENDING` response is not proof of delivery.
4. Separately verify settlement/delivery, entitlement/order creation, gateway
   acknowledgment and observed customer access. Do not collapse these into
   “paid.”
5. If the receipt is confirmed but the order is stalled, use the approved
   reconciliation/retry path for the same purchase and original order. Preserve
   the immutable amount, device binding, allowance and deadline.
6. If any provider or order result remains ambiguous, stop money movement and
   escalate to the designated finance/provider owner. Record what is confirmed
   and what is not.
7. Close the case only after the owner confirms a matching financial record and
   access result or provides the authorized customer remedy.

**Expected result:** One original purchase timeline with reconciled collection,
settlement, entitlement, router acknowledgment and customer state, or an
explicitly unresolved case assigned to an owner.

**Stop/escalate:** Reference mismatch, delivery/recipient mismatch, duplicate
transfer risk, stale records, missing encrypted request data, unexpected
device/allowance change or inability to prove the original financial outcome.

### 7.3 WAN or upstream provider unavailable

**Purpose:** Separate local network continuity from external-service
availability.

1. Verify the scope from an authorized test device and approved monitoring:
   local gateway, local portal/services, DNS, upstream route and provider.
2. Confirm whether the issue is WAN loss, DNS, ISP/backhaul, controller/cloud or
   one external provider. Do not infer the cause from an app-specific failure.
3. Ensure the portal reports checkout unavailable when required dependencies
   are unavailable. Do not initiate collection without payment readiness.
4. Preserve active local access limits and expiry behavior. Do not add a
   blanket bypass or promise that paid general internet works without upstream.
5. Use an alternate link only if it is already authorized and tested for this
   purpose. Record changed path, impact and whether sessions were interrupted.
6. Confirm restoration against the same scope: route, DNS, expected external
   reachability, provider readiness and customer state.

**Expected result:** Local and external services are described separately;
checkout/settlement is paused safely when unavailable; active policies remain
bounded.

**Stop/escalate:** Route changes could expose management/client networks,
alternate path is untested, ISP fault affects unrelated customers, or recovery
requires changing live routing/firewall policy.

### 7.4 Database or application service unavailable

1. Identify deployment, database, schema and incident start time. Check
   provider status and application error/connection signals using approved
   read-only tools.
2. Protect durable payment/access state. Do not delete/recreate a database,
   run seeds or perform an ad hoc schema push.
3. If a release immediately preceded failure, follow the approved version
   rollback only after checking schema compatibility and the handoff's release
   procedure.
4. Keep new checkout disabled/paused if the approved product control can do so
   safely; do not accept a payment whose durable result cannot be established.
5. Restore only from a verified backup using the restore exercise below and
   owner approval. Preserve newer financial/provider references for
   reconciliation.
6. Verify app/database compatibility, read-only health, safe transaction flow
   and pending queue state before resuming customer purchases.

**Stop/escalate:** Unknown schema migration state, missing backup, restore may
overwrite later receipts, encryption keys unavailable, or database identity
cannot be verified.

### 7.5 Router/AP, power or backhaul impairment

1. Confirm the affected equipment/site and customer scope with the custodian.
   Identify whether the failure is power, AP association, gateway, transit,
   ISP or management path.
2. Use the site's approved field checklist and local recovery route. Do not
   reset, factory-default, reimage, replace or alter a serving device without
   explicit change approval and a validated backup.
3. If a tested alternate backhaul exists, confirm route/policy scope and
   owner approval before using it. A two-link path between the same two
   routers does not cover loss of either router.
4. Verify guest isolation, DNS, paid/unpaid behavior and local expiry after
   repair. Verify management access remains restricted.
5. Document the replaced component, config revision, observed outage and
   acceptance checks before closing the event.

### 7.6 Suspected credential exposure or unauthorized change

Use [Volume 08](08-security-and-privacy.md) and the authorized security
incident process. Notify the accountable security/service owner through the
approved contact outside the potentially compromised system. Preserve
time-bounded evidence without copying secrets into tickets. Identify affected
scope and keys, then coordinate revocation and replacement so the replacement
is installed and verified before revoking any credential still required for
recovery. Avoid destructive scans, broad router changes or public disclosure
before coordinated triage.

### 7.7 Voucher or local-service anomaly

For voucher mismatch, suspicious redemption or stock/export discrepancy:

- stop the affected issuance/export or optional service only through its
  authorized owner;
- preserve voucher/transaction records and relevant timestamps;
- never reveal bearer codes or export files to troubleshoot a public ticket;
- distinguish local service outage from paid internet/settlement state; and
- use the relevant scoped runbook and owner in
  [Volume 07](07-payments-and-vouchers.md). Local services have distinct
  ownership and recovery boundaries; see [Volume 10](10-apps-and-local-services.md)
  for the capability and service-ownership framework.

## 8. Backup and restore

### 8.1 Inventory and backup scope

Backups must be designed for recovery rather than merely produced. For each
resource, record source, method, encryption, access, schedule, retention,
independent location, last successful restore and owner.

| Data/configuration | Recovery concern |
| --- | --- |
| Application database | Payment/access state, immutable purchases, order/lease state, audit data and schema compatibility |
| Controller automatic-access ledger | Local allowance/deadline and reconciliation continuity; must not be replaced with an older snapshot that re-grants time |
| Controller release/configuration | Application/controller compatibility, systemd/service config, adapters, TLS proxy and tunnel configuration |
| Gateway configuration | Site-specific policy, identity, network/routing, firewall, queues and portal assets; restore must not overwrite unrelated/site-owned objects |
| AP configuration | SSID/VLAN/isolation, radio settings, management reachability and site-specific uplinks |
| Keys and certificates | Availability and confidentiality; recovery requires authorized custody, purpose mapping and compatibility/migration steps |
| Financial/provider records | Original collection references, settlement/delivery and reconciliation evidence; secrets and customer data remain private |
| Local service data | Service-specific user/content data, replication/retention guarantees and version compatibility; optional service state is not paid-access state |

The developer handoff specifically identifies the database, durable controller
ledger, encryption/lookup keys, SSH pins and provider references as state that
must be preserved across upgrades. The 6 October pilot record says encrypted
backups and accepted database/router/controller restore remained field work.
The presence of a backup file alone is not accepted restore evidence.

### 8.2 Restore prerequisites

Before restoring:

1. Obtain explicit authorization from the data/service owner.
2. Confirm the target host/database/router identity and intended environment.
3. Identify the exact backup timestamp, source, integrity check and encryption
   key availability.
4. Determine data written after the snapshot, including collections,
   settlement, vouchers, access orders, revocations and deadlines.
5. Confirm schema/application/controller compatibility and whether the
   restoration is isolated from customers/providers.
6. Establish a pre-restore snapshot and a recovery path if the restore fails.
7. Notify affected operators and pause conflicting writers through the
   approved procedure.

If an older copy could erase financial evidence or restore expired/consumed
allowance, do not restore it over the active system. Escalate for data
reconciliation.

### 8.3 Isolated restore exercise

Run first in a disposable, isolated environment with no live provider
credentials or router endpoint:

1. Restore the selected database/config/ledger according to its owner-approved
   procedure.
2. Verify integrity and expected record counts/states without disclosing
   sensitive records.
3. Start only compatible application/controller builds against the restored
   resources.
4. Confirm no live external payment, Bitcoin transfer, router order or
   customer notification can occur.
5. Verify unresolved and completed purchase states, consumed voucher status,
   revocations and original deadlines remain correct.
6. Measure elapsed time and data loss against the owner-approved RTO/RPO.
7. Record deviations, destroy the disposable test copy under the approved
   retention process, and track corrective actions.

Only after a successful isolated exercise and a separate production change
approval may a production restore be considered. A restore is not a way to
replay a payment or reset access.

## 9. Change, rollback and field recovery

### 9.1 Change record

Every production change needs an owner-approved record containing:

- change ID, reason, affected service/site and customer impact;
- proposer, approver, implementer and independent recovery contact;
- exact source/configuration/schema revisions before and after;
- dependencies and compatibility requirements;
- pre-checks, expected results and objective stop conditions;
- backup/readback evidence and out-of-band access;
- planned start/end window and customer communication;
- rollback steps, known rollback limitations and responsible authority; and
- post-change acceptance and evidence location.

Separate application release, database migration, controller upgrade, router
policy change, AP/radio work and payment/provider change when they have
different failure/rollback boundaries.

### 9.2 Rollback invariants

Rollback must restore the service, not erase legitimate business history.

- Preserve confirmed collection and Bitcoin delivery evidence.
- Preserve payment references, immutable purchase terms, consumed allowance,
  expiry/deadline, revocations and audit history.
- Do not trigger another payment or settlement transfer as part of rollback.
- Keep application and controller versions compatible; a nonce-less old agent
  cannot communicate with the strict API described in the release records.
- Do not restore an old database/ledger snapshot over newer customer or
  financial state without reconciliation and owner approval.
- Restore only Mesh-owned router overlay objects/assets identified in the
  change record. Protect site-owned configuration and unrelated customers.
- Verify unpaid restrictions and the paid customer's remaining limit after
  rollback.

The developer handoff and replay-protection notes describe release-specific
rollback constraints. Follow the current runbook and verify the expected active
release before applying any guarded update; do not infer commands from an old
session or historical commit.

### 9.3 Field recovery boundary

The [field deployment pack](02-field-deployment.md) governs site-specific
inventory, acceptance and rollback. Before any on-site change, confirm:

- the site is an approved test/production target, not merely the lab router;
- the serving owner and customer-impact authority have approved the window;
- current router/AP identity, software, config and backup are verified;
- local console/physical recovery access and safe power path are available;
- existing customers and exact remaining access terms have been inventoried;
- one billing/controller owner is identified and competing workers stopped;
- alternate routes and rollback were tested or the service impact is explicitly
  accepted; and
- post-change checks cover isolation, payment/access state and local expiry.

If one of these is missing, stop before modifying the serving service.

## 10. Local services and lab lifecycle

Local/offline services have distinct owners, data, discovery, power and
recovery dependencies. They do not automatically replace paid internet,
payment processing or the router-local portal. See [Volume 10](10-apps-and-local-services.md)
for the capability and acceptance framework.

### 10.1 Pause/resume record

The 14 October pause is the latest explicit local-computer lifecycle record
reviewed here. It reports selected Windows tasks disabled, local containers
stopped with restart policy `no`, the Podman WSL distribution stopped, and the
UniFi helper changed to manual. It states that data/configuration were
preserved and that remote Vercel, LunaNode, router/AP, HP computer and Tailscale
state were not re-audited by the pause.

Therefore:

- treat local Nostr, Blossom, Jami, UniFi and laptop controller services as
  paused unless freshly verified otherwise;
- do not assume a stopped local host implies the cloud controller, remote
  router or customer service is stopped;
- do not restart all tasks/containers as a group;
- keep the local `AfribitMeshAutomaticAccess` worker disabled while the
  LunaNode controller owns the gateway; and
- do not restore old VM port forwards by address alone; verify the current
  runtime/host address and intended ports with the owner.

### 10.2 Controlled resumption

1. Name the experiment/service and owner; state the question it will answer.
2. Verify the host, runtime, saved data, addresses, dependencies and supported
   startup instructions. Check that another service/controller does not already
   own the same port, data or gateway.
3. Confirm the service is isolated from production payments, customer state
   and management interfaces unless explicitly authorized.
4. Start only the one selected service using its maintained project procedure.
   The pause record names `scripts/mesh/run-lab-podman.py` for selected lab
   containers; verify its current options and scope before use.
5. Verify expected process/container/task state, listener and one bounded
   application-level test. Confirm it has not started an unintended worker or
   exposed a management port.
6. Record exact start/stop state, revision, network paths, test result and
   owner. Stop or disable only through the corresponding service procedure.

**Expected result:** The selected local service is available within its
documented scope, with no change to remote/production services or competing
controller ownership.

**Stop:** Unexpected listener, wrong host address, duplicate controller,
missing private recovery evidence, data migration/update prompt, unplanned
external exposure or inability to verify which service owns a resource.

No resumption is implied by this handbook; the operator's explicit request and
the pause document establish that the local test environment should remain
inactive until needed.

## 11. On-call, support and handover

### 11.1 Support boundaries

The current records do not establish a published security/support contact,
staffed hours, acknowledgement promise, refund SLA or emergency service.
Before public service, record a monitored support channel, backup contact,
escalation authority and hours in customer-facing terms.

Support should:

- verify the customer's issue and relevant purchase using minimum necessary
  information;
- distinguish provider collection, settlement, entitlement, router
  acknowledgment and actual browsing;
- explain known outage/limitations without promising an unverified restoration
  time;
- never ask for an M-Pesa PIN, wallet seed, router password or complete voucher
  secret;
- never instruct a customer to approve another payment while an existing one
  is uncertain; and
- preserve a private case reference and route financial/security/network cases
  to the appropriate authorized owner.

### 11.2 Handover minimum

Every unresolved operational handover must state:

| Field | Required content |
| --- | --- |
| Case/change reference | Stable internal ID and restricted evidence location |
| Impact | Affected service/site/customer scope; confirmed vs possible impact |
| Timeline | First observed, last known good, actions and timezone |
| Current state | Verified app/database/controller/gateway/payment/network state |
| Unknowns | Explicit missing data or unverified assumptions |
| Money/access guard | Whether collection, settlement, order or allowance is uncertain; instruction not to duplicate |
| Last safe action | What was performed and exact result |
| Next action/owner | One authorized next step, named owner and escalation route |
| Deadlines/leases | Any expiry, provider window or order lease that matters |
| Communication | Customer/site update made and next update owner/time |

Do not include credentials or unnecessary customer data in a handover. Confirm
receipt by the next owner for high-impact incidents.

## 12. Operational decisions and launch gates

The records identify unresolved operational work. These are gates, not
assumptions to fill with optimistic defaults:

| Decision/gate | Evidence required before production commitment |
| --- | --- |
| Named service owners/on-call | Primary and backup contacts, authority, hours and monitored escalation route |
| Current inventory | Verified hosts/accounts/DNS/certificates/providers/routers/APs/secrets and owner for each |
| Service targets | Approved measurement, hours, alert response, RTO/RPO and customer wording |
| Payment support | Original-reference recovery, separate collection/settlement/access reconciliation, treasury owner and remedy policy |
| Release process | Verified CI/build, schema order, compatible application/controller release, guarded router changes and rollback |
| Monitoring | Freshness thresholds and alerts for stalled payment/access, controller, gateway, DB, backup and capacity |
| Backup/recovery | Encrypted backups, independent recovery access, isolated restore results and approved data-loss targets |
| Field capacity | Measured client count/throughput/latency/airtime for exact site policy, with headroom and stop thresholds |
| Site continuity | Power, ISP/backhaul, physical access, approved alternate path and tested router/AP recovery |
| Local services | Named owner, offline scope, startup/pause procedure, data retention and power/restore plan |
| Customer support | Published contact/hours, truthful outage states, payment uncertainty handling and approved refunds/remedies |
| Security/privacy operations | Key custodians, coordinated rotation, log access/retention and incident/disclosure path |

**Current scope warning:** Home-pilot evidence does not authorize replacement
of 3WEST or an unattended public rollout. The latest local computer pause is
not evidence that remote services are unavailable or that they have been
recovered. The current operating state of remote services must be checked by
their owners before action.

## 13. Source records

| Topic | Source |
| --- | --- |
| Handbook status and evidence conventions | [Volume 00](00-start-here.md) |
| Release and recovery sequence | [Developer handoff](../mesh-developer-handoff.md); [published pilot release](../mesh-release-2026-10-06.md); [replay-protection rollout](../mesh-agent-replay-protection.md) |
| Field change, capacity and cadence | [Production operations](../mesh-production-operations.md); [field deployment plan](../mesh-field-deployment-plan.md); [Volume 02](02-field-deployment.md) |
| Current pilot/field gate | [Pilot readiness and device plans](../mesh-pilot-readiness-and-device-plans.md); [3WEST production review](../3west-production-readiness.md) |
| Controller and customer state | [Architecture](05-architecture.md); [API and data contracts](06-api-and-data.md); [payments and vouchers](07-payments-and-vouchers.md) |
| Security and privacy operations | [Security and privacy](08-security-and-privacy.md); [security release](../mesh-security-release-2026-10-06.md) |
| Paid-but-not-active recovery | [Bitika pending-acknowledgement incident](../mesh-bitika-pending-ack-incident-2026-10-06.md) |
| Local lab state and resumption boundary | [Local lab pause, 14 October](../mesh-local-lab-pause-2026-10-14.md) |
| Network failure domains | [Network readiness](../kibera-mesh-network-readiness.md); [IP network and hardware](04-ip-network.md) |
| Later handbook topics | Planned [documentation programme](../mesh-documentation-plan-and-toc.md); [IP and legal stewardship dossier](../../PROJECT_IP_AND_LEGAL_STEWARDSHIP.md) |

Source records are dated snapshots. Re-check deployed versions, owner decisions,
provider behavior and site state before treating any procedure or observation
as current.
