# Mesh physical scratch vouchers

## Wildlife edition - selected direction

The revised edition uses **photo-inspired fronts and a clearly visible silver scratch panel on the reverse**. The customer sees **Daily, Weekly or Monthly**; animals are visual themes, not invented package names. Daily features a cheetah, Weekly a lioness, and Monthly the requested tiger. The tiger theme is not presented as an African species.

![Wildlife voucher fronts and coated reverse proofs](../../artifacts/mesh-voucher-design/wildlife/wildlife-vouchers-preview-1.png)

| Label | Image theme | Reference price / term | Actual-size front and reverse underprint |
| --- | --- | --- | --- |
| Daily | Cheetah | KES 30 / 24 hours | [Daily master](../../artifacts/mesh-voucher-design/wildlife/daily-voucher-master.pdf) |
| Weekly | Lioness | KES 140 / 7 days | [Weekly master](../../artifacts/mesh-voucher-design/wildlife/weekly-voucher-master.pdf) |
| Monthly | Tiger | KES 450 / 1 month | [Monthly master](../../artifacts/mesh-voucher-design/wildlife/monthly-voucher-master.pdf) |

These values come from the operator's [3WEST reference catalogue](../../lib/production/3west-catalogue.ts), not newly created plans. No amount, duration, bandwidth or expiry behaviour was changed by the artwork. Match each real print batch to its approved package and customer terms before sale. **Every supplied code is dummy data; these are SAMPLE / NOT VALID proofs.**

The scratch area is **32 x 8 mm**, on the reverse: **9 mm from the left and 10.5 mm from the bottom of the 50 x 40 mm trimmed card**. In the [coated reverse proof](../../artifacts/mesh-voucher-design/wildlife/coated-reverse-proofs.pdf), an unmistakable silver panel says **SCRATCH HERE** and completely conceals the illustrated six-digit code. This is a simulated finish for review. The three master PDFs instead show the dummy code underprint; the separate [SCRATCH_PANEL finish plate](../../artifacts/mesh-voucher-design/wildlife/scratch-finish-guide.pdf) tells the printer where to apply the opaque coating. Never print the visible underprint alone for sale.

The [enlarged comparison PDF](../../artifacts/mesh-voucher-design/wildlife/wildlife-vouchers-preview.pdf) is a design review sheet, not imposed production artwork. Individual masters remain **50 x 40 mm trim with 3 mm bleed**. Geist type and the woven Mesh mark are vector; photographic wildlife is generated bitmap artwork. The three backdrops were generated using the built-in image-generation tool, not represented as documentary photographs or stock photography. [Prompt set and provenance](../../artifacts/mesh-voucher-design/wildlife/image-generation-prompts.md) are supplied with the assets. [Rebuild script](../../scripts/mesh/create-wildlife-vouchers.py) makes the PDF masters, silver proofs and rendered previews without any financial or issuance API call.

The existing production print, scratch opacity, stock controls and acceptance requirements below still apply. The generated animal illustration does not promise a package speed. All denominations can use the same size; more digits do not require a larger card. The wildlife edition contains RGB photographic proof assets and vector colour approximations; the printer must convert them using its press profile and approve a physical colour proof. These are not PDF/X or colour-certified press files.

## Earlier graphic directions - retained for reference

Design proofs prepared 6 October 2026. These are **sample artwork**, not issued vouchers. No codes were generated, imported, activated or sold. The illustrated `123456` and `DEMO-00001` are dummy data; no production database was queried to obtain them. A dummy six-digit number is not guaranteed to be unused in a live system, so never try to redeem it.

![Three Mesh voucher directions](../../artifacts/mesh-voucher-design/three-concepts-preview.png)

**Recommendation: Orange ticket, 50 × 40 mm for every amount.** Its orange block makes the value easy to find, while the ivory strip separates the duration and instructions. A KES 1,000 amount fits on this size without reducing the instruction text. A bigger card can be a premium material choice, but the number of digits does not require one. A single size keeps cutting, coating, storage and retail display simpler.

