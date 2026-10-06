# Mesh: first live Bitika purchase

**Historical commissioning record.** For the current provider selection,
receiving address and current checkout status, use
[Bitika-first checkout](mesh-bitika-primary.md) and
[the current roadmap](mesh-status-and-roadmap-2026-10-06.md). The older disabled
provider and deployment IDs below do not describe the current feature release.

5 October 2026, Africa/Nairobi. The operator explicitly authorizes production Bitika testing, supplies a live key and retains **spira@blink.sv** as Afribit's receiving address. This record covers the first attempted real M-Pesa collection and Bitcoin settlement.

The key, supplied payer number and callback signing secret are saved in ignored `.env.bitika.live`; credentials and signing secret are configured server-side in Vercel production. Provider code is **deployed on `wifi.afribit.africa` in live mode**, with new M-Pesa checkout disabled. The first KES 10 collection request and one exact replay both receive **HTTP 400**, without a transaction code. The operator reports **no M-Pesa prompt** and no dashboard error. Bitcoin delivery and paid access remain unverified. The commissioning tool does not insert application payments, grants or jobs.

## Live collection result

The first request is sent on **5 October 2026 at 15:35:10 EAT**, using reference `27de42cd-c474-4164-8551-4966c11f247f`. Both requests use the same UUID, idempotency key and payload, rather than creating a second purchase. Bitika returns `{"code":400,"message":"An unexpected error occurred. Please try again."}`. Authenticated payer lookup returns HTTP 200 but no record for this attempt. No provider-generated callback or verified Bitcoin delivery is observed, and no router access is granted.

