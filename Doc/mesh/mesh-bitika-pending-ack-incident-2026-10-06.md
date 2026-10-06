# Bitika payment recovery and customer completion

6 October 2026, 22:10 EAT. Home lab only; the serving 3WEST router was not changed.

## Paid purchase and recovery

The operator approved a KES 10 M-Pesa prompt at approximately 21:39 EAT. Bitika's
live collection response was HTTP 201 with `status: "PENDING"` and a valid
`qadi_` transaction code. The adapter expected the documented `processing`
status and rejected the acknowledgement. The prompt and payment had succeeded,
but Mesh showed an unexpected-reference error and had not retained the code.

Recovery verified the original request fingerprint, payer, stored recipient and
payment UUID before retrieving the original response with the same Bitika
Idempotency-Key and exact payload. A server-side transaction lookup confirmed
KES 10, fulfilled delivery, **86 sats**, the stored destination
**spira@blink.sv**, and a valid payment hash. One original access order was queued.
No second purchase, prompt or Engine Bitcoin transfer was initiated.

The iPhone was initially absent from the router's guest hosts. After the
operator reconnected with the same address, the router acknowledged the order
as active on `10.30.0.197` at approximately 22:01 EAT. The immutable pass deadline
remains **23:11:21 EAT**; recovery did not mint another allowance. The first
browsing retry failed; the follow-up Safari/HTTP check was reported working by
the operator. Router diagnostics showed an authorized session, live address-list
membership, a working WAN route and successful upstream DNS. No extra allowance
or firewall bypass was added for that retry. An active router order and a working
browsing retry do not by themselves establish captive-window dismissal.

Private receipt, fingerprint checks, reconciliation and access evidence are in
`artifacts/mesh-lab/private/bitika-paid-incident/`. Credentials, phone numbers,
payment hashes and private payloads are excluded from public documentation.

## Published behavior

- Normalize the observed `PENDING` acknowledgement to pending processing.
  It is not proof of payment, Bitcoin delivery or active internet.
- Show one **M-Pesa** method. Bitika is preferred; Paystack can serve a new
  purchase when Bitika is unavailable. An uncertain initiated purchase cannot
  silently start another collection with a different provider.
- Save the exact original request encrypted before collection. An interrupted
  acknowledgement returns the buyer to the same owned payment page. Background
  recovery uses a durable 30-second lease and the same UUID/payload; it never
  creates a fresh purchase. Older records without this retained encrypted
  request require manual reconciliation.
- Explain the phone prompt and PIN, then confirmation, then internet activation.
  Keep checking while activation is delayed. Never equate an unpaid device
  reservation or a payment receipt with active router access.
- Show **You're online** only after router acknowledgment and a live deadline.
  Keep the receipt visible in normal browsers. Identified captive windows request
  the OS connectivity probe after a five-second confirmation, with a cancel
  option; **Start browsing** provides a manual handoff. The OS owns dismissal.
- Replace **Check my connection** with **View internet pass**. This shows native
  pass status and time remaining; it is not a speed test or WAN-health probe.
  An unauthenticated status page says **No active pass**.
- Explain **Why Bitcoin?** through open money, direct payments and free learning.
  Provider names and business settlement details are absent from customer copy.

Apple documents that its captive window and association behavior are controlled
by the phone, including the different effects of Cancel and Without Internet:
[Apple captive Wi-Fi guidance](https://support.apple.com/en-us/102554).
Bitika's idempotency contract and transaction lookup are described in its
[developer documentation](https://bitika.xyz/developers/docs). The observed
`PENDING` response above is retained live evidence, not an inferred delivery.

## Release and verification

- Vercel production: `dpl_HpKEQZzM11mApzUTr9NYWvjeuEJF`, aliased to
  `https://wifi.afribit.africa`. It retains the preceding nonce/security release.
- Primary router: 11 static assets verified by byte readback. Backup:
  `artifacts/mesh-lab/private/persistent-portal/20261006T190207Z`.
  Firewall, DHCP and enrolled site configuration were preserved.
- 51 payment/recovery/customer-state tests, 38 automatic-access tests and 10
  production guards passed. Typecheck, lint and production build passed.
- Mobile fixtures cover 320/390-pixel payment progress, active/expired access,
  interrupted same-reference responses, failed activation recovery and captive
  versus ordinary-browser handoff. Router fixtures cover 320/390/430/580 pixels,
  including unauthenticated and active status pages.
- Read-only live readiness after deployment confirms Bitika preferred, fresh
  controller heartbeat, no unresolved initiated collections and no outstanding
  queued/claimed/failed orders. No new payment was requested by release checks.
- Live signed readiness: first request 200, identical replay 403, fresh nonce
  200 and legacy nonce-less request 403. Unsigned webhook 401 and oversized
  webhook/passkey requests 413. The previous security controls remain enforced.

## Remaining acceptance

Browsing on the recovered phone is reported working. Confirm the new
success/handoff on the next deliberately approved purchase. Check another unpaid device remains
restricted and re-entry works after expiry. Keep the existing field gates for
device binding, management separation, shared-host allowances, monitoring,
backups, capacity and migration. This recovery is not approval to replace
3WEST's paying-customer service.
