# Afribit Wi-Fi Product System

## Executive decision

Afribit should continue from the existing `Afribit-Wifi` codebase rather than rebuild on WISPBill, daloRADIUS, or the M-Pesa sample application. The current application already has the right pilot architecture: a mobile captive portal, package catalogue, Bitcoin Lightning invoices through BTCPay Server, signed payment webhooks, voucher management, a passkey-protected operator area, and an outbound-only agent that applies access changes to MikroTik.

The product is not yet a replacement for WISPMAN. It is a functioning captive-portal foundation with several important operational gaps: M-Pesa is absent; prices are effectively fixed in sats instead of stable in KES; data caps are stored but not enforced; there is no RADIUS accounting or trustworthy live-usage view; the model is single-router; the gateway has no heartbeat or stale-job recovery; automated coverage is very small; and clean installation currently fails because `package-lock.json` is inconsistent with `package.json`.

The recommended sequence is:

1. Harden the existing single-site Bitcoin hotspot and commission it on the test MikroTik and UniFi UAP-AC-M.
2. Make KES the catalogue price and let BTCPay quote the equivalent sats for each invoice.
3. Add M-Pesa-to-Lightning through a provider adapter, initially using Bitika's sandbox and signed webhooks.
4. Add real operational visibility, reconciliation, gateway health, and recovery.
5. Introduce FreeRADIUS only when accurate accounting, data caps, multiple routers, roaming, or PPPoE become requirements.

This approach preserves product ownership without trying to reproduce a mature ISP suite in one release. WISPMAN can remain a fallback during a controlled parallel run and can be cancelled only after Afribit passes payment, expiry, recovery, and reconciliation acceptance tests on real devices.

## What exists today

The repository currently contains the following usable capabilities:

| Area | Present state | Readiness |
| --- | --- | --- |
| Public captive portal | Mobile-first package and voucher flow | Pilot-ready |
| Bitcoin payments | BTCPay invoice creation, status polling, signed webhook verification | Needs wallet/liquidity and failure-path commissioning |
| Access control | Cloud job queue plus LAN agent using RouterOS REST | Good pilot design; needs recovery and stronger isolation |
| Package management | KES and sats fields, duration, speed and data settings | Price model and enforcement need correction |
| Vouchers | Encrypted export, hashed lookup, bounded redemption | Strong foundation; add rate limiting and transactional fulfillment |
| Admin authentication | Passkeys with three pre-provisioned device slots | Strong small-team design |
| Walled garden | Managed domains synchronized to MikroTik | Needs real-device dependency testing |
| Operations dashboard | Payments, grants and router-job views | Does not yet show actual router sessions, traffic, gateway heartbeat or revenue reconciliation |
| Multi-site / multi-router | A free-text `routerId` is captured | Not implemented as an ownership or routing boundary |
| M-Pesa | Product notes only | Not implemented |
| RADIUS accounting | Not present | Defer for pilot; required for scale and usage billing |

The Vercel project `novyrix-teams/bitcoin-valley-wifi` is linked, has recent successful production deployments, and exposes the expected configuration groups. At review time, `https://wifi.afribit.africa/` returned HTTP 200 and `/api/health` reported a connected database. The existing visual smoke test passed on 1440×900 and 390×844 viewports, including package selection, voucher-mode switching, protected-admin redirection, and health checks.

## Important gaps found in the current implementation

### 1. Stable prices are not implemented correctly

Packages contain both `priceKes` and `priceSats`, but Bitcoin invoices are created using the stored sats amount and `currency: "BTC"`. A plan advertised at KES 20 will therefore drift in shilling value as Bitcoin moves. This conflicts with the requirement that retail prices remain the same.

The catalogue should have one authoritative KES price. For a Bitcoin payment, create a BTCPay invoice denominated in `KES`; BTCPay fixes the BTC/Lightning amount for that invoice using the store's configured rate source and invoice window. BTCPay documents fiat-denominated invoices and configurable exchange-rate sources.^1 The payment record should snapshot the package price, quoted sats, exchange rate, fee, and quote time so historical reporting never changes.

Recommended monetary fields:

