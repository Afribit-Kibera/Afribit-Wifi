# Mesh Paystack collection and Blink receiving wallet

**Superseded checkpoint:** the operator subsequently requests Engine Bitcoin
settlement. The approved KES 10 purchase settles as **85 sats to spira@blink.sv**
at **18:11:51 EAT on 5 October**, independently verified in the receiving wallet.
No new M-Pesa charge occurs. The collection-only history below is retained.
See [the current settlement result and implementation](mesh-engine-bitcoin-settlement.md).

5 October 2026, Africa/Nairobi. The operator supplies production Paystack and Blink credentials and explicitly chooses **collection first, Bitcoin settlement pending**. Secrets, payer phone and receipt email are stored only in ignored `.env.paystack.live` / `.env.blink.live`. General customer checkout stays disabled.

## Actual live result

**Collection passes.** After the operator confirms readiness, a separate KES 10 attempt starts at **16:22:14 EAT**, reference `mesh-e92ab0c0-fd6b-43d4-bfcb-57744876bacc`. The operator approves its native M-Pesa prompt. At **16:23:50 EAT**, authenticated lookup returns `success`; the exact reference, live domain, KES 1,000 subunits, mobile-money channel and Mesh metadata match. `collectionConfirmed=true`; **Bitcoin settlement remains pending**, with no wallet send or router grant. Its independent receipt is retained under `artifacts/mesh-lab/private/paystack-live/operator-approved-retry-01/`. The failed first attempt remains intact below.

At **16:13:36 EAT**, the first KES 10 charge is initiated with reference `mesh-f10f5d78-5dd5-43be-9d78-93c39f4762cd`. Paystack accepts it and authenticated verification reports `ongoing`. The operator confirms the native M-Pesa prompt appears, but does not approve it. At **16:18:42 EAT**, authenticated verification reports `failed`, with `collectionConfirmed=false`. No automatic repeat charge is sent. This first attempt does not establish collection completion; the explicitly requested second attempt above does.

The original receipt is retained at ignored `artifacts/mesh-lab/private/paystack-live/purchase.json`. The tool performs no Mesh/Engine database writes, wallet send, router job or access grant. Bitcoin settlement remains pending as selected by the operator. The first attempt's failure result is consistent with an unapproved prompt but does not independently establish its detailed failure reason.

## Implemented boundary

`lib/payments/paystack.ts` is an independent provider adapter. A charge uses `POST https://api.paystack.co/charge`, KES subunits (**KES 10 = 1,000**), `mobile_money.provider="mpesa"`, international-format phone and a unique `mesh-<UUID>` reference. Metadata includes `tag="mesh"`, `tags=["mesh"]`, `source="mesh"` and the Mesh payment UUID. Authentication and collection remain server-side; there is no automatic fallback from an unresolved Bitika attempt.

Authenticated transaction verification binds the exact reference, live/test mode, KES amount, mobile-money channel and Mesh metadata. A successful KES collection remains `processing`, with Bitcoin settlement pending; it cannot become a Bitcoin receipt or mint a pass. Customer readiness explicitly stays false until a trusted settlement bridge is commissioned. BTCPay remains independent. [Paystack Charge API](https://paystack.com/docs/api/charge/), [M-Pesa channel](https://paystack.com/docs/payments/payment-channels/#m-pesa).

The optional Mesh handler `/api/webhooks/paystack` verifies raw-body HMAC-SHA512 and then looks up the actual provider transaction. It only updates collection metadata. Publishing this handler does not reconfigure the Paystack account or create forwarding from the existing shared callback. [Webhook signature documentation](https://paystack.com/docs/payments/webhooks/).

## Existing Insats callback

The supplied account callback remains **`https://engine.insats.org/webhooks/paystack/charge`**. Its public GET returns 405. The local source at `G:\My Drive\workspaces\insats\insats-engine\app\routers\webhooks.py` checks the signature and finds a pre-registered `ConversionAttempt` by fiat reference. Unmatched references return `no_matching_attempt`; metadata tags do not create a conversion attempt or a forwarding route. This is a source inspection, not a fresh on-server code comparison.

The existing conversion path pays a merchant from a funded Blink house wallet. It does not automatically turn Paystack's KES balance into Bitcoin. No Engine code, callback configuration, pilot allowlist, production data or treasury balance is changed for this collection test.

## Blink

An authenticated read-only query confirms the supplied wallet belongs to the account and is a **BTC** wallet. No balance or transaction history is printed. `lib/payments/blink.ts` implements receiving-wallet verification, receiving invoice creation and matching invoice-status lookup. It has no outgoing payment or KES-conversion operation. Invoice operations are tested with mocks; no actual invoice or Bitcoin transfer is created during this checkpoint. [Blink authentication](https://dev.blink.sv/api/auth), [BTC receive API](https://dev.blink.sv/api/btc-ln-receive).

## Operator commands

Read the approved purchase without sending another prompt:

```powershell
npx tsx --env-file=.env.paystack.live artifacts/mesh-lab/private/paystack-retry-status.ts
```

The standard command below reads the original failed purchase retained at the default receipt path:

```powershell
npm run paystack:live -- status
```

The commissioning tool retains the purchase before POST, holds a file lock and performs only lookup on subsequent calls, including after ambiguous responses. Changing payer/email/account against that receipt is rejected. Preserve it after a provider failure. A fresh attempt requires an explicit operator readiness decision and a separate receipt; never delete the old one to obtain a new reference.

Completed checks: **24** isolated payment/commissioning tests, including duplicate signed fiat callbacks without grants, amount/tag/mode matching and no POST retry after an ambiguous outcome. TypeScript, production build and 320/390 px mobile checkout fixtures pass. These automated checks are separate from the real provider success above.

Next acceptance: define the funded Bitcoin settlement service and reconcile fiat and Bitcoin receipts before commissioning paid router access. No board, media or mesh-failover demonstration needs repeating.

## Production release

Release **`dpl_EhTsgeXqj1dw9n21w4aTb9U3YcJP`** is built as a candidate, verified with owner CLI and promoted to **`https://wifi.afribit.africa`** on 5 October. Server-only Paystack/Blink credentials are configured; the operator's test phone and email remain local. Both `PAYSTACK_ENABLED` and `BLINK_SETTLEMENT_ENABLED` are false. The readiness check also refuses customer checkout until the Bitcoin settlement bridge is implemented, so a toggle alone cannot promise a paid pass.

Candidate and public checks pass: health/database 200, customer Paystack initiation 503, operator-signed configuration-only event 200 and tampered raw body 401. Synthetic events create no sale/grant and do not prove Paystack-to-Engine-to-Mesh callback delivery. The source/private-value scan reports no credential, payer-phone or receipt-email leaks across 213 tracked/unignored files. Environment and operational artifacts are excluded from deployment.

Evidence is in ignored `artifacts/mesh-lab/paystack-reference/`. The approved receipt remains independent of the web release. The immediate previous ready release is `dpl_HTr3iE13v4UZ8PnXHAxe2DGjscJs`; rollback, if health or existing checkout regresses:

```powershell
vercel promote https://bitcoin-valley-wifi-pysj125t1-novyrix-teams.vercel.app --yes --scope novyrix-teams
```