## Three directions

| Direction | Visual idea | Best reason to choose it | Front/back proof |
| --- | --- | --- | --- |
| **01 Orange ticket** | Orange amount panel, ivory information strip, strong Mesh wordmark | Clear at a vendor's counter; easiest denomination system | [KES 20 PDF](../../artifacts/mesh-voucher-design/01-orange-ticket.pdf) |
| **02 Ivory edition** | Editorial white space, large amount, orange base and secondary woven mark | Quieter, more premium appearance; less orange coverage | [KES 20 PDF](../../artifacts/mesh-voucher-design/02-ivory-edition.pdf) |
| **03 Orange stripe** | Vertical orange stripe, large amount and rotated “Scratch. Connect.” | Distinctive retail silhouette without adding illustration | [KES 20 PDF](../../artifacts/mesh-voucher-design/03-orange-stripe.pdf) |

These are original layouts inspired by the visual language of tickets, editorial typography and compact retail packaging. They preserve the existing woven Mesh geometry, the bold **Geist 750** wordmark, warm paper, Afribit orange and the retained deep green brand. They do not add a dot or “by Afribit” to the logo. The [design philosophy](../../artifacts/mesh-voucher-design/design-philosophy.md) records the approach.

The [enlarged overview PDF](../../artifacts/mesh-voucher-design/three-concepts-preview.pdf) simulates a silver scratch panel. It is for comparison; its cards are shown at **155%**, not actual size. Individual PDFs are the actual-size front and reverse masters. Their reverse pages show the code **underprint**, before the separate scratch finish is applied.

## Prices, durations and size

The two current price examples are **KES 20 / 4 hours** and **KES 30 / 24 hours**. Their [comparison proof](../../artifacts/mesh-voucher-design/current-plan-variants.pdf) and [KES 30 front/back master](../../artifacts/mesh-voucher-design/01-orange-ticket-kes30.pdf) use the same footprint.

![Current plan examples](../../artifacts/mesh-voucher-design/current-plan-variants.png)

The [KES 20 / 100 / 1,000 size study](../../artifacts/mesh-voucher-design/denomination-size-study.pdf) demonstrates typography only. **KES 100 and KES 1,000 are proposed denominations, not existing purchasable packages.** They have no invented durations. The current backend voucher buys a specific package; it does not represent a stored-value balance. A new amount must first be mapped to an approved package and its terms.

![Same footprint for different amounts](../../artifacts/mesh-voucher-design/denomination-size-study.png)

Before a real print run, resolve the production review's distinction between accumulated online time and a fixed deadline, and print the corresponding duration/expiry wording. Do not silently change the customer's current price, validity or bandwidth. These proofs deliberately do not promise a speed or an offline redemption service.

## Printer handoff

| Item | Specification |
| --- | --- |
| Finished size / TrimBox | **50 × 40 mm**, landscape |
| Bleed | **3 mm on every edge**; supplied PDF MediaBox/BleedBox is **56 × 46 mm** |
| Safe area | Target **3 mm inside trim** for live type; no meaningful content at the cut edge |
| Substrate proposal | Opaque **300–350 gsm** card; printer must verify the chosen card hides the code under strong light |
| Corners | Square for the low-cost pilot; optional **2 mm corner radius** after printer approval |
| Process colours | CMYK approximations of Afribit orange, warm ivory, ink and green; no gradients |
| Typeface | Geist regular 400, medium 550 and bold 750; embedded PDF font subsets; [SIL OFL](../../artifacts/mesh-voucher-design/font-license.md) included |
| Instruction size | **7.5 pt**; heading **8.7 pt**; secondary privacy text **6.8 pt**; specimen/serial **6.5 pt** |
| Redemption code | Six digits in **16 pt** bold with extra spacing; includes leading zeroes in real issuance |
| Scratch panel | **32 × 8 mm**, on reverse, **9 mm from the left** and **10.5 mm from the bottom** of the trimmed card; centre at **25 × 14.5 mm** |
| Code underprint | Baseline **13 mm** from bottom; begins **10.6 mm** from left; panel covers the complete code |
| Finish plate | [Separate `SCRATCH_PANEL` spot-colour guide](../../artifacts/mesh-voucher-design/scratch-finish-guide.pdf), same MediaBox/TrimBox as each master |
| Retail serial | A non-secret, independently generated stock identifier; never the redemption code |
| QR | None in the compact proofs. If added, encode the portal URL only, never the redemption code or an automatic redemption request |