| Field | Purpose |
| --- | --- |
| `catalog_price_kes_minor` | Authoritative customer price in cents, even if normal prices are whole shillings |
| `quoted_sats` | Sats requested or delivered for this transaction |
| `exchange_rate_kes_per_btc` | Auditable rate snapshot |
| `provider_fee_kes_minor` / `provider_fee_sats` | Actual payment or conversion cost |
| `gross_kes_minor` | Customer-facing revenue |
| `net_sats` | Treasury amount received after fees |
| `quote_expires_at` | Prevents reuse of an old conversion quote |

### 2. Access is a bypass binding, not a complete session model

The gateway creates a MikroTik HotSpot `ip-binding` with `type=bypassed`. This is simple and suitable for a pilot, but it bypasses normal HotSpot authentication and does not produce the same accounting quality as a logged-in HotSpot/RADIUS user. Speed is enforced with a simple queue only when an IP address is available. `dataLimitMb` is passed through jobs but never applied. The database expiry becomes effective only when the agent claims another job and enqueues cleanup.

For the pilot, retain bypass bindings but make them operationally safe:

- create a unique router-scoped grant identity;
- reject malformed MAC and IP addresses;
- bind every job to a registered router/site rather than trusting a client-supplied router string;
- reconcile managed bindings and queues against the database on every agent start;
- run expiry cleanup locally as well as in the cloud;
- disconnect any active HotSpot session on revoke;
- report bytes, uptime and active client state back to the control plane;
- clearly label data-capped packages unavailable until enforcement exists.

For scale, use MikroTik as a RADIUS client and FreeRADIUS for authentication and accounting. RouterOS officially supports RADIUS for HotSpot and PPP/PPPoE, sends client MAC and NAS identity, accepts rate/data-limit attributes, and supports disconnect messages.^2

### 3. The job queue can strand work

A job moves from `queued` to `claimed`, but there is no lease expiry that returns abandoned claims to the queue. If the agent crashes after claiming, that grant can remain stuck forever. Job completion also does not require the job to be claimed by a particular agent, and one shared bearer token represents the entire gateway fleet.

Add registered agents, hashed per-agent credentials, router/site assignment, a claim lease, `claimed_by`, `lease_expires_at`, heartbeats, idempotency keys, and a reconciliation worker. Completion should use compare-and-set rules and save structured results. A dead-letter path should let an operator retry or cancel safely.

### 4. Fulfillment is not fully transactional

Voucher redemption increments the voucher before it creates the portal session and access grant. A later database or queue failure consumes the voucher without delivering access. Payment settlement similarly checks then inserts a grant in separate operations; the query reduces duplicates but a concurrent webhook race can still create two grants because no unique database constraint protects the payment-to-grant relationship.

Use database transactions and uniqueness constraints. Record every provider event using its provider event ID, acknowledge webhooks quickly, and perform fulfillment asynchronously and idempotently. Required invariants include one terminal fulfillment per payment, one consumption unit per voucher redemption, and one active router artifact per grant.

### 5. Public endpoints need abuse controls and stronger session binding

The payment and voucher endpoints accept a MAC address and router identity from the request body. That is expected in an external captive portal flow, but the values are client-controlled after leaving the router page. Payment-status lookup is public by UUID, and voucher redemption has no visible rate limiter. Add a short-lived, signed portal-context token generated from router-provided values, normalize and validate MAC/IP values, rate-limit by token/MAC/IP, and never rely on `routerId` supplied by the browser for job routing.

Client MAC randomization also means a phone's identity may change after forgetting the network or changing privacy settings. Treat MAC as a network-session identifier, not a durable customer identity.

### 6. Reproducibility and testing are below production standard

A clean `npm ci` fails because the lockfile omits packages required by the manifest's resolved tree. Installing without the lockfile allowed lint and TypeScript checks to pass, and the production build passed after development environment variables were pulled from Vercel. The dependency audit on the committed resolution reported affected Next.js and Sharp versions; the unconstrained install selected newer packages, illustrating why `"latest"` versions and a stale lockfile are dangerous.

Pin dependency versions, regenerate and commit the lockfile, and add CI that runs `npm ci`, lint, type checking, unit tests, migrations against an isolated database, and a production build. The two current browser scripts are useful smoke tests, but one directly deletes and inserts passkey records in the configured database. It must never run against shared development or production data.

