---
title: "Building Afribit Wi-Fi, One Test at a Time"
slug: "building-afribit-wifi"
author: "Afribit"
date: "2026-09-09"
status: "draft"
excerpt: "Afribit is building an operator-owned, Bitcoin-first Wi-Fi platform for reliable community internet access in Kenya."
meta_description: "Inside Afribit's journey to build operator-owned, Bitcoin-first community Wi-Fi with MikroTik, Lightning, and future M-Pesa support."
primary_keyword: "Bitcoin Wi-Fi Kenya"
secondary_keywords:
  - "community Wi-Fi"
  - "MikroTik hotspot"
  - "Lightning payments"
  - "M-Pesa to Bitcoin"
  - "Afribit"
cover_image_alt: "A community member connecting to the Afribit Wi-Fi portal on a mobile phone"
---

# Building Afribit Wi-Fi, One Test at a Time

Internet access should be simple: connect, choose a package, pay, and get online. Behind that short journey, however, is a chain of systems that must work together without guesswork. Payments must be confirmed correctly. Access must begin quickly, end at the promised time, and recover safely after an outage. Operators need to know what happened when something goes wrong.

Afribit is building its own Wi-Fi management platform to take ownership of that chain. Our goal is not merely to replace a monthly software subscription. We want a Bitcoin-first system that we can understand, operate, test, and improve locally—while keeping familiar package prices in Kenyan shillings and preparing for M-Pesa support.

This is a build-in-public story. The foundation exists, but important work remains before we can call it a complete replacement for the platform we use today.

## Why we are building our own Wi-Fi platform

We currently rely on third-party WISP software to help manage hotspot access. It performs an important job, and we will keep it available while we test our own platform. But depending entirely on an external system limits how deeply we can integrate Bitcoin, automate our operations, and shape the customer experience.

Ownership gives us more than control over a dashboard. It gives us the ability to answer practical questions with evidence:

- Was a payment received and settled?
- Did the correct device receive the correct package?
- Is a router online and applying access changes?
- Did access expire when it should?
- Can an operator safely recover a failed job without charging the customer twice?

Those questions are central to trust. A customer should never lose money because two systems disagree, and an operator should not have to guess whether a router accepted a command.

Our business case is therefore bigger than saving the current subscription fee. It is about owning the customer journey, keeping operational data under our control, supporting Bitcoin-native settlement, and creating a platform that can grow with our communities.

## What the Afribit system can do today

Afribit Wi-Fi already has a working technical foundation. The customer-facing captive portal is deployed and designed for mobile devices. It can present internet packages, create Bitcoin invoices through BTCPay Server, accept vouchers, and place access-control work into a queue for a local network agent.

The operator side has passkey-based authentication and early views for payments, access grants, vouchers, packages, and router jobs. A new readiness API foundation is also being developed so an authenticated administrator can see whether critical parts of the platform are configured without exposing secret values.

Our test network brings together three clear layers:

1. A UniFi UAP-AC-M provides the wireless connection.
2. A MikroTik router acts as the gateway and enforces access rules.
3. The Afribit cloud platform makes business decisions, while a local outbound-only agent safely carries approved changes to the router.

Keeping those responsibilities separate is deliberate. The Wi-Fi access point should not run the billing system, and the public application should not expose the MikroTik management interface to the internet. The cloud decides what access a customer should have; the router remains the final enforcement point.

This is a promising pilot, not yet a finished WISP platform. We still need formal router onboarding, agent identity and heartbeat monitoring, reliable job recovery, trustworthy live-session accounting, stronger automated tests, and a complete operator control surface.

## Bitcoin first, with stable prices in shillings

Bitcoin is the primary payment rail in our vision. We are integrating it through BTCPay Server so Afribit can receive payments into infrastructure we control instead of asking a payment intermediary to control customer access.

At the same time, customers need predictable prices. A package advertised at KES 20 should remain KES 20 even when the Bitcoin exchange rate moves. Our target model is simple: the catalogue price stays fixed in Kenyan shillings, and BTCPay calculates the corresponding amount in satoshis when the customer creates an invoice. The transaction then records the quote used at that moment for accurate support and reconciliation.

M-Pesa is also part of the roadmap. We plan to evaluate Bitika in its sandbox as an adapter for collecting mobile money and settling value over Lightning. This path will be tested carefully before any live rollout, including cases where M-Pesa succeeds but the Lightning payout is delayed or fails. If money has been collected, the customer must not be asked to pay again while systems reconcile the transaction.

Payment providers will remain replaceable components. Whether a customer pays with Lightning, M-Pesa, or a voucher, the result should be the same standard access entitlement with one expiry model and one audit trail.

## Onboarding a MikroTik safely

Adding a router cannot mean pasting permanent cloud credentials into an unknown device or exposing RouterOS to the public internet. Our planned onboarding flow starts in the Afribit admin system, where an operator registers a site and its router, reviews the expected configuration, and generates a short-lived, one-time enrollment code.

