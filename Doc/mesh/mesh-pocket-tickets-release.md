# Pocket tickets and free Mesh release

Superseded navigation/payment behavior on 6 October: the free-Mesh redirect
button was removed and the Mesh logo now keeps the current catalogue.
Bitika is the preferred live method with Paystack as backup. See
[current release](mesh-bitika-primary.md). This document retains the earlier
15:34 EAT release evidence and its recovery history.

6 October 2026, 15:34 EAT. Home pilot; no serving-router cutover.

## Published

`https://wifi.afribit.africa` now serves the approved **Pocket tickets** catalogue:
all nine existing passes, prices and configured speeds; native radio selection;
an orange fixed Continue dock reflecting the selected pass; M-Pesa phone entry;
six-digit vouchers; and a prominent free-Mesh navigation option. Continue
scrolls to the actual payment form. It does not initiate a charge. A trusted
guest context is still needed to pay and show its actionable dock.

Production deployment: `dpl_DYWYGVYdMr2iJZJd62FfNT5EPpv4`,
`bitcoin-valley-wifi-r1qhr7bj1-novyrix-teams.vercel.app`, Novyrix Team.
Previous production: `dpl_5unXjUQhJ5VjVa9XJKaXGQxmPMEv`,
`bitcoin-valley-wifi-evd4qneyi-novyrix-teams.vercel.app`.
Project owner access was restored and verified before release.

This release also publishes the previously prepared checkout reservation,
request limits, native/legacy controller isolation and Bitika `qadi_` parsing
patches. The reservation schema was installed before this release. No migration,
seed, package price change, provider switch or financial retry was performed
during publication. Paystack remains the active collection lane; Bitika's new
reference format is supported but no new live Bitika collection was tested.

`MESH_BLINK_FREE_ACCESS_ENABLED=true` was set after the operator confirmed
installed, signed-in Blink wallet refresh on unpaid Mesh with cellular data off.
This is a customer-facing access indicator, not a firewall bypass or permission
to spend wallet funds. It does not establish every Blink feature or offline use.

## Router and design handoff

Primary's updated welcome page has the prominent free option and photo-led
resource cards. [Free learning record](mesh-free-learning.md) includes the
original Bitcoin Diploma PDF link, local thumbnails, network scope and backup.
The local return page explains that staying connected without a pass does not
require purchasing internet; actual OS popup dismissal remains phone-dependent.

[Wildlife voucher proofs](mesh-physical-voucher-cards.md) now use Daily cheetah,
Weekly lioness and Monthly tiger imagery, without animal product names. Each
reverse shows a clear silver scratch area in the coated proof. Masters contain
dummy underprint plus a separate coating guide. These are design proofs, not
issued cards; matching package terms and physical printer acceptance remain.

## Verification

- **78 tests pass**: 36 payments, 32 access, 10 production guards. Providers are
  mocked; integration databases are isolated.
- Typecheck, focused lint and Next 16.3.8 production build pass.
- Real-component payment UI fixtures at 320/390 px pass, preserving request
  identity, binding, validation, voucher and activation/expiry behavior.
- Captive fixtures verify purchase and free entry above the fold at 320 × 568
  and 390 × 844, four resource cards, local assets and no layout overflow.
- Live alias smoke checks: database health HTTP 200; nine ticket cards; safe
  disabled payment without a trusted context; correct free-Mesh URL;
  Blink indicator; no overflow at 320/390 px. No financial POST was made.
- LunaNode controller remains active and cloud-connected after publication.
- Read-only runtime preflight: fresh gateway heartbeat, no queued/claimed/failed
  orders or stale claims, no unresolved collections; home lane ready for a test.

Screenshots and safe verification JSON:
`artifacts/mesh-catalogue-design/implemented/` and
`artifacts/mesh-lab/mesh-captive-review/`. Real guest acceptance of the new
catalogue, local free entry and complete PDF download remains requested.

## Recovery and limits

If this release breaks catalogue/payment ownership, use the owning team's
Vercel rollback to the retained previous production deployment, then verify
the public alias and controller polling. Do not delete orders, reservations,
settlement receipts, router allowances or deadlines to roll back the UI. A
rollback cannot undo an actual collected payment or Bitcoin transfer.

Restore router assets only from the retained private static-file backup.
Remove only the new scoped Blink rules if needed with its commissioner's
`--remove` command; retain existing Signal and paid enforcement. The new PDF
origin is a separate learning allowance. Never restore a full router export
over the serving network as a UI rollback.

Field readiness remains **not ready**: target-router enrollment, exact 3WEST
catalogue/allowance migration, local join TLS, IPv6/FastTrack/isolation,
capacity/restore, recovery and secret rotation are still required. The static
runtime evidence flags are conservative and do not automatically certify a
security release solely because a deployment exists. This home release does
not modify the current 3WEST customer service or prove a resilient offline mesh.
