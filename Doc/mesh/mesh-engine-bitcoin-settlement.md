# Mesh: verified M-Pesa collection to Bitcoin settlement

## Current catalogue policy, 5 October 2026

The owner authorizes automatic settlement for the existing catalogue, replacing
the consumed KES 10 pilot ceiling. The deployed Engine now accepts up to
**KES 450 per purchase**, with **no cumulative KES pilot cap**
(`MESH_MAX_TOTAL_KES=0`). The independent ceilings remain 100,000 sats per payout
and 2 sats routing fee. The receiving address remains `spira@blink.sv`.

Before creating an M-Pesa request, Mesh checks a recent enrolled gateway
heartbeat and the Engine's signed read-only readiness result for that catalogue
amount. The Engine checks live pricing, available funded treasury, distinct
source/recipient and settlement permissions. At commissioning, KES 450 quoted
**3,946 sats** after configured fees; this is a time-specific quote, not a fixed
exchange rate. The settlement amount is fixed when verified collection is
processed, and the resulting receipt supplies the actual credited sats.

Verified collections are reconciled by the callback, customer polling and the
gateway's background polling. A durable send reservation and stored invoice
retain the existing protection against duplicate sends and ambiguous outcomes.
Only a verified Bitcoin receipt can issue the native access order.

Bitcoin is paid from the prefunded Blink treasury. This does not automatically
exchange the Paystack bank balance into Bitcoin or replenish that treasury;
KES reconciliation and treasury rebalancing remain separate operations.
No new collection or Bitcoin transfer was made while deploying this update.

The focused Engine suite passes 14 tests in a disposable PostgreSQL database.
Only Engine was restarted; all five application services remained active.
Rollback backup: `/srv/insats/releases/mesh-automatic-checkout-20261005173331`.
The earlier one-purchase evidence and limits below are historical.

5 October 2026, Africa/Nairobi. The operator now authorizes using the conversion
engine to send Bitcoin after verified M-Pesa collection, superseding the earlier
collection-only checkpoint.

## Live result

The previously approved **KES 10** purchase,
`mesh-e92ab0c0-fd6b-43d4-bfcb-57744876bacc`, is settled as **85 sats** to
**spira@blink.sv** at **18:11:51 EAT**. No new M-Pesa collection is initiated.

The Engine verifies the original Paystack transaction, locks its live BTC/KES
pricing, pays the receiving wallet from the existing funded Blink treasury and
records a Bitcoin receipt. A separate query using the operator-supplied receiving
Blink API independently verifies the exact **85-sat incoming credit** at
18:12:42 EAT. The source and receiving BTC wallets are distinct.

- Payment hash: `6f49526a2d312f3e9123701e97018b3a459f631417035910dbbd8c73153c4481`.
- Source transaction: `6ac3be360ae68aa97c71cf39`.
- Receiving transaction: `6ac3be360ae68aa97c71cf3a`.
- Original fiat receipt is preserved unchanged; a separate settlement receipt
  links the same payment UUID to both legs.
- Internet is not granted by this settlement-only commissioning tool.

Evidence: ignored `artifacts/mesh-lab/paystack-reference/bitcoin-settlement-verification.json`.
The original collection history is in [mesh-paystack-collection.md](mesh-paystack-collection.md).

## Implementation

The Engine owns treasury credentials, live pricing and sends. Mesh uses a newly
generated **scoped service key**, not the Engine's administrative key. HMAC binds
the timestamp, HTTP method, path and exact request body, with a 60-second window.
Requests use only `https://engine.insats.org`; the receiving address is fixed in
server configuration and cannot be supplied by a customer.

Engine endpoints under `/rails/mesh` provide readiness, idempotent registration,
settlement reconciliation and receipt retrieval. Migration
`0025_mesh_settlements` adds a private independent receipt table. Existing POS
merchant records, pilot allowlist, conversion attempts and price observations
are retained.

