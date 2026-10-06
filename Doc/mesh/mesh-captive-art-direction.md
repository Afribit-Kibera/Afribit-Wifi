# Mesh captive photography and typography

5 October 2026. Current brief: the original woven Mesh mark, a bold standalone wordmark without a dot or logo byline, the earlier Geist typography, real high-resolution photography, and a light Afribit-orange captive focused on welcome and internet purchase. Bitcoin and Afribit remain in the introduction and supporting copy.

## Brand and type

The wordmark uses **Geist, weight 750, 39 px and −0.075 em tracking**, matching the earlier portal header. The woven SVG geometry is preserved, and the mark/wordmark retain the original deep green `#203c32`. The page uses Afribit orange `#f7931a`, warm ivory `#fffaf2`, ink `#29251f` and burnt orange `#884009`. Headings return to Geist; body text and controls share that family.

The Latin variable WOFF2 is copied from the existing Next.js build, where the font was already used through `next/font`. It is now bundled as `mikrotik/hotspot-mesh/geist-latin.woff2` (29,288 bytes) for the static router page, with its [SIL Open Font License](https://github.com/vercel/geist-font/blob/main/OFL.txt) in `geist-OFL.txt`. `font-display: swap` and an Arial fallback keep the page readable if the font is unavailable. No external font request is needed.

The logo byline and period are also removed from the shared web brand component and full portal header/footer. The existing web portal layout, interactions and font setup are retained. These are source changes; no public cloud deployment is implied.

## Real photograph

The selected source is a photograph published on [Afribit's website](https://www.afribit.africa/), showing customers and vendors at a Kibera vegetable stall with a Bitcoin acceptance sign. Source file: [Mama mboga groceries accepting bitcoin.jpg](https://www.afribit.africa/Images/Mama%20mboga%20groceries%20accepting%20bitcoin.jpg). Its actual decoded dimensions are **5184 × 3456**. It is a real source photograph, not generated artwork or an enlarged low-resolution preview. Attribution/provenance is to that published source; no additional ownership claim is made.

Local derivatives preserve the photograph's aspect ratio and are resized downward, encoded with Sharp and stripped of embedded metadata:

| Router asset | Pixels | Bytes |
| --- | --- | --- |
| `mesh-kibera-market-960.jpg` | 960 × 640 | 131,666 |
| `mesh-kibera-market-1440.jpg` | 1440 × 960 | 262,011 |
| `mesh-kibera-market-3840.jpg` | 3840 × 2560 | 1,825,328 |

The largest asset is **4K in width**, retaining the original 3:2 photograph. The welcome uses responsive `srcset`/`sizes`; the 390 px, 3× density phone fixture selects the 1440 px asset, while a standard-density phone selects the 960 px asset. The photograph is now the background of the welcome hero, using an absolutely positioned responsive image with `object-fit: cover` and a dark overlay. The crop changes with the viewport; the full photograph remains in each JPEG. Text and branding remain HTML rather than being burned into the picture. All files are served locally by the router.

## Hero and internet priority

The user's latest direction replaces the standalone photograph with a background hero and makes internet purchase the main visitor action. The woven green logo and strong Geist wordmark remain on the warm-white header, without a byline or dot. The photograph grounds the hero in the neighbourhood, with “Welcome to Mesh” and the Bitcoin identity set directly over it. A warm-white internet panel overlaps the hero edge, keeping “Get online” and the orange pass action prominent without another introduction or app catalogue in between.

The pass action fits fully inside the first viewport at **320 × 568** and **390 × 844**, in both disabled and commissioned checkout fixtures. Voucher entry remains the quieter secondary action. No packages, prices or active checkout are invented: real purchase stays disabled until `billingReady` is true and the router ID is valid. The disabled button retains the orange palette in a quieter shade, accompanied by the visible “Internet passes are coming soon” explanation.

The overlay reaches 70% opacity by 22% of the hero height, before the small Bitcoin line in the checked mobile layouts, and darkens towards the lower copy. Background failure leaves a dark fallback behind the white text. Forced-colour mode removes the photograph and overlay and uses the system canvas/text colours. No extra image, font or library is fetched from the internet.

## Review

The revised mobile render keeps the original wordmark above a photograph-backed welcome hero, followed immediately by the overlapping internet-pass panel. Bitcoin and Afribit remain visible in the hero and supporting copy. Purchases and vouchers remain gated with a clear “coming soon” explanation until this access router's billing is commissioned. The status/error pages use the same local Geist font and light-orange palette.

Browser checks pass at 320, 390, 430 and 580 px widths, with controls at least 44 px tall, zero script errors, local font/photo loading, responsive retina selection, safe missing image/config behavior, JavaScript-disabled readability and preserved internet/voucher handoffs. They also assert that the pass button fits above the fold on the two phone sizes above. Text contrast: ink on orange **6.63:1**, muted on ivory **5.96:1**, accent on ivory **7.26:1**. Screenshots and fixture evidence are under ignored `artifacts/mesh-lab/mesh-captive-review/`, including `mesh-local-welcome-mobile.png`, `mesh-welcome-checkout-preview.png` and the 320 × 568 `mesh-welcome-checkout-small-phone.png`. This focused review does not replace a real phone popup check; phone browser chrome, dynamic text sizes and keyboard display can reduce the usable height.

Global direction references explored were [Headspace](https://www.headspace.com/) and [Monzo](https://monzo.com/). The final type and brand follow the operator's existing Mesh design; the photograph comes from Afribit's own published site.