The complete current [Bitika API reference](https://bitika.xyz/developers/docs) is read against the actual request. `POST /api/v1/xwift/collect`, live-key authentication, UUID `Idempotency-Key`, string amount `"10"`, normalized Kenyan phone and `lightningAddress: "spira@blink.sv"` match the documented contract. KES 10 is the documented minimum; partner API-key requests are exempt from OTP. No additional required field or documented correction is identified. The generic HTTP 400 does not establish the underlying cause. Blink LNURL discovery succeeds, which verifies address discovery rather than delivery.

**Do not send another collection request while this rejection is unresolved.** Preserve ignored `artifacts/mesh-lab/private/bitika-live/purchase.json`. Sanitized evidence is in `artifacts/mesh-lab/bitika-reference/live-deployment/collection-rejection-verification.json`; private diagnostic responses remain outside tracked documentation. The operator proposes provisioning Paystack if Bitika fails, so the next provider choice can proceed without changing the mesh or depending on Bitika.

Paystack documents M-Pesa collection for Kenyan businesses and payouts to a designated bank account. Keeping Afribit's Bitcoin receipt requirement therefore needs a separate settlement integration when using that collection route; it is not equivalent to Bitika's collection-and-Lightning flow. [M-Pesa channel](https://paystack.com/docs/payments/payment-channels/#m-pesa), [payout destination](https://support.paystack.com/en/articles/2125314).

## Completed live preparation

- The production adapter obtains a KES 10 quote on 5 October at 15:06 EAT: **86 sats**, with the API reporting a **3% fee**. This is a momentary quote, not a guaranteed payout or proof of collection permission. Ignored evidence: `artifacts/mesh-lab/private/bitika-live/preflight.json`.
- Blink's HTTPS LNURL discovery resolves `spira@blink.sv` as a payment address with callback host `lnurl.blink.sv`. No invoice or payment is requested by that lookup.
- `wifi.afribit.africa/api/health` responds successfully with a connected database. The public domain now serves the new Mesh portal and Bitika handler.
- The initial Vercel login could access only the **Afribit** team's other projects. The operator logs into the owner account; access to **Novyrix Team / bitcoin-valley-wifi** is verified. Production secrets are added on that existing project. No replacement project is created.
- Local and Vercel production builds succeed. Sixteen isolated payment/commissioning tests pass, including ambiguous acceptance, fixed-reference retries, collected-but-undelivered handling and neutral generic-400 copy without automatic retry. TypeScript and targeted lint pass. These checks do not prove a real collection, actual callback or internet grant.

## Production deployment and rollback

**Later shared release:** optional Paystack/Blink receiving code is published as `dpl_EhTsgeXqj1dw9n21w4aTb9U3YcJP`. A separately authorized KES 10 Paystack collection succeeds; Bitcoin settlement remains pending. Bitika stays disabled and its failed request is not retried. The Bitika-specific releases below are historical. [Current production release and rollback](mesh-paystack-collection.md).

Release `dpl_FP2C6FbdxoJovvb9Trpfnv2ay48c` is initially built with `--prod --skip-domain`. Owner CLI checks confirm health/catalogue success, admin 401, invalid-signature callback 401 and disabled M-Pesa initiation 503 before the domain switch. It is then promoted to `https://wifi.afribit.africa`; public health, welcome, admin and callback checks pass again. Browser checks on the public domain pass at 320/390/768/1440 px, including catalogue selection, dialogs, keyboard navigation, context preservation and gated missing-device checkout. All browser mutation requests are intercepted; no invoice, voucher, payment or grant is created.

The current release is **`dpl_HTr3iE13v4UZ8PnXHAxe2DGjscJs`**, promoted after owner CLI checks. It includes the supplied signing secret, safe signature-verification logging and neutral error copy for generic HTTP 400 responses. Public health succeeds, an operator-signed sandbox configuration probe returns 200, and a tampered raw body returns 401. These synthetic probes verify configuration, not actual Bitika callback delivery or settlement. No sale or grant is created by them.

The live key, destination, live mode and signing secret are configured server-side; **`BITIKA_ENABLED=false`**. `.vercelignore` excludes environment files and operational folders. Uploaded source contents are checked for credential leaks, with none found. Current evidence is `rejection-copy-owner-verification.json` and `rejection-copy-public-verification.json` in ignored `artifacts/mesh-lab/bitika-reference/live-deployment/`; earlier browser evidence is `artifacts/mesh-design/verification.json`.

The previous ready release, with signing secret active, remains available at `https://bitcoin-valley-wifi-gcslk9eee-novyrix-teams.vercel.app` (`dpl_8w1Nt9d32TSZonmqetxvUyiLkCd5`). If public health or existing checkout regresses, restore it with:

```powershell
vercel promote https://bitcoin-valley-wifi-gcslk9eee-novyrix-teams.vercel.app --yes --scope novyrix-teams
```

A domain rollback preserves financial receipts and does not refund or erase a live purchase. No rollback is needed after the passing checks.

## Collection procedure after the provider issue is resolved

The supplied real payer number is already in `BITIKA_TEST_PHONE` inside `.env.bitika.live`. The name identifies the live commissioning payer; **it does not select sandbox mode**. `BITIKA_MODE=live` and a `bk_live_` key are required. Collection is fixed at **KES 10**, the provider's published minimum. The commands below document the tool; they are not instructions to repeat the failed request now. [Bitika API reference](https://bitika.xyz/developers/docs).

```powershell
npm run bitika:live -- preflight
npm run bitika:live -- collect
npm run bitika:live -- status
```

`preflight` only obtains a quote. `collect` sends a real M-Pesa collection request to the supplied payer, who approves in the native M-Pesa prompt. Never enter a PIN in Mesh or a terminal. `status` performs only authenticated transaction lookup and requires a retained transaction code; the rejected attempt has none.

The tool writes a UUID and payer/destination binding **before** sending collection. An ambiguous timeout retains that UUID; a retry uses the same Idempotency-Key. Once a transaction code is known, even `collect` only reads its status. A second process cannot use the receipt while its lock is held. Preserve `artifacts/mesh-lab/private/bitika-live/purchase.json`; deleting it would discard the protection against initiating another purchase. A crash may leave `purchase.lock`: verify the recorded process is no longer running before removing that lock, and preserve the receipt.

Only `fulfilled` with matching KES amount/destination, delivered sats and a valid payment hash is recorded as verified Bitcoin delivery. A declined request cannot authorize access. `payment_failed` means M-Pesa was collected but Bitcoin delivery remains unresolved: do not charge again. The receipt tool does not grant router access automatically or claim that a purchase proves the captive flow.

## Captive and router acceptance

For this first purchase, connect the intended device to **Mesh**, verify its current HotSpot host/MAC and bind its native five-minute user to the verified live receipt. Start access only after Bitcoin delivery is verified. The installed `KM-MESH-TRIAL-5M` profile and scoped rules provide the prepared lab enforcement path; cumulative allowance still requires `limit-uptime=5m` on that user. Check the public page, unpaid second phone and local expiry. [Native enforcement procedure](mesh-native-pass-test.md).

The code, live credentials and supplied webhook signing secret are published. The public callback URL is `https://wifi.afribit.africa/api/webhooks/bitika`. Actual provider callback delivery, successful collection/Bitcoin settlement and trusted router grant/expiry remain uncommissioned. The supplied payment API key cannot manage webhook registration; the documented management endpoints use a developer session JWT. The assistant does not create dashboard registrations.

The legacy gateway agent ignores job router targets and does not enforce `expiresAt` locally. Do not start it against the operating pilot's shared queue for this purchase. General customer M-Pesa checkout remains hidden until it can deliver the purchased allowance on the intended router. A manual live collection followed by bound native access is narrower than acceptance of the automated public flow. [Provider implementation](mesh-bitika-provider.md), [remaining gateway work](mesh-internet-commissioning-next.md).