## What to salvage from the reference projects

### WISPBill

WISPBill-Web-App describes billing, user management, monitoring and provisioning, but the repository is archived and its last push was in November 2016. It is based on Laravel 5.2 and PHP 5-era constraints. Its AGPL-3.0 license also requires care if code is incorporated into a network service. It should be used only as a feature checklist and workflow reference, not as code or architecture.^3

### daloRADIUS

daloRADIUS is active and is the strongest reference for subscriber AAA, RADIUS accounting, NAS management, reporting and operator workflows. Its architecture—FreeRADIUS plus a relational database and management interface—is appropriate when Afribit moves beyond one hotspot. Its GPL-2.0 code should remain a separate service unless Afribit deliberately accepts the license implications. Integrating through the RADIUS database/protocol or a clearly separated adapter is preferable to copying UI/backend code.^4

### Frost-bit-star M-Pesa Wi-Fi billing

This MIT-licensed repository is useful for understanding the basic Daraja STK flow and RouterOS command vocabulary, but its implementation should not be copied into production. The callback trusts callback fields without adequate independent reconciliation, hard-codes amount-to-duration mappings, records a 24-hour expiry regardless of the chosen duration, replaces the checkout correlation value with the receipt number, and creates bypass bindings that do not expire on the router. Its useful salvage is limited to payload shapes, phone normalization ideas, and test fixtures.^5

### Comparative conclusion

| Option | Strength | Main problem | Decision |
| --- | --- | --- | --- |
| Continue Afribit | Already matches Bitcoin-first UX and deployed stack | Operational hardening incomplete | Foundation |
| Rebuild on WISPBill | Broad historical ISP concepts | Archived, obsolete, AGPL, Windows checkout issue | Reject |
| Rebuild on daloRADIUS | Mature RADIUS/AAA concepts | Different stack and poor fit for Bitcoin-first customer UX | Run later as an AAA subsystem |
| Fork M-Pesa sample | Familiar Kenya payment demo | Unsafe business logic and weak lifecycle controls | Reference only |

## Recommended product architecture

```text
Customer phone
    |
    | Wi-Fi / captive redirect
    v
UniFi UAP-AC-M  -- client isolation, SSID/VLAN -->  MikroTik HotSpot gateway
                                                        |
                                                        | LAN-only RouterOS REST now
                                                        | RADIUS later
                                                        v
                                              Afribit gateway agent
                                                        |
                                                        | outbound HTTPS, leased jobs,
                                                        | heartbeat and reconciliation
                                                        v
Afribit control plane: portal + admin + API + PostgreSQL
    |                         |                         |
    |                         |                         |
BTCPay adapter          Bitika adapter           FreeRADIUS adapter (later)
Lightning/BTC           M-Pesa -> Lightning      auth + usage accounting
```

The UniFi AP should act as the wireless access layer, with the MikroTik remaining the gateway, DHCP, firewall, captive portal, and policy enforcement point. Put customer Wi-Fi on its own VLAN/subnet, enable wireless client isolation, and block guest-to-management and guest-to-LAN traffic. Ubiquiti's current guidance explicitly recommends network/VLAN isolation and client-device isolation for public Wi-Fi.^6

The control plane should not expose RouterOS to the public internet. The existing outbound-polling agent is the correct boundary. In production, the agent should run on an always-on device—not an operator laptop—with secure boot/update procedures, local logs, and a supervised service. RouterOS management should use HTTPS with a trusted/private CA certificate or a secure management tunnel, a dedicated least-privilege account, and firewall restriction to the agent host.

### Domain boundaries

Organize code around stable business concepts rather than providers:

- `catalog`: packages, price versions and availability;
- `checkout`: portal context, orders and quotes;
- `payments`: provider adapters, attempts, events, refunds and reconciliation;
- `entitlements`: what access was purchased and for how long;
- `network-control`: sites, routers, agents, jobs and observed state;
- `aaa`: credentials, sessions and usage records when RADIUS is introduced;
- `operations`: alerts, audit log, support notes and reports.

An `Order` should be distinct from a `PaymentAttempt`. One order may have an expired Lightning invoice followed by a successful M-Pesa attempt, but it should create only one entitlement.

## Bitcoin and M-Pesa design

### Bitcoin primary path