An always-on agent inside the local network uses that code to establish its own identity. It then reports its capabilities and heartbeat over an outbound encrypted connection. Before the platform permits any change, the agent must pass a read-only connectivity test. Router actions should be previewable, auditable, limited to the assigned site, and recoverable.

Our first real-device acceptance test is intentionally small: give a designated phone five minutes of access, confirm that the speed policy is applied, and prove that the access is removed on schedule. We will then repeat the test through router restarts, internet interruptions, duplicate payment events, and agent restarts.

This method may feel slower than declaring a feature complete after one successful demo. In practice, it is how we learn where systems break before customers depend on them.

## From paid access to a community router

Reliable paid internet is the first milestone, but it is not the end of the idea. Afribit's longer-term community router concept explores how local connectivity can also support Bitcoin education and community activity.

Potential features include sponsored access, learn-to-earn lessons, a curated set of free Bitcoin education sites, an offline library that saves bandwidth, meetup listings, and a local Bitcoin merchant directory. A learner who completes an approved lesson could receive a small, time-bounded internet entitlement funded by a sponsor pool.

These ideas will use the same access engine as paid packages. We do not want a second, weaker system for free access. Sponsored rewards need the same limits, expiry rules, audit history, and abuse controls as any other entitlement.

Some ideas require more caution. For example, hosting paid private file storage would introduce significant privacy, security, backup, and content risks, so it is not part of the current roadmap. The priority is dependable connectivity first.

## How we will know the system is ready

We are defining readiness through measurable tests rather than the number of screens in the dashboard. Before Afribit replaces the existing hotspot platform, we want to demonstrate that:

- every settled payment creates exactly one access grant;
- expired access is removed promptly;
- invalid or replayed webhooks never activate a device;
- router and agent outages are visible to an operator;
- guests cannot reach router management, access-point management, the operator LAN, or one another;
- provider transactions, orders, and grants reconcile every day; and
- database and router configuration recovery has been tested, not only documented.

We will initially run Afribit and the existing platform in parallel. The test MikroTik, UniFi access point, and designated client devices give us a safe place to reproduce failures, patch them, and run the same tests again. Only after repeated payment, activation, expiry, outage, and recovery cycles pass will we consider the new platform ready to stand on its own.

## Building infrastructure we can understand

Afribit Wi-Fi is ultimately about practical ownership. We are building a system in which package prices remain understandable, Bitcoin payments settle to Afribit-controlled infrastructure, routers are managed safely, and operators can act from evidence instead of guesswork.

The next milestone is a reliable single-site Bitcoin pilot. From there, we can add M-Pesa-to-Lightning testing, deeper network visibility, multiple sites, and community features on top of a dependable core.

We will keep sharing what works, what fails, and what we learn. If you operate community internet, build with MikroTik, work on Bitcoin payments, or want to support access and education, follow Afribit's journey and join the conversation.

---

## Vlog adaptation

### Suggested title

We Are Building Afribit's Own Bitcoin Wi-Fi System

### Thumbnail text

OUR OWN BITCOIN WI-FI

### 90-second script

What if connecting to community Wi-Fi was as simple as choosing a package, paying with Bitcoin, and getting online in seconds—with the operator owning the entire system?

That is what we are building at Afribit.

Today, we use third-party software to help manage hotspot access. It works, but we want more control over our customer experience, our operational data, and how Bitcoin fits into the network.

Our current prototype already has a mobile captive portal, Bitcoin invoices through BTCPay Server, vouchers, a protected admin area, and a local agent that can send approved access changes to a MikroTik router. A UniFi access point handles the wireless connection, while the MikroTik remains the gateway that enforces the rules.

But we are not calling it finished. We still need secure router onboarding, live health monitoring, reliable recovery, better network accounting, and much more testing on real devices.

Bitcoin will be the primary payment rail, while package prices remain stable in Kenyan shillings. M-Pesa-to-Lightning through Bitika is on the roadmap, but it will go through sandbox and failure testing before it touches live customer money.

Later, the same platform could support sponsored access, learn-to-earn lessons, an offline education library, meetups, and a local Bitcoin merchant directory.

We are building this one test at a time—and we will share the successes, mistakes, and improvements along the way. Follow Afribit to see the journey from a single test router to community-owned connectivity.

### Suggested shots

1. A phone joining the Afribit Wi-Fi network.
2. The captive portal package screen.
3. A close-up of the MikroTik router and UniFi access point.
4. A Lightning invoice being created, using test data only.
5. The protected admin dashboard and readiness status.
6. A five-minute access test starting and expiring.
7. A simple roadmap graphic: Bitcoin pilot, M-Pesa, network operations, community tools.
8. Afribit logo and the closing call to follow the project.

### Publishing checklist

- Replace screenshots with test accounts and redact phone numbers, MAC addresses, invoice IDs, router IPs, and credentials.
- Add the final Afribit follow or contact link to the closing call to action.
- Confirm the exact public wording for Bitika before publication; describe it as roadmap work until sandbox tests pass.
- Do not show wallet seeds, API keys, admin pairing codes, environment files, or the RouterOS management interface.
