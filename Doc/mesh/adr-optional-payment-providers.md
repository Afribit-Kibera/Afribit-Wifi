# ADR: optional payment providers for Mesh

**Status:** Accepted for local implementation; live commissioning pending
**Date:** 5 October 2026
**Deciders:** Afribit operator, based on the explicit Bitcoin-first/provider direction

## Context

Mesh already has a BTCPay payment path. Customers should also be able to pay M-Pesa through Bitika while Afribit receives Bitcoin. The operator requires Bitika to be replaceable and optional. The captive and routed network must remain available during a payment-provider outage. The supplied credential is a test key, and the operating paid pilot must not receive sandbox sales or grants.

## Decision

**5 October addition:** Paystack is added as a third optional adapter after Bitika's live request fails. The operator chooses an initial collection-only test, with Bitcoin settlement pending. Keep fiat collection proof separate from Bitcoin delivery and internet grants. Retain the existing shared Insats callback; a metadata tag alone does not establish routing. Blink is a receiving-wallet adapter; it does not implicitly convert KES or authorize outgoing treasury payments. [Implementation and actual checkpoint](mesh-paystack-collection.md).

Use a small server-side `PaymentProvider` interface and registry, with independent BTCPay and Bitika adapters. Default requests remain BTCPay. Advertise optional methods only when explicitly enabled and correctly configured for live checkout. Keep provider signatures/callbacks separate, normalize verified financial outcomes, and perform Bitika receipt/grant/job creation atomically. Stable references handle retries; no automatic fallback initiates another charge.

## Options considered

### A: Shared contract with separate adapters

| Dimension | Assessment |
| --- | --- |
| Complexity | One interface, registry and provider-specific callback |
| Cost | Provider fees remain specific to the selected payment method |
| Scalability | Add an adapter without coupling welcome/transport to its API |
| Familiarity | Retains the existing BTCPay API and schema |

This supports disabling Bitika independently and makes state verification explicit. Each new provider still requires its own financial and device acceptance tests.

### B: Bitika-specific branches throughout checkout and access code

| Dimension | Assessment |
| --- | --- |
| Complexity | Initially fewer files, more coupling as providers grow |
| Cost | Same provider fees |
| Scalability | Each provider requires edits across unrelated flows |
| Familiarity | Extends existing route code directly |

This offers little separation between provider availability and network readiness. It is not selected.

## Trade-off analysis

The contract deliberately stays small: checkout creation and verified status lookup. It does not pretend webhooks, conversion rates or payout failures share one protocol. The current schema stores provider metadata and keeps the common pass lifecycle. Transactional financial handling is tested using PostgreSQL behavior rather than a mock of the SQL statement. Production gateway routing/expiry remains a separate dependency that must be commissioned before payments grant real access.

## Consequences

- Bitika can be disabled while BTCPay, vouchers and local welcome remain available.
- Test credentials can verify the adapter without adding simulated revenue or internet access.
- Provider settlement verification and duplicate delivery handling require explicit tests.
- New providers join the interface/registry and supply their own trusted callback handling.
- The live gateway still needs trusted router/session ownership and local expiry.

## Action items

1. [x] Provider contract, registry, Bitika adapter and gated M-Pesa checkout UI.
2. [x] Isolated settlement/retry/failure tests and actual Bitika sandbox verification.
3. [ ] Reachable test callback deployment and provider signing-secret registration.
4. [ ] Native short-pass proof, trusted gateway lifecycle and real payment commissioning.