Use BTCPay Server with the store connected to an Afribit-controlled Lightning wallet/node. Create invoices in KES, allow the store to quote Lightning sats, and grant access only on the terminal settled state. BTCPay's Greenfield API exposes invoice and webhook operations and supports signed settlement notifications.^7

The current three-minute low-speed bootstrap grant is creative but risky: it briefly allows broader internet access so a wallet on the same phone can reach its backend. Keep it disabled by default until tested for bypass abuse. Prefer, in order:

1. a wallet on another device;
2. a payment wallet reachable through a tightly tested walled garden;
3. an LNURL/lightweight wallet path with known domains;
4. the cooldown-protected bootstrap as a last-resort convenience;
5. a physical voucher fallback.

### M-Pesa with Bitcoin settlement

Two modes should exist behind the same provider interface:

**Mode A — Bitika conversion:** Afribit sends KES amount, phone number and its Lightning destination. Bitika documents M-Pesa/Airtel collection, direct Lightning payout, idempotency keys, a sandbox state machine, signed webhook delivery, KES 10–10,000 limits, and a 3% live fee.^8 Grant access only after the `fulfilled` / `payment.completed` terminal result, meaning both mobile-money collection and Lightning payout succeeded. If M-Pesa is charged but Lightning payout fails, show “payment received, activation pending,” reconcile by transaction code, and never ask the customer to pay twice.

**Mode B — Direct Daraja:** collect KES to Afribit's own M-Pesa business account using Safaricom APIs, then convert treasury balances to Bitcoin separately. Safaricom's Daraja portal provides sandbox and M-Pesa APIs, while its business portal exposes C2B, reversals and transaction-status operations.^9 This reduces per-transaction dependency on a converter but does not itself settle in Bitcoin. Automated conversion would require a compliant conversion provider and a separate treasury process.

Mode A best matches the stated goal and is quickest to pilot. Mode B is the resilience and cost-control path. Build both behind an interface such as `createPayment`, `getPayment`, `verifyWebhook`, `mapStatus`, and `reconcile` so the network entitlement code never knows which provider was used.

## WISPMAN replacement scope

WISPMAN's public Hotspot-only plan is KES 1,500 per month for up to 99 clients and advertises Hotspot user management plus payment and expiry tracking.^10 Replacing that subscription is not just a portal exercise. Afribit should meet the following exit gate before cancelling it:

| Capability | Minimum replacement criterion |
| --- | --- |
| Packages | Versioned KES prices, durations, speed settings and activation windows |
| Payments | Lightning and M-Pesa attempts, exact reconciliation, refunds/manual resolution |
| Expiry | Router-side expiry plus cloud/local reconciliation after outages |
| Clients | Actual active router sessions, not only database grants |
| Usage | Uptime and byte counters; alerts when a cap or fair-use policy is reached |
| Support | Search by phone, receipt, invoice, MAC, order or voucher; operator notes |
| Reliability | Gateway heartbeat, offline alerts, dead-letter queue and recovery |
| Audit | Immutable record of price changes, grants, extensions, revocations and admin actions |
| Reporting | Daily revenue, provider fees, successful fulfillment, failures and active sessions |
| Backup | Documented database restore and router configuration rollback test |

At only KES 18,000 per year for the current WISPMAN plan, self-hosting should not be justified purely as subscription savings. The business case is ownership of the customer journey and data, Bitcoin-native settlement, custom automation, avoidance of per-client platform pricing, and the ability to expand to multiple locations. Operating and maintaining this system will cost more than KES 1,500 per month in engineering time, even if infrastructure stays inexpensive.

## Security, privacy and regulatory gates

This report is technical guidance, not legal advice. Before public commercial launch, obtain Kenya-specific advice on the service-provider licence, privacy registration/notice, tax treatment, M-Pesa merchant terms, and the Bitcoin conversion arrangement.

