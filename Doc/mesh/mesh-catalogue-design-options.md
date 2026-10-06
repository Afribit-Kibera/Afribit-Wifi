# Mesh catalogue: three directions

6 October 2026. Original design studies, not deployed checkout screens.

**Selected: 02, Pocket tickets.** The real catalogue now implements the ticket
layout for all existing packages, with a selected-pass summary and fixed orange
Continue dock. The free Mesh entry is prominent. Prices and backend payment,
binding and voucher behavior are unchanged. Implementation screenshots are in
`artifacts/mesh-catalogue-design/implemented/`. The studies below remain previews.
Production publication is recorded in the release note after verification.

Compare [all three layouts](../../artifacts/mesh-catalogue-design/three-concepts.png)
or open the [interactive gallery](../../artifacts/mesh-catalogue-design/index.html).
Buttons in these proofs cannot initiate payments, issue access or change prices.

| Direction | Preview | What it changes |
| --- | --- | --- |
| 01 — Photo tiles | [Image](../../artifacts/mesh-catalogue-design/concept-1.png) | Community photograph above tactile cream package cards. Best fit for the image-led welcome page. |
| 02 — Pocket tickets | [Image](../../artifacts/mesh-catalogue-design/concept-2.png) | Compact tickets with price and duration side by side. Connects the digital catalogue to physical scratch cards. |
| 03 — Quiet checkout | [Image](../../artifacts/mesh-catalogue-design/concept-3.png) | A short photograph strip, simple duration rows and clear purchase summary. Most economical use of screen space. |

Recommendation: **02, Pocket tickets**, using the small community photo strip
from 03. Price, duration and selection remain easy to scan; the same ticket
language can carry through to physical vouchers. 01 gives the photograph more
presence if the preference is a richer editorial page.

All preserve the existing Mesh mark, Geist font, warm light surfaces and Bitcoin
orange. The studies use current KES 10 / 20 / 30 examples; the full catalogue
still needs all nine existing packages, exact duration labels and selected
price kept in sync with checkout. The sample longer-pass tabs/links are layout
illustrations, not a functioning production catalogue. The photograph is the
existing captive artwork, not a new image or a newly commissioned documentary photo.

The source generator is `scripts/mesh/create-catalogue-designs.mjs`. Assets and
proofs are local under the globally ignored `artifacts/` directory; keep copies
when moving machines or preparing a design review. The chosen layout can be
implemented after review without changing package prices or payment behavior.

## Reference study

These are original Mesh compositions. References informed the clear separation
of price, duration and purchase action, not a copied interface:

- [Airalo](https://www.airalo.com/united-states-esim): explicit package comparison.
- [Nomad](https://www.nomadesim.com/united-states-eSIM): compact plan selection.
- [Wise](https://wise.com/gb/pricing/): restrained money-focused hierarchy.

## Captive and learning links deployed now

The router-hosted welcome page replaces the top-right location label with a
learning link. It now includes a plain-language “What is Mesh?” section,
Bitcoin Kenya / Afribit / Insats entries, and the downloaded Bitcoin mark
served from the router. Geist and the Mesh mark are retained. Five uploaded
assets were read back byte-for-byte, with prior files kept privately.

Unpaid HTTPS reachability for the three domains and their `www` variants is
configured on Primary only, TCP 443, guest IPv4 subnet only. Other subdomains,
external videos, analytics and third-party links are not automatically included.
Physical unpaid-client acceptance remains pending.

This RouterOS mechanism permits destination addresses. On shared hosting it
cannot prove that another hostname on the same IP is inaccessible. Production
domain isolation needs dedicated origins or a separately commissioned policy
gateway; do not call this an abuse-proof per-domain boundary. Signal/checkout
allowances and normal paid-access expiry remain separate. No new paid pass or
payment was issued for this change.

The learning pages require WAN. The router's welcome/return page and downloaded
logo do not. Disconnecting WAN can change a phone's OS popup behavior; automatic
popup recovery during outages remains a physical test, rather than a claim
made from file upload alone.
