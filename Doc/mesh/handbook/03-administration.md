# Mesh administration and support

**Audience:** Approved Mesh operators, support staff, finance/payment reviewers
and site custodians  
**Document owner:** Mesh operations owner role (individual not yet recorded)  
**Prepared:** 22 October 2026, Africa/Nairobi  
**Evidence checked through:** 22 October 2026  
**Status:** Operational guidance and implementation assessment. It is **not**
authorization to use production controls, alter a router, issue access, alter
prices or process a payment. Confirm the current release and service owner
before acting.

> **Implementation warning:** The repository has a protected `/admin`
> interface and a passkey-based access model. That does not mean every screen
> controls the currently commissioned native router lane. The 22 October
> assessment says manual network grants/extensions/revokes and free-site
> changes still use legacy queue mechanisms; the dashboard's “System online”
> label is static; the overview's active grant/job counts are not a complete
> native router/session view. Treat such controls and numbers as non-authoritative
> for field service until their actions, router readback and release are
> explicitly validated.

## Contents

- [1. Purpose, safety and applicability](#1-purpose-safety-and-applicability)
- [2. Administration model and current boundaries](#2-administration-model-and-current-boundaries)
- [3. Operator access and recovery](#3-operator-access-and-recovery)
- [4. Dashboard and state interpretation](#4-dashboard-and-state-interpretation)
- [5. Customer, device and session lookup](#5-customer-device-and-session-lookup)
- [6. Access operations: disconnect, revoke and recovery](#6-access-operations-disconnect-revoke-and-recovery)
- [7. Payment and activation support](#7-payment-and-activation-support)
- [8. Free-service policy administration](#8-free-service-policy-administration)
- [9. Package and catalogue administration](#9-package-and-catalogue-administration)
- [10. Voucher stock and exports](#10-voucher-stock-and-exports)
- [11. Routine operating checks](#11-routine-operating-checks)
- [12. Troubleshooting playbooks](#12-troubleshooting-playbooks)
- [13. Audit, evidence and escalation](#13-audit-evidence-and-escalation)
- [14. Current implementation register](#14-current-implementation-register)
- [Appendix A: operator shift checklist](#appendix-a-operator-shift-checklist)
- [Appendix B: support case record](#appendix-b-support-case-record)
- [15. Source records](#15-source-records)

## 1. Purpose, safety and applicability

This chapter explains how an approved operator should reason about the Mesh
admin interface and customer-support cases, including where the current
interface is incomplete or uses an older mechanism. It is written to reduce
unsafe assumptions: a row in a database is not always a router state; a
successful payment is not always an active connection; and a queued action is
not a completed operation.

Use it only with:

- a named service owner and an approved operator account;
- the current deployed application/controller/router release record;
- the relevant site-specific deployment and support procedure;
- an authorization appropriate to the requested administrative action; and
- a working escalation and recovery contact.

This handbook intentionally does not include passwords, enrollment codes,
passkey pairing codes, API tokens, provider secrets, customer identifiers,
complete payment payloads, private router addresses or live voucher values.
Store those only in the approved, access-controlled operational systems.

### 1.1 Hard stops

Stop and escalate instead of continuing if:

- the service/site/gateway owner or customer billing owner is unknown;
- the deployed version or target router cannot be verified;
- the admin screen reports “online” but no recent router observation is
  available;
- a payment or Bitcoin delivery is uncertain;
- a customer says they were charged but the payment record is missing,
  mismatched or pending;
- an action could grant access to the wrong device/router or alter an
  entitlement's original limits;
- the requested action is not supported by the current native access lane;
- an older/legacy worker may compete with the active controller;
- guest, management, payment or voucher data may be exposed; or
- you cannot explain how the action will be confirmed, audited and rolled back.

Do not collect a second payment, issue a second Bitcoin transfer, reset a
customer allowance, extend a deadline, open a broad whitelist or expose router
management merely to make the customer screen appear resolved.

## 2. Administration model and current boundaries

### 2.1 Separate records and real-world state

Use these terms distinctly:

| Record/state | What it means | What it does not prove |
| --- | --- | --- |
| **Payment collection** | The payment provider reports a collection or transaction result. | Bitcoin settlement/delivery, a Mesh entitlement, router activation or successful browsing. |
| **Settlement/delivery** | The required Bitcoin or other settlement step is independently verified for that payment path. | Router activation or end-to-end internet availability. |
| **Entitlement/grant** | Mesh records the customer's approved package and limits. | That the correct router applied it or that a device is currently connected. |
| **Desired access** | The state Mesh intends a router to enforce. | That the command has been delivered or applied. |
| **Command/job** | Work has been queued, leased or processed by a worker. | Successful router readback or customer connectivity. |
| **Observed router session** | The router reports a live session/client at a particular observation time. | Payment settlement, historical usage accuracy or future availability. |
| **Customer experience** | A device actually reaches the intended service under test conditions. | That every other device, app, site or future session behaves the same way. |

An operator should be able to trace the authorized relationship between these
records without treating one as a substitute for another. If any states
conflict, show **unknown/review required**, retain the original references and
escalate.

### 2.2 Current admin surface (source assessment, not live verification)

The source records reviewed for this handbook describe:

- `/admin` pages for overview, network operations, payments, packages,
  vouchers, free-site configuration and approved passkey devices;
- passkey-created admin sessions and a current limit of three active approved
  device slots;
- `GET /api/admin/v1/readiness` as an existing authenticated readiness route;
- payment, access-grant, voucher and legacy router-job data in the overview;
- package creation/enable/disable fields for price, duration, speed/data cap and
  display order;
- manual grant, extension and revoke controls that the October 22 assessment
  says operate through legacy mechanisms, not the current native lane;
- hostname/free-site save/toggle actions that queue a legacy
  `sync_walled_garden` job, not the current native app/IP/firewall policy; and
- a protected layout that currently renders the static phrase “System online.”

These statements describe checked-in source and dated assessments. They do not
prove which revision is currently deployed, that a router is reachable, or
that a particular button changed the router.

**Until implementation and target-router acceptance are recorded, do not use
legacy manual grant/extension/revoke or free-site controls to operate a field
gateway.** Do not infer that a hostname saved in the admin page was applied to
the customer's actual packet path. Follow a current, approved out-of-band
procedure or leave the action blocked.

### 2.3 Proposed control-plane functions

The field plan and older admin design propose a coherent native control plane
with site/router scoping, fresh observations, payment and entitlement timelines,
durable commands, safe readback, audit history, policy preview/apply and
operator-visible stale/unknown states. Unless a function is present in the
identified release and accepted on the target router, describe it as **proposed**
rather than available.

The proposed API and workflow examples in older design records are not
operator instructions and do not prove the endpoints exist. For actual
implemented endpoints, check the source and release named by the current
developer handoff.

## 3. Operator access and recovery

### 3.1 Sign-in

The described admin login uses a platform passkey (for example, device
biometric/PIN mediated by the operating system). The first device-enrollment
path requires an operator-issued pairing code. The pairing-code distribution
process is private and is not documented here.

Operator rules:

1. Use only a device and passkey explicitly provisioned for Mesh operations.
2. Do not send pairing codes, recovery codes, browser session cookies or
   passkey challenges through ordinary chat or customer support.
3. Do not enroll an unapproved device simply to bypass a full device limit.
4. Use a private, trusted device; lock it when unattended and sign out when
   finished, especially on shared computers.
5. Do not store customer lists, payment exports or voucher CSVs in a personal
   downloads folder or shared browser profile.
6. If a device is lost, compromised or no longer controlled, use a different
   approved operator device to revoke its passkey, then confirm the revocation
   took effect.

### 3.2 Device slots and recovery

The source describes three provisioned active passkey slots. This is an
initial device limit, **not** a full staff role/permission system. A registered
device is an approved admin authenticator; it does not establish granular
authorization for finance, support, security or field roles.

Before travel or a sensitive change:

- confirm at least two approved operator/recovery devices can sign in;
- confirm which person controls each device and how loss is reported;
- avoid revoking the only usable device;
- verify the intended recovery operator can sign in before rotating/revoking a
  primary authenticator; and
- record the event through the approved audit/change process.

The UI prevents the current device from revoking itself; the action logic also
requires at least one active approved device to remain. These controls reduce
lockout risk but do not replace an assigned recovery owner or test of actual
recovery.

### 3.3 Access review

Review active passkeys on the protected security page:

- match displayed device name, slot, creation date and last-used time to an
  authorized person/device;
- confirm whether a device is marked synchronized/backed up, without treating
  that label as proof that the passkey can be restored;
- revoke only a device that is no longer authorized, after verifying an
  alternative sign-in path;
- investigate unknown device names or unexpected use; and
- confirm the audit record and remaining active access after the change.

If the page is unavailable, the count is inconsistent or the owner of a passkey
cannot be established, stop sensitive actions and escalate to the designated
admin custodian. Do not alter database rows manually to regain UI access unless
an independently approved recovery procedure explicitly requires it.

## 4. Dashboard and state interpretation

### 4.1 Overview metrics

The current overview source calculates commercial/access summaries from
database tables and lists recent payments/jobs. The field assessment warns that
some meanings do not match live native router state.

| Displayed item (source UI) | Interpret cautiously | Operator should verify |
| --- | --- | --- |
| Revenue today | The current UI derives a sats sum from settled payment rows for the application server's day boundary. It is not a complete KES collection, fees, bank balance, treasury or provider reconciliation. | Compare protected provider/settlement records and approved financial ledger; use the finance procedure. |
| Active sessions / grants | The current overview counts active unexpired access-grant database records. This is not a fresh count of clients connected to the router. | Obtain an authenticated, fresh router observation from the approved method; otherwise report the live session state as unknown. |
| Vouchers used | A count of voucher records with redemption timestamps in the current day window. It is not a stock ledger or retailer reconciliation. | Reconcile protected batch/export/retailer records and router activation where appropriate. |
| Router jobs | The overview/network page counts records from the legacy `routerJobs` table. It does not establish native order/command health. | Check the current native order/controller evidence and actual router readback; if no accepted console exists, escalate. |
| Recent payments | Recent rows and statuses are application records. A “settled” badge does not by itself show the router session is active. | Follow the payment timeline and activation acknowledgement procedure. |
| “System online” header | The protected layout currently renders a static green status label. | Ignore it as a health signal. Use time-stamped checks for controller, router, WAN/AP and actual client path. |

If values conflict with router observation, provider evidence or a customer
report, do not overwrite the apparent discrepancy. Preserve the available
timestamps and references, mark the case **under review**, and escalate.

### 4.2 Readiness endpoint

The checked-in `GET /api/admin/v1/readiness` endpoint requires an admin session
and is intended to return non-secret readiness information. The source assessment
states it is the only current route in that version of the proposed admin
control-plane family; the field plan also notes that its gates and some
provider checks need reconciliation.

A readiness result:

- is a point-in-time software/data/configuration evaluation;
- does not certify physical router connectivity, Wi-Fi isolation, a customer
  session, field capacity or a new payment;
- may contain blockers because the field site has not been commissioned;
- must not be “fixed” by removing blockers without satisfying the underlying
  gate; and
- must not be shared with secrets or complete customer/payment payloads.

If it returns an error, stale result, `not_ready` status or blockers you do not
understand, record the timestamp and safe error code and escalate. Do not use
the endpoint as a mutation command or treat a home-test readiness result as
field approval.

### 4.3 Freshness and unknown states

Every operational observation should include its source and age:

- controller process/cloud contact;
- successful communication to the enrolled router;
- router/AP software and configuration revision;
- WAN and DNS evidence;
- actual connected client/session observation;
- native pending/failed command and order state;
- payment-provider and settlement state; and
- age of last backup/restore exercise.

These are separate signals. A fresh controller heartbeat may coexist with an
unreachable router; a reachable router may have a failed WAN; a live session
may belong to an unpaid or stale record. If an observation is absent or stale,
display **unknown/stale**, not `0`, `healthy` or `offline` without evidence.

The field plan's 60-second observation/two missed samples concept is a proposal,
not an accepted production threshold. Use only a threshold configured and
measured in the current release.

## 5. Customer, device and session lookup

### 5.1 Lookup principles

Use the least identifying information needed for the support question and only
through an approved, access-controlled interface. Never search by or request a
customer's M-Pesa PIN, wallet seed phrase, router password, full payment payload
or unnecessary identity documents.

The current implementation assessment does not establish a complete native
customer/device lookup or an authoritative live-session screen. An overview
grant list is not a substitute. Until the current release provides a validated
scoped lookup, operators should use the authorized payment/access recovery
procedure and request only the minimum approved receipt reference from the
customer.

### 5.2 Reconcile these fields before acting

For an authorized case, establish:

1. **Site and gateway:** exact enrolled site/router identity; never infer from a
   customer-supplied router ID.
2. **Payment:** provider and original reference, amount/currency, provider
   status, and separately verified settlement/delivery status.
3. **Product snapshot:** name/price/approved terms at purchase time. Do not
   substitute today's package for a historical purchase.
4. **Entitlement:** original device context, remaining limits if measured,
   immutable expiry, grant/order identity and revocation state.
5. **Desired state:** whether access should be active, disconnected, revoked
   or expired according to the original contract.
6. **Observed state:** router session/binding, device identity as observed,
   last-seen time, counters and source freshness.
7. **Command state:** exact command ID/reason/status/result and router
   acknowledgement/readback where available.
8. **Customer experience:** what the device actually sees, whether cellular
   fallback is off for a test, whether WAN is available and which destination
   is being tested.

Do not expose a full MAC/IP or payment reference in an ordinary support reply.
Use a masked or internal reference where the support procedure allows.

### 5.3 Device identity caveats

The pilot binds access to observed network context, including IP/MAC in the
documented native mechanism. This is a connection binding, not proof of a
person's identity. Private/randomized MAC addresses, DHCP address changes,
spoofing and tethering can affect observations.

Do not:

- tell the customer to disable Wi-Fi privacy globally as a routine fix;
- transfer access solely because a caller supplies a MAC address;
- reset a consumed counter or expiry to make a replacement device work;
- bind a purchase to the payer's phone if the approved product targets another
  device; or
- promise that one allowed MAC means one human or prevents downstream sharing.

Device transfer/recovery requires a verified customer/process, explicit
authorization and a tested native workflow that preserves consumed allowance,
original deadline and financial references. If that workflow is unavailable,
do not improvise a manual grant; escalate.

## 6. Access operations: disconnect, revoke and recovery

### 6.1 Distinguish the actions

| Action | Intended meaning | Reconnection behavior |
| --- | --- | --- |
| **Disconnect session** | End a current router session while keeping a valid entitlement. | A device may reconnect if the original entitlement is still valid and allowed. |
| **Revoke entitlement** | End the customer's right to use the remaining pass. | Reconnection must remain denied; the revocation must survive worker/router restart. |
| **Reconcile original purchase** | Re-apply/recover the same authorized allowance after a verified delivery/activation failure. | Uses the original receipt/reference and remaining allowance; no new charge, settlement or fresh deadline. |
| **Complimentary/manual access** | A separately approved, explicitly non-sale entitlement, if supported and audited. | Must be labeled and audited separately; not an invisible payment repair. |

These operations are not interchangeable. A database status change or queued
legacy job is not proof of router enforcement.

### 6.2 Current UI warning

The network page currently contains manual grant, extension and revoke forms.
The October 22 field assessment says those actions use legacy grant/job
mechanisms and must be migrated or disabled before the field control plane is
treated as authoritative. The legacy lane can diverge from native signed
automatic access and local expiry behavior.

**Do not use those controls on a field/serving gateway unless the current
release owner has verified the exact action on the intended router and the
approved runbook explicitly authorizes it.** If an action was submitted by
mistake, stop further changes, capture its internal record/job identifier, and
check actual router state through an authorized read-only method. Do not issue
another action to “undo” an unknown result.

### 6.3 Approved recovery logic

For a customer who has a verified payment but no access:

1. Confirm the caller through the approved minimum-data support process.
2. Locate the original transaction by its provider reference; do not create a
   new checkout.
3. Confirm exact amount, product snapshot, recipient/settlement, provider
   status and whether the original payment was already used for an entitlement.
4. Confirm the intended site/router and device context from trusted router
   observation, not browser-supplied fields alone.
5. Check whether the order is pending, claimed, acknowledged, failed, revoked,
   expired or unknown.
6. If any financial outcome is unresolved, stop and have the finance/payment
   owner reconcile the same original provider reference.
7. If payment and settlement are verified and the deployed native recovery
   procedure is available, request a bounded reconciliation of the same
   allowance. Do not refresh counters, extend expiry, send another Bitcoin
   payment or issue a new provider prompt.
8. Wait for router acknowledgement/readback and, where approved, customer
   reconnection.
9. If the result remains unknown, tell the customer the case is being reviewed
   and provide the approved support reference; do not represent it as fixed.

The documented October 6 incident recovered a rejected `PENDING` acknowledgement
using its original key/payload without a second collection or Bitcoin send.
That incident is evidence for a specific recovery case, not permission to
repeat payment operations manually.

## 7. Payment and activation support

### 7.1 Payment states

Support should use the following sequence and stop at the first unresolved
state:

1. **Prompt requested:** payment provider request exists.
2. **Collection result:** provider has reported a status that must be checked
   against the expected reference and amount.
3. **Settlement/delivery:** required Bitcoin delivery/settlement independently
   verified for that provider path.
4. **Entitlement/order:** the corresponding approved product and device grant
   were created once.
5. **Router acknowledgement:** the correct gateway confirmed the intended
   native access change.
6. **Customer path:** the device can use the authorized internet path under
   current WAN and package limits.

Never collapse these into a single “paid” flag. A customer can have a collected
payment and no activated access; the latter is a support case, not an
instruction to pay again.

### 7.2 Payment page limitations

The existing payment table shows application payment records and statuses; it
does not present a complete finance reconciliation or the full provider,
settlement, entitlement and native router timeline proposed in the field plan.
Do not use a status badge alone to confirm customer connectivity, refund
eligibility or treasury balance.

The operator interface currently includes a historical BTCPay-oriented payment
view, while the active documented customer flow is M-Pesa with Bitika preferred
and Paystack/Engine as a separate fallback path. Confirm the actual deployed
release and finance records before using any label as a current provider
statement.

### 7.3 Handling an uncertain payment

An absent or slow screen response does not prove that a collection failed.

- Ask the customer not to retry until the original result is checked.
- Obtain only the minimum approved payment reference/details.
- Do not ask for PIN, full card details, wallet seed, OTP or provider password.
- Do not automatically start a second provider prompt as “fallback.”
- Keep provider, transaction reference, amount and original request identity
  attached to the case.
- Escalate to the finance/payment owner if collection or settlement is pending,
  contradictory or missing.
- Do not issue access based only on a customer screenshot or unverified prompt.
- Do not send Bitcoin again to repair a missing router acknowledgement.

For the exact provider semantics and incident procedure, use
[Bitika-first checkout](../mesh-bitika-primary.md) and the
[pending-acknowledgement incident record](../mesh-bitika-pending-ack-incident-2026-10-06.md).

## 8. Free-service policy administration

### 8.1 What the current screen does

The current Free-site page allows an authorized admin to save a hostname,
category, note and subdomain flag; it then queues a legacy
`sync_walled_garden` job. The field plan says this does not commission the
current native app/IP/firewall policy on the intended gateway.

Therefore:

- a saved database row is not proof of router installation;
- a queued legacy synchronization job is not proof of successful enforcement;
- a hostname is not a complete app dependency or a guarantee of exclusive
  application access; and
- the UI's enabled/“Free” badge is not proof that an unpaid customer can use
  that feature while unrelated browsing remains blocked.

Do not use the page to commission a field free-service policy unless the
release-specific approved procedure confirms its target, exact packet paths,
router readback and rollback.

### 8.2 Required policy record

Each approved exception should have:

- service and exact feature supported;
- whether WAN, sign-in, prior installation, push or local host is required;
- customer/site/router scope;
- exact destination, protocol and port rationale;
- IP/DNS/CNAME/shared-hosting limitations;
- IPv4 and IPv6 treatment;
- approval owner, review date and expiry;
- implementation revision and readback evidence;
- an unrelated destination that must remain blocked; and
- scoped rollback markers.

Begin with installed, authenticated clients where appropriate. Observe only
necessary connection metadata; do not capture message contents, wallet
credentials, TLS secrets or user payloads. Do not broadly allow an app store,
cloud provider or push network to compensate for an unexplained failure.

### 8.3 Apply/change procedure (only where a verified native tool exists)

1. Confirm site, router identity and active access owner.
2. Confirm policy approval and latest dependency evidence.
3. Review a bounded preview/diff against the currently applied policy.
4. Confirm the existing unpaid general-internet deny and management denies
   remain in the correct order/path.
5. Apply only the approved policy revision via its scoped tool.
6. Read back exact native router state and revision.
7. Test the intended feature from an unpaid device with cellular data off.
8. Test an unrelated public destination and management address remain denied.
9. Record counters/observations without collecting application content.
10. If behavior is broader than intended, remove only the owned rule set using
    its approved rollback; do not flush unrelated firewall state.

If the native tool is not implemented or its status is unclear, do not use the
legacy hostname form as a substitute; mark the policy application blocked.

## 9. Package and catalogue administration

### 9.1 Current UI semantics and warning

The current Packages page can create packages with a name, KES price, sats
equivalent, duration in minutes, display order, optional speed and data caps,
and can enable/hide them. The database package schema is not a complete
representation of the historical 3WEST service semantics.

Do not add or activate a package for customer sale solely because the form
accepts it. The home pilot's nine products were recorded as non-parity with the
15-product reference. The current lab rate/elapsed-duration model differs from
the historical 3 Mbps symmetric products with separate validity and time
semantics. TV products have a separate target-device sponsorship path not
implemented in the home pilot.

### 9.2 Package change controls

Before any package is created, changed, hidden or shown:

1. Obtain product and finance approval for price/currency, sats handling, time,
   validity start/end, rates, data/FUP, device count and customer-facing text.
2. Confirm provider/settlement readiness for the exact price—not only a quote
   or historical success at a different amount.
3. Confirm new checkout snapshots preserve the terms for purchases already
   made. Existing purchases must not silently inherit later edits.
4. Confirm the access gateway can enforce the terms with correct packet path,
   local expiry and reboot/clock behavior.
5. Confirm UI, payment request, receipt, entitlement and support procedure
   agree.
6. Obtain change approval and record a reversible package activation/hide plan.
7. Test on an isolated scope with no customer sale before enabling public
   visibility.

If an active package must be hidden to stop new sales, verify that this does not
cancel or rewrite already-paid entitlements. Do not delete historical purchase
records or change the terms of sold passes.

### 9.3 Prices, sats and financial reporting

The admin package view presents KES price and a sats equivalent. Do not assume
the sats field is an exchange-rate guarantee or that the overview's sats sum
equals KES cash collected, provider fees or available treasury balance. Use the
approved finance reconciliation for collections, settlement, fees and
liquidity.

## 10. Voucher stock and exports

### 10.1 Current evidence

The repository documents six-digit voucher generation using cryptographically
secure randomness, encrypted storage for authorized export, keyed lookup,
transactional batch creation, collision handling and durable rate limits.
The protected page displays batches and provides a CSV export. These
implementation details do not by themselves provide an accountable retail
stock process.

The field plan says printed voucher handling requires inventory custody,
retailer accountability, sale activation, export protection and lost/unused
stock procedures. Physical card art proofs are not issued or accepted stock.

### 10.2 Safe operator handling

- Create or export a batch only with explicit authorization and approved
  package/validity.
- Limit the export to the minimum authorized operator; do not email or post
  the CSV in group chat, tickets, shared drives or source control.
- Record batch owner, quantity, package, issue date, custody transfers and
  retailer/sale reconciliation in the approved stock ledger.
- Store physical cards securely; keep them inactive until the approved issue
  point if the system supports that lifecycle.
- Reconcile issued, sold, redeemed, returned, damaged, lost and revoked stock.
- If stock or a file is exposed, stop issuance/sale of that batch and invoke
  the authorized revocation/replacement process. Do not re-enable codes
  informally.
- Do not promise that a valid code is active without checking its package,
  validity, prior use and gateway acknowledgement.

Current implementation evidence does not establish that the UI supports every
required stock transition, retailer ledger or lost-stock revocation action. If
those controls are absent, do not distribute printed stock at field launch.

## 11. Routine operating checks

Only perform checks for a service where you are an authorized operator. Use
read-only status checks before considering a mutation.

### 11.1 Start-of-shift / opening

- confirm the shift owner and escalation contact;
- check current release/site identity and the last successful router
  observation, not just dashboard banner/heartbeat;
- review controller, router/AP, WAN/DNS and actual-client observations
  separately, recording freshness;
- check unresolved collection/settlement and paid-but-not-activated cases;
- review native pending/failed commands through the accepted current method;
- verify no conflicting local worker or legacy controller is active;
- check last backup/restore status and any recent credential/release changes;
- inspect supported package visibility and active free-policy revision;
- confirm site power/link/load are within the accepted operating envelope; and
- ensure customer support and incident escalation are reachable.

If any required signal is stale or not available, record **unknown** and
escalate according to severity. Do not start a shift report by copying
“System online.”

### 11.2 During a shift

- record customer reports using a protected case reference;
- separate payment, settlement, entitlement, router acknowledgement and
  customer browsing evidence;
- review stalled activation and router command results at their source;
- do not apply unsupported manual grants or extensions;
- monitor unresolved money and vouchers as protected operational data;
- apply only pre-approved changes under a change record; and
- preserve timestamps and evidence when escalating, minimizing customer data.

### 11.3 End-of-shift / handover

- record open incidents, unresolved payments, stalled activations and pending
  changes;
- identify who owns the next action and when it is due;
- confirm no live provider prompt or test payment was left ambiguous;
- confirm any exported voucher batch is back in approved custody;
- record current site/gateway/release identifiers safely;
- disclose unknown/stale health state explicitly; and
- sign out from shared admin devices.

## 12. Troubleshooting playbooks

These are triage paths, not permission to mutate production. Use the current
release-specific runbook for exact technical actions. If a decision asks for a
manual grant/revoke, broad firewall change, payment retry or direct database
edit, stop and escalate.

### 12.1 Customer cannot see the captive welcome

1. Ask whether the customer joined the intended Mesh SSID and whether the
   device reports connected to Wi-Fi.
2. Confirm cellular fallback is off only if the customer consents to a test;
   never request unrelated personal information.
3. Check whether other authorized test devices on the same segment can reach
   the local welcome.
4. Distinguish local router-hosted assets from the cloud purchase page and
   public internet.
5. Check AP association/DHCP/DNS/portal state using the approved read-only
   method and confirm observation freshness.
6. Offer the approved local/full-browser entry address if it is safe and
   documented for that site.
7. If no device can reach the local page, report it as a site access/captive
   incident. Do not enable broad internet or management access to force a
   popup.

**Do not promise:** that the operating system must open or keep its captive
window open. See [Volume 01](01-product-and-service.md#6-captive-welcome-and-full-browser-behavior).

### 12.2 Catalogue is slow or incomplete

1. Check the exact application release/alias and whether the issue affects
   one device or multiple.
2. Separate the local welcome asset load from cloud catalogue/API retrieval.
3. Check authorized app/controller/database health and timestamps.
4. Record safe error text and time; do not copy tokens, cookies or payment
   payloads.
5. Check whether the catalogue reflects only approved active products and
   whether a recent package change was authorized.
6. Escalate if product price/terms differ from the approved contract.

Do not activate an unverified product, edit package rows directly or ask for a
payment while catalogue terms are inconsistent.

### 12.3 M-Pesa prompt not received

1. Ask the customer to verify the phone number they entered without requesting
   PIN/OTP.
2. Check the original checkout/payment state and whether a provider request was
   actually created.
3. Determine whether the result is definitively failed or still uncertain.
4. If uncertain, do **not** start another provider prompt or switch provider.
5. Escalate to the payment owner with the original reference and safe
   timestamp.

### 12.4 Customer approved payment, access not active

1. Acknowledge the report without claiming the access is active.
2. Ask the customer not to pay again while the original request is checked.
3. Locate the payment using the original reference through the approved
   protected system.
4. Verify provider collection, exact amount/product and required settlement
   separately.
5. Verify whether an entitlement/order exists, which router owns it and its
   original device/deadline.
6. Verify native command/acknowledgement/readback. A DB grant or queued legacy
   job alone is insufficient.
7. Use the supported same-purchase reconciliation procedure only if payment
   and settlement are confirmed and the release-specific procedure authorizes
   it.
8. Escalate unknown or contradictory state to finance/operations. Preserve all
   original references and do not repeat money movement.

If the product is confirmed active but browsing still fails, test WAN/site
availability and the intended device/session path before changing its
entitlement.

### 12.5 Customer browsing stopped

1. Confirm whether the issue is only one device, all clients on one AP, one
   site, or all sites.
2. Confirm pass status/expiry against the original purchase terms; do not infer
   remaining time from a dashboard count.
3. Check actual router session and WAN reachability as separate observations.
4. Test one approved destination and one known unrelated destination, without
   broadening access.
5. Check whether the pass expired, the device private address changed, WAN is
   down, or the AP/router is unreachable.
6. Use only an approved, tested native recovery method that preserves the
   original limits and deadline.

Do not extend the pass merely because the customer reports interruption.
Eligibility for credit/refund is governed by the approved policy, which is not
defined in this draft.

### 12.6 Free app/site unavailable

1. Identify the exact published app feature/site and whether it requires WAN,
   login, prior installation, push or external provider availability.
2. Check if the issue affects all test devices or only one app/version.
3. Confirm there is no paid session and cellular fallback is off for a
   consenting test.
4. Check the approved policy revision and current router readback; a hostname
   row in the admin UI is not enough.
5. Test the unrelated blocked destination as a safety control.
6. Capture only necessary connection metadata; never inspect message contents,
   wallet secrets or TLS payloads.
7. If policy is broader than approved or management access is at risk, stop and
   invoke scoped rollback; otherwise mark the feature unavailable and escalate
   dependency review.

Do not add an entire app-store, cloud or CDN range because one named feature
fails.

### 12.7 Router/controller unreachable

1. Compare time-stamped controller process/cloud contact with last successful
   router observation.
2. Check WAN, tunnel, router/AP and site power as separate failure domains
   using authorized read-only observations.
3. Ask the site custodian to check physical power/link indicators if remote
   evidence is absent.
4. Use the pre-arranged local recovery path; do not expose SSH/WinBox/API on a
   public interface.
5. If management access is lost, stop remote configuration attempts and
   follow the local recovery plan.
6. Preserve current payment/access state; controller outage is not permission
   to recreate grants or start a second worker.

### 12.8 Voucher rejected or stock discrepancy

1. Do not ask the customer to post the voucher publicly or share its full code
   in an unprotected channel.
2. Verify package/batch status and the approved sales/custody record.
3. Check whether it was already redeemed, expired, revoked or rate-limited
   using the protected system.
4. Do not repeatedly guess codes or bypass durable attempt limits.
5. Escalate possible duplicate sale, exposed batch or stock mismatch to the
   voucher custodian; preserve batch and audit references.
6. Do not issue a replacement code unless the authorized procedure confirms
   the original disposition and avoids duplicate entitlement.

### 12.9 Admin action appears successful but router state differs

1. Do not repeat the action.
2. Record actor, action, timestamp, internal object/job/command identifier and
   safe error.
3. Determine whether the path is native or legacy and which worker owns it.
4. Obtain a fresh authorized router readback.
5. If payment, entitlement or access state conflicts, pause further changes
   and notify operations plus finance where relevant.
6. Use the approved rollback/reconciliation procedure only after target
   identity and original state are confirmed.

## 13. Audit, evidence and escalation

### 13.1 Audit record minimum

For each sensitive administrative action, retain:

- actor/device/session identity as permitted by policy;
- action and reason;
- site/router and affected entity reference;
- timestamp/time zone and correlation/change reference;
- prior state and requested state, safely minimized;
- command/job ID and actual result/readback;
- any payment/entitlement reference needed for reconciliation; and
- approver and follow-up owner if the action was exceptional.

The source contains an audit-log table and some actions write audit events, but
the field plan calls for more complete audit visibility and reliable native
command/readback semantics. Do not assume every legacy job, router mutation or
finance event is represented in one complete audit trail.

### 13.2 Evidence handling

- Keep raw router exports, customer/payment data, voucher CSVs, request bodies,
  device identifiers and secrets in protected approved storage only.
- In routine cases, include a protected evidence reference and a short
  redacted summary, not the raw data.
- Capture timestamps with time zone and source (customer report, provider,
  application, controller, router or AP).
- Do not retain packet captures or app metadata longer than an approved
  troubleshooting purpose requires.
- Do not mark a case resolved until the customer-visible result and any
  required financial/router state are independently confirmed.

### 13.3 Escalation ownership

The following owners/contact details must be assigned by the project; they are
not recorded in this chapter:

| Escalation | Required owner role |
| --- | --- |
| Router/AP/site outage and physical access | Network/site custodian |
| Controller, deployment or command/observation failure | Application/controller operator |
| Collection, settlement, treasury, duplicate payment or refund question | Finance/payment owner |
| Customer status, voucher, package or support communication | Service/support owner |
| Passkey/device compromise or suspected unauthorized access | Security/admin custodian |
| Change approval and service stop/restart | Service/change owner |

If the correct owner is unknown or unavailable, keep the issue open and do not
perform a high-impact workaround.

## 14. Current implementation register

This table describes source and dated planning evidence reviewed while
preparing the chapter. It is not a fresh production probe.

| Area | Source-based status | Operator consequence |
| --- | --- | --- |
| Passkey login/provisioning | Implemented paths exist; active device list, device revocation and three-slot limit are described. | Use approved devices and retain a recovery device; no fine-grained staff RBAC is established. |
| Admin overview | Database totals, recent payments and legacy queue counts are rendered. | Treat as summaries, not a complete native router, finance or support console. |
| “System online” | Static label in protected layout. | Do not use as operational health evidence. |
| Readiness | Authenticated `/api/admin/v1/readiness` route exists in checked source. | Point-in-time readiness only; field plan identifies checks needing reconciliation. |
| Network grant/extend/revoke | UI actions exist but field assessment says they use legacy grant/job mechanisms. | Do not use for field/native access without release-specific acceptance and authorization. |
| Free-site page | Saves domain rows and queues legacy sync job. | Not proof of native app/IP/firewall policy application or router readback. |
| Payments view | Lists payment rows and selected fields; not the full proposed finance/access timeline. | Use protected reconciliation procedures; do not equate status with active service. |
| Package page | Creates/toggles values represented by current package schema. | Product semantics and field policy parity require approval and separate verification. |
| Voucher batch page | Batch display and protected export route exist in source. | Stock custody, retailer accountability and full lifecycle controls require an approved process. |
| Native admin operations/API | Several endpoints/workflows are proposed in planning documents; do not treat TOC/API examples as implemented. | Verify exact deployed release and documented tested function before operational use. |

## Appendix A: operator shift checklist

### Opening

- [ ] Operator, service owner and escalation contacts confirmed.
- [ ] Correct site, application release, controller release and gateway identity
  recorded.
- [ ] Fresh router observation checked separately from controller heartbeat.
- [ ] WAN/DNS/AP/client-session state assessed with timestamp and source.
- [ ] Native pending/failed order state reviewed through the accepted method.
- [ ] Unresolved collection/settlement and paid-but-not-active cases reviewed.
- [ ] No competing legacy worker/controller is issuing access to this gateway.
- [ ] Free policy and package revision match the approved site contract.
- [ ] Support channel, local custodian and recovery path reachable.
- [ ] Voucher stock/export custody confirmed if vouchers are being distributed.

### Closing

- [ ] Open customer/payment/access cases handed to named owner.
- [ ] All test purchases have known original references and final disposition.
- [ ] No unsupported grant/extension/revoke or free-site mutation remains
  pending.
- [ ] Device/session/command discrepancies recorded as open incidents.
- [ ] Protected evidence references and data minimization checked.
- [ ] Voucher exports returned to approved custody or securely removed per
  policy.
- [ ] Admin session signed out from shared devices.

## Appendix B: support case record

Complete only in the approved support system. Do not paste customer secrets or
full raw payment payloads into this template.

| Field | Record |
| --- | --- |
| Protected case ID / opened time and zone |  |
| Support operator / escalation owner |  |
| Site and approved gateway reference |  |
| Customer's issue in their own words (minimized) |  |
| Device type/app version if relevant |  |
| Cellular fallback status, if consented/tested |  |
| Original payment reference (protected) |  |
| Provider collection status and timestamp |  |
| Settlement/delivery status and timestamp |  |
| Entitlement/order status and original expiry |  |
| Router observation/acknowledgement status and age |  |
| Customer-visible test/result |  |
| Actions taken and authorizations |  |
| Result/remaining uncertainty |  |
| Customer update/approved remedy reference |  |
| Evidence location, access controls and retention date |  |

**Do not request or enter:** M-Pesa PIN/OTP, wallet seed, admin/passkey
secret, router password, API token, full card details, or unnecessary identity
documents.

## 15. Source records

- [Documentation plan and Volume 03 brief](../mesh-documentation-plan-and-toc.md)
- [Mesh start here and evidence register](00-start-here.md)
- [Product and service contract](01-product-and-service.md)
- [Field deployment pack](02-field-deployment.md)
- [Proposed field deployment and admin assessment](../mesh-field-deployment-plan.md)
- [Current admin-control-plane design proposal](../../ADMIN_CONTROL_PLANE.md)
- [Mesh production operations and support boundaries](../mesh-production-operations.md)
- [Developer handoff and recovery guidance](../mesh-developer-handoff.md)
- [Home pilot and device limits](../mesh-pilot-readiness-and-device-plans.md)
- [Bitika-first payment recovery](../mesh-bitika-primary.md)
- [Six-digit voucher implementation evidence](../mesh-six-digit-vouchers.md)