- The Communications Authority's April 2026 structure includes Micro Network and Service Provider, Community Network and Service Provider, Application Service Provider and Public Communications Access Centre categories. Confirm which licence or upstream-reseller arrangement applies to the exact deployment before selling public access.^11
- Kenya's Virtual Asset Service Providers Act commenced on 4 November 2025. It regulates listed custody, exchange, trading/settlement and offering activities. Simply accepting Bitcoin for Afribit's own connectivity service is analytically different from operating an exchange, but automatically converting customers' M-Pesa to Bitcoin through an API should be reviewed under the Act and current regulations. CBK and CMA stated that licensing would begin after implementing regulations; draft regulations were published in 2026.^12
- Phone numbers, payment identifiers, IP/MAC observations and support records should be handled as personal or linkable data. The ODPC states that Kenyan controllers/processors must register under the Data Protection Act framework.^13 Publish a privacy notice, define retention periods, restrict operator access, and avoid collecting names or IDs when the service does not need them.
- Keep the Bitcoin wallet non-custodial to Afribit where possible, segregate operational and treasury wallets, define approval limits, and back up wallet/node recovery material offline. Never place seed phrases or macaroon/admin credentials in Vercel.
- Rotate the GitHub personal access token disclosed in the project conversation. Use the already authenticated GitHub CLI or a narrowly scoped fine-grained token, not a classic token pasted into messages.

## Delivery plan

### Phase 0 — Baseline and safety, 2–3 days

- Revoke the disclosed GitHub token.
- Pin dependencies, regenerate the lockfile and resolve the dependency audit.
- Add a repository license and ownership notice.
- Create isolated local/test database configuration.
- Add CI and prevent test scripts from accepting a production database without an explicit guard.
- Document current WISPMAN packages, prices, active users and expiry behavior for parallel comparison.

Exit: clean clone passes `npm ci`, lint, type checking, tests and build.

### Phase 1 — Reliable single-site Bitcoin pilot, 1–2 weeks

- Change the catalogue to KES-authoritative, versioned prices and KES-denominated BTCPay invoices.
- Add orders, provider payment attempts, provider events and monetary snapshots.
- Make webhook fulfillment transactional and idempotent.
- Add gateway registration, per-agent token, heartbeat, claim leases and stale-job recovery.
- Add router-state reconciliation, disconnect-on-revoke and local expiry.
- Validate the MikroTik configuration and UniFi guest VLAN/client isolation.
- Test on Android, iOS and a laptop with mobile data off.

Exit: 50 low-value end-to-end test purchases with no unfulfilled settled payment, no access after expiry, and documented recovery from agent/router/internet restarts.

### Phase 2 — M-Pesa-to-Bitcoin, about 1 week

- Implement the Bitika sandbox adapter and signed webhook verification.
- Model `processing_payment`, `fulfilled`, `failed`, and `payment_failed` distinctly.
- Add idempotency keys, transaction lookup and reconciliation job.
- Add phone-number masking and retention rules.
- Run fee and price tests so the customer pays the advertised KES amount while Afribit reports gross KES, conversion fee and net sats.

Exit: sandbox happy path and forced failure paths pass; live-key/compliance review completed before real charges.

### Phase 3 — WISPMAN replacement operations, 2–3 weeks

- Add live router session inventory, usage snapshots, gateway alerts and support search.
- Add payment settlement/revenue dashboards and CSV export.
- Add refunds/manual resolution workflow and operator notes.
- Add backup/restore drills and incident runbooks.
- Run Afribit and WISPMAN in parallel for at least two billing/expiry cycles.

Exit: every WISPMAN Hotspot-only function actually used by the team has an Afribit equivalent and the exit-gate metrics hold during parallel operation.

### Phase 4 — Scale and RADIUS

- Add first-class sites, routers, NAS identities and agent assignments.
- Deploy FreeRADIUS with RadSec or a protected management network.
- Use RADIUS accounting and MikroTik attributes for rate limits, total limits and session controls.
- Add PPPoE only if the business begins selling managed home subscriptions that require it.

Exit: multi-router tests prove that a site cannot claim or apply another site's job, and accounting survives reconnects and delayed stop records.

## Pilot acceptance metrics

Use measurable gates instead of “looks complete”:

- portal load success ≥ 99% on the test SSID;
- settled-payment-to-access p95 ≤ 15 seconds on Lightning and ≤ 30 seconds on M-Pesa;
- 100% of settled payments have exactly one order fulfillment;
- zero successful access grants for invalid or replayed webhooks;
- expired-access removal p95 ≤ 60 seconds;
- router and agent outage detected within 60 seconds;
- 100% daily reconciliation between provider transactions, orders and grants;
- no guest route to router management, AP management, operator LAN or another guest;
- restore of database and router configuration demonstrated, not merely documented.