Authenticated Paystack verification requires the exact live reference, KES
subunits, mobile-money channel, `mesh` tag/source and matching payment UUID.
Successful collection is the entry requirement. The shared provider callback
remains `https://engine.insats.org/webhooks/paystack/charge`. Its Mesh path also
registers and reconciles a verified charge if collection finishes before the
browser polls; the tag alone cannot authorize a payout.

One recipient invoice is saved before sending. A durable `send_started`
reservation commits before the external send. Duplicate/concurrent callbacks,
polls and process recovery inspect that same invoice; they do not issue another
send or generate a new payout invoice after an ambiguous outcome. A paid receipt
must include a matching payment hash, verified preimage, successful source BTC
debit and expected amount/fee. Unknown outcomes remain review-required.

The rate is fixed once at verified collection processing. This recovered purchase
was collected earlier, so its sats are priced when this settlement is processed,
not retrospectively represented as an earlier checkout quote. Pricing reuses the
Engine's existing live-rate, spread, Paystack-fee and Lightning-fee calculation.
The treasury supplies Bitcoin liquidity; Paystack's KES settlement remains a
separate treasury-reconciliation obligation.

Current pilot limits: **KES 10 per purchase, KES 10 total reserved budget,
1,000 sats maximum payout, 2 sats maximum routing fee**. The approved purchase
consumes the pilot budget. Public customer checkout remains disabled until
internet activation and expiry pass.

## Verification and deployment

- Disposable PostgreSQL migration through 0025 and final engine suite:
  **57 passed, 1 skipped**, two existing dependency deprecation warnings.
  Includes concurrent send reservation, recovery after an ambiguous send,
  callback before browser polling, duplicate delivery and mismatched collections.
- Mesh payment suite: **29 passed**. TypeScript, targeted lint and production build
  pass. Confirmed Engine receipts are recorded without inventing an active pass.
- Production Engine source/dependencies are hash matched before the targeted
  change. A private PostgreSQL/source backup is retained at
  `/srv/insats/releases/mesh-settlement-20261005`; the callback revision has its
  separate source backup at `/srv/insats/releases/mesh-settlement-callback-20261005`.
- Only Engine is restarted. Engine, logger, Index, Intelligence and Caddy remain
  active after installation. Migration reads `0025_mesh_settlements (head)`.
- `MESH_SERVICE_KEY` is in private `/etc/insats/mesh.env` and ignored local
  `.env.mesh-engine`. A service drop-in adds it without replacing the existing
  Engine environment or funded treasury key. Credentials are absent from source.

Mesh integration release **`dpl_5zVrb7TfQPVAtzhguLjKFuCStxp8`** is verified as a
candidate and promoted to `https://wifi.afribit.africa`. Scoped Engine settings
are server-only; customer `PAYSTACK_ENABLED=false` remains. Candidate and public
health/database 200, disabled customer checkout 503, synthetic configuration-event
200 and tampered-body 401 checks pass. These synthetic checks are distinct from
the actual paid Bitcoin receipt; an actual new provider-generated checkout
callback/access flow has not yet been commissioned. Previous ready release:
`dpl_EhTsgeXqj1dw9n21w4aTb9U3YcJP`.

Read the retained settlement without a new charge or payout:

```powershell
npm run paystack:settle -- status artifacts/mesh-lab/private/paystack-live/operator-approved-retry-01/purchase.json
```

Next: identify the operator phone's live IPv4/MAC, commission one router-local
five-minute pass, and verify activation and expiry. Only then bind this receipt
path to paid allowance creation and expose customer M-Pesa checkout. No repeated
board/media tests are needed.

**Access test prepared:** Primary observes the phone at **10.30.0.197**. A fresh
export/encrypted backup precedes one MAC/server-bound `mesh-e92ab0c0` user with
five-minute cumulative allowance under the installed 2M/2M profile. The user is
created without authentication or counter resets; its generated credentials are
in ignored `artifacts/mesh-lab/private/mesh-five-minute-pass.txt`. Phone login,
public browsing and local expiry remain pending. This manual commissioning does
not claim automatic paid access. [Bound pass procedure](mesh-native-pass-test.md).
