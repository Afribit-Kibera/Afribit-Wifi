# Mesh: optional Bitika payment provider

5 October 2026. **Implemented, tested and deployed on `wifi.afribit.africa` with live credentials; new M-Pesa checkout remains disabled pending commissioning.** The operator confirms the flow is customer M-Pesa collection followed by Bitcoin received by Afribit, and supplies `spira@blink.sv` as the destination. M-Pesa payouts to customers are outside this integration.

## Provider boundary

`lib/payments/types.ts` defines the payment-provider contract. `providers.ts` keeps BTCPay as the default and constructs only the chosen provider; `bitika.ts` implements collection, lookup, quote, destination matching and signature verification. Bitika credentials, downtime or disablement do not prevent BTCPay, voucher handling, the router-hosted welcome or mesh transport from operating. No direct M-Pesa/Daraja integration is added.

The payment API accepts `provider: "btcpay" | "bitika"`; omission preserves BTCPay. Future adapters implement `PaymentProvider` and join the registry/method list. Provider callbacks remain separate because their signatures and financial state machines differ. The existing payment table's provider/metadata fields support the integration; no production schema migration or database write was performed.

The server advertises M-Pesa only when `BITIKA_ENABLED=true`, mode/key are live, the receiving address is valid and a signing secret is configured. The mobile UI then offers Bitcoin or M-Pesa, collects a phone number and displays the exact package KES amount. It never asks for an M-Pesa PIN. Bitika collection is server-to-server; this path does not issue the existing general-internet payment-bootstrap grant or require customer access to a Railway wildcard.

## Test credentials and current evidence

**Current result, 5 October:** live credentials, the supplied payer number and webhook signing secret are configured privately. Owner Vercel access is restored; provider code and signer are deployed on the existing project. The KES 10 live collection and one identical replay both return generic HTTP 400 without a transaction code. The operator reports no M-Pesa prompt or dashboard error; authenticated lookup finds no current-attempt record. The full official reference matches the submitted contract, with no documented correction identified. No further collection is sent. Bitcoin delivery and paid access remain unverified; checkout stays disabled. The separate live tool retains one UUID and never imports the application database or grants router access. [Live rejection, deployment and next provider choice](mesh-bitika-live-commissioning.md).

The supplied test key is stored only in ignored **`.env.bitika.test`**, with test mode, the supplied destination and checkout disabled. This file is not automatically loaded by the normal Next application. Do not put the key in `NEXT_PUBLIC_*`, screenshots or tracked documentation. The separate live signing secret is configured only in ignored local storage and Vercel production.

Run the actual provider adapter's sandbox verification:

```powershell
npm run bitika:test
```

The script refuses live credentials, uses synthetic phone numbers and stable UUID idempotency keys, and checks transaction lookup until each expected terminal state appears. It writes only ignored evidence, never the application database or gateway queue.

Actual Bitika sandbox results against `spira@blink.sv`:

| Case | Provider result | Mesh handling |
| --- | --- | --- |
| Successful simulation | `fulfilled` | Verified simulated delivery; no sale or network grant |
| Declined collection | `failed` | Invalid payment; no access |
| Collected but Bitcoin undelivered | `payment_failed` | Pending resolution; no access and “Don’t pay again” copy |

All three cases and repeat-request idempotency pass. The provider's sandbox does not move money or send SMS/STK prompts. Evidence: `artifacts/mesh-lab/bitika-reference/adapter-sandbox-verification.json`. The initial read-only quote and sandbox probes, fetched official reference, and mobile fixture screenshots are in the same ignored folder. [Official Bitika reference](https://bitika.xyz/developers/docs).

Local checks:

```powershell
npm run test:payments
npm run test:mesh-payment-ui
npm run typecheck
```

Sixteen payment/commissioning tests pass using mocked provider requests and an isolated in-memory PostgreSQL engine. They check amount/destination/hash matching, replay-window signatures, stable references after ambiguous acceptance, one grant/job across duplicate callbacks, rollback when job insertion fails, declined/undelivered payments, sandbox exclusion, BTCPay independence and no automatic retry or payer-blaming copy for generic HTTP 400. Earlier mobile client fixtures pass at 320/390 px: exact router context, retry reference, no horizontal overflow, resolution copy and hidden disabled-provider controls. These are not live wallet, real callback delivery or router enforcement acceptance.

## Financial state and delivery

Every logical payment has one UUID, retained by the browser across retries and reloads and sent as Bitika's `Idempotency-Key`. Tab storage contains the reference and a digest of its context, not the phone or raw network fields. If storage is unavailable, the reference survives only while the page remains open. Once checkout has a concrete payment URL, its retained initiation reference is cleared so a later intentional purchase gets a new one. The server binds the reference to a fingerprint of the package, provider, network context and phone; a changed request returns 409. No automatic provider fallback is issued after an ambiguous collection outcome.

`app/api/webhooks/bitika/route.ts` validates the raw-body HMAC and timestamp before parsing. A callback triggers an authenticated lookup of the current transaction. The stored KES amount and Lightning destination must match; delivered sats must be positive and a payment hash must exist. Browser redirects, STK acceptance and collected M-Pesa alone cannot authorize a pass. `payment_failed` remains processing with a resolution flag, allowing later operator resolution rather than another automatic charge. The application records actual delivered sats, which can differ from the separate Bitcoin-denominated package price because the M-Pesa route sells at the stored KES price.

`bitika-settlement.ts` performs live receipt update, access-grant insert and router-job insert in one PostgreSQL statement. Duplicate events cannot mint another allowance; any insertion failure rolls the whole statement back. Package access terms are snapshotted when the purchase is created. Grants include the access-router target. A ten-second polling lease provides a callback backstop while limiting repeated lookups. Disabling new Bitika checkout still permits existing receipts to reconcile if their live credentials/signing secret remain configured.

## Remaining commissioning

1. Complete the five-minute native router pass and unpaid isolation checks. The legacy gateway agent still needs router ownership, trusted client context and durable local expiry; adding `routerId` to a job does not fix an agent that ignores it. [Current access plan](mesh-internet-commissioning-next.md).
2. The supplied signing secret is deployed at `https://wifi.afribit.africa/api/webhooks/bitika`. Public operator-signed sandbox probes return 200 and tampered-body probes return 401; actual Bitika callback delivery remains unverified. The published webhook-management endpoints require a developer session JWT; the supplied payment API key cannot register a webhook. No account webhook is registered by the assistant. [Webhook management reference](https://bitika.xyz/developers/docs).
3. Resolve the live collection rejection or provision the operator's proposed Paystack alternative. Its M-Pesa collection route needs an additional settlement integration to retain Bitcoin receipts; preserve independent provider adapters. Verify collection, settlement, intended-router access and expiry before setting `BITIKA_ENABLED=true` or the local captive's `billingReady=true`. The current failed purchase does not authorize a pass.

Changing test mode to live with a test key fails closed. The adapter, API, callback and settlement statement each separate sandbox transactions from real sales/access. Keep BTCPay available as an independent customer choice. This implementation does not migrate the operating paid pilot.
