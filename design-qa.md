# Homepage Design QA

## Evidence

- Source visual truth: `Doc/Design/homepage-option-2-reference.png`
- Source pixels: `853 x 1844`
- Normalized source: `artifacts/homepage-option-2-reference-normalized.png` at `390 x 844`
- Implementation screenshot: `artifacts/portal-mobile-viewport.png`
- Implementation pixels and CSS viewport: `390 x 844` at device scale factor `1`
- Full-view comparison: `artifacts/design-qa-mobile-comparison.png`
- State: first pass selected, voucher form closed, network available
- Capture: browser-rendered in the repository's headless Chrome verification harness

The source was normalized to the intended `390 x 844` mobile viewport. The implementation was captured at the same CSS size and density. No focused crop was needed because the header, hero, first four plans, selected state, pricing hierarchy, and fixed checkout remain legible in the full-view side-by-side comparison.

## Required Fidelity Surfaces

- Fonts and typography: Geist matches the source's neutral sans-serif character. KES remains primary, sats remain secondary, letter spacing is zero, and the long `1 hr 20 min` label fits on one line. Implementation plan text is intentionally larger than the generated source for mobile legibility.
- Spacing and layout rhythm: compact white header, shallow image hero, two-column mobile grid, six-pixel card radii, restrained gaps, and fixed bottom action match the selected composition. Desktop reflows to a three-column grid without overflow.
- Colors and visual tokens: white and warm-neutral surfaces dominate. Green, gold, and red are limited to fine duration-group borders; Bitcoin orange is reserved for selection, sats, and the primary action.
- Image quality and asset fidelity: `public/images/rooftop-wifi-hero.png` is a dedicated raster asset with the matching antenna subject, warm daylight, and right-side crop. It is rendered with `next/image`; no CSS, SVG, or placeholder substitute is used.
- Copy and content: all nine durations, KES prices, sats equivalents, usage descriptions, voucher action, selected summary, and network state are preserved.

## Comparison History

### Iteration 1

- P1: the checkout was fixed relative to an animated section instead of the viewport because the section retained a transform.
- Fix: removed the transform-producing reveal animation from the checkout's containing section.
- Post-fix evidence: the Continue button is at `770px` in the `844px` mobile viewport and `826px` in the `900px` desktop viewport.

- P2: the portal brand icon was undersized and the longest duration wrapped unlike the source.
- Fix: increased the scoped WiFi mark and added a compact type size for the long duration.
- Post-fix evidence: `artifacts/design-qa-mobile-comparison.png` shows a stronger header mark and a single-line `1 hr 20 min` label.

## Interaction And Responsive Checks

- Mobile `390 x 844`: status 200, nine plans present, no horizontal overflow.
- Desktop `1440 x 900`: status 200, nine plans present, no horizontal overflow.
- Plan selection updates both `aria-checked` and the fixed summary.
- Voucher mode opens, exposes the labeled code field, and returns to pass selection.
- Console and page errors: none.
- Admin still redirects to passkey login and the passkey control remains visible.
- Health endpoint: 200 with database connected.
- Payment submission was not triggered because it creates an external BTCPay invoice; the existing payment handler was not changed.

## Remaining P3

- The generated source compresses all nine plans into one mobile frame using very small type. The implementation keeps readable touch targets and type sizes, so later plans require vertical scrolling. This is an intentional accessibility and captive-portal usability improvement.

## Final Result

final result: passed