## Immediate recommendation

Do not reconstruct the product around any of the referenced repositories. Preserve the current portal and gateway boundary, fix the price/order/payment model first, and commission Bitcoin end to end on the test network. Implement Bitika next through a replaceable adapter because its present API is unusually well aligned with M-Pesa-to-Lightning settlement. Keep direct Daraja as the future fallback and FreeRADIUS as the scaling layer.

The next engineering milestone should be called **Reliable Single-Site Bitcoin Pilot**, not “full WISP system.” It produces a real, testable business outcome while laying the correct boundaries for M-Pesa, additional routers, accurate usage and PPPoE later.

## Sources

1. BTCPay Server, “[Stores FAQ: exchange rates and invoices](https://docs.btcpayserver.org/FAQ/Stores/).” Accessed September 2026.
2. MikroTik, “[RADIUS](https://help.mikrotik.com/docs/spaces/ROS/pages/328097/RADIUS)” and “[HotSpot customisation](https://help.mikrotik.com/docs/spaces/ROS/pages/87162881/Hotspot%20customisation).” Updated 2026 and 2024 respectively.
3. WISPBill, “[WISPBill-Web-App](https://github.com/WISPBill/WISPBill-Web-App).” Archived Laravel repository, last pushed November 2016.
4. Liran Tal et al., “[daloRADIUS](https://github.com/lirantal/daloradius).” GPL-2.0 RADIUS management project; repository reviewed September 2026.
5. Frost-bit-star, “[mpesa-based-wifi-billing](https://github.com/Frost-bit-star/mpesa-based-wifi-billing/tree/53307788d96e6cfc93f41d6a6dc5b84edf6d2fbe).” MIT-licensed source at commit `5330778`, July 2026.
6. Ubiquiti, “[Best Practices: Guest WiFi](https://help.ui.com/hc/en-us/articles/23948850278295-Best-Practices-Guest-WiFi)” and “[Creating UniFi WiFi SSIDs](https://help.ui.com/hc/en-us/articles/26136823938583-Creating-UniFi-WiFi-SSIDs).” Accessed September 2026.
7. BTCPay Server, “[Greenfield API v1](https://docs.btcpayserver.org/API/Greenfield/v1/)” and “[Greenfield API example with Node.js](https://docs.btcpayserver.org/Development/GreenFieldExample-NodeJS/).” Accessed September 2026.
8. Bitika, “[API Documentation](https://bitika.xyz/developers/docs)” and “[Developers](https://bitika.xyz/developers).” Accessed September 2026.
9. Safaricom, “[Daraja Developer Portal](https://developer.safaricom.co.ke/)”; M-Pesa, “[Business API developer portal](https://business.m-pesa.com/developers/).” Accessed September 2026.
10. WISPMAN, “[ISP Management Platform and pricing](https://wispman.net/).” Accessed September 2026.
11. Communications Authority of Kenya, “[Market Structure](https://www.ca.go.ke/index.php/market-structure)” and “[Licensing Procedures](https://www.ca.go.ke/licensing-procedures).” Current structure published April 2026.
12. Kenya Law, “[Virtual Asset Service Providers Act, No. 20 of 2025](https://new.kenyalaw.org/akn/ke/act/2025/20/eng@2025-11-04)”; Central Bank of Kenya and Capital Markets Authority, “[Commencement public notice](https://www.centralbank.go.ke/uploads/press_releases/665231223_Public%20Notice%20on%20the%20Virtual%20Assets%20Service%20Providers%20Act%202025.pdf)”; CBK, “[Draft VASP Regulations 2026 notice](https://www.centralbank.go.ke/2026/03/18/public-notice-invitation-for-comments-from-the-public-on-the-draft-virtual-asset-service-providers-regulations-2026/).”
13. Office of the Data Protection Commissioner, “[Frequently Asked Questions](https://www.odpc.go.ke/faqs/)”; Kenya Law, “[Data Protection Act, No. 24 of 2019](https://new.kenyalaw.org/akn/ke/act/2019/24/eng@2019-11-15).”