Ask the printer to impose and add their own crop marks. Print individual masters at **100% / actual size**, without “fit to page”. The supplied finish guide is a geometry/spot plate, not scratch ink. A printer must supply the appropriate release varnish plus opaque scratch coating, or a suitable tamper-evident scratch label, and check their compatibility with the variable code print.

The cards are vector PDF proofs with embedded fonts, plus 600 dpi PNG previews of the individual fronts and underprints. They are **not PDF/X-certified** and do not carry the printer's ICC output intent. The CMYK values are process-colour approximations, not a press-match guarantee. Before commercial printing, have the printer convert/export for their press, verify front/back registration, approve the scratch layer separation and overprint settings, and provide a physical proof. Do not send the enlarged comparison sheet as production artwork.

## Redemption and stock controls

The customer's flow is: join **Mesh**, scratch, choose the voucher option and enter the six-digit code. There is no customer username/password pair. The package activates on the trusted device session; the backend and router remain responsible for access and expiry.

Existing code-generation, encrypted export, hashed lookup, shared rate limits and trusted-session binding are documented in [Six-digit Mesh vouchers](mesh-six-digit-vouchers.md). Printed stock adds a handling risk: a code can be stolen before sale, and a six-digit secret has a small search space. A scratch coating reduces casual exposure; it does not replace server checks.

For a production printing workflow:

1. Generate real codes only through the existing audited batch system. The package, price, duration, network scope and batch ID must be recorded there. Never derive secrets from the visible serial or use consecutive codes.
2. Merge the confidential code file into reverse underprint only. Keep that file, printer spool and finished variable-data artwork out of public design artifacts, source control and preview screenshots. Give the printer the minimum necessary data and account for spoilage.
3. Track vendor inventory by the visible **non-secret serial**. Maintain count reconciliation, controlled storage and a process to invalidate lost stock. “Activate at sale” is a possible future control; it is **not implemented by these designs**.
4. Keep first redemption atomic and bound to the trusted session. Repeated submissions must not create extra allowance. Preserve shared attempt throttles and audit attempted/repeated redemption.
5. Treat damaged or removed coating as tampering. Check that strong light, rubbing and ordinary handling do not reveal the code. The shop should exchange an unsold damaged card instead of selling it.
6. Explain “one device” before purchase. Private Wi-Fi MAC changes and device replacement need an operator recovery policy; MAC binding alone is not cryptographic proof of a person or a physical device.

No QR in these proofs can leak a secret because no QR is supplied. If a later, larger **70 × 45 mm** version includes a QR and fuller expiry terms, use the larger format for readability and functionality rather than denomination alone. Avoid shrinking essential instructions below the current 7.5 pt.

## Acceptance before sale

Print one non-redeemable specimen at actual size. Have several people read the amount and instructions without magnification, including someone with reduced vision. Confirm the coating covers all six digits, scratches cleanly without damaging them, and cannot be read through the card. Confirm duplex orientation and cut tolerance. Then use a separately authorised, small real issuance batch to verify first redemption, replay rejection, wrong-device behaviour, expiration and stock accounting. The supplied `123456` specimen must never be used as that test.

Digital verification completed for these proofs: all four card masters have two pages, **56 × 46 mm** media and **50 × 40 mm** trim; regular/medium/bold Geist subsets are distinct and embedded; the finish PDF contains the `SCRATCH_PANEL` separation; overview, current-price and four-digit size previews were visually inspected after correcting font-instance naming and letter-spacing state. Physical print, scratch adhesion, opacity and live redemption remain untested.
