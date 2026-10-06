# Mesh portal build and review

5 October 2026. The new brand is **Mesh**, by Afribit. This is a local code/build deliverable; no production deployment, router change, SSID change or real payment was performed.

## Product direction

Mesh is a Bitcoin-first platform. Retain the implemented BTCPay/Lightning checkout and vouchers. Direct M-Pesa integration is not a prerequisite. Third-party providers such as Bitika may later accept a customer's preferred payment method and settle a tied Bitcoin invoice; activate provider choices only after their settlement integration is implemented. See [the provider and Blink research](blink-free-app-pilot.md).

The welcome offers local community services, approved free online apps and paid general internet. These are separate access categories, not evidence of firewall enforcement merely because the page exists. The user prioritizes this build before another router/device test cycle.

## Visual direction

Warm paper `#f4f1e9`, forest `#203c32`, ink `#15291f` and restrained citron `#dff58b`; self-hosted Geist typography, a woven Mesh symbol, editorial horizontal rows, clear borders and large mobile actions. The website has a generated neighborhood illustration; the local router shell deliberately uses no external imagery or fonts.

Global references informed hierarchy, navigation and materials rather than supplying copied artwork:

- [Linear's interface redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): consistent alignment, navigation hierarchy and restrained surfaces.
- [Aesop](https://www.aesop.com/): warm backgrounds, editorial spacing and material-focused presentation.
- [Blink](https://www.blink.sv/): first featured wallet, with a distinct and honest access explanation.

Generated concepts and source prompts are recorded in [image provenance](mesh-image-prompts.md). The concept board's decorative examples and prices do not populate live billing data.

## Implemented experience

- Responsive welcome with **Explore the mesh** and **Get internet** actions.
- Three keyboard-accessible tabs: local directory, free apps and internet passes.
- Blink details with an explicit pending/commissioned distinction and an official-site link.
- Real database prices and package IDs. Three featured passes show first, with all passes available on expansion; no sample prices replace a failed database.
- Existing payment and voucher payloads preserved, including captive MAC/IP/router/login context. The Mesh home control resets the view without losing that context.
- Clear guidance and disabled purchasing when the device context is absent.
- Native dialogs with Escape/focus return, reduced motion, 44 px control targets and visible focus states. The voucher input is 16 px on mobile to avoid iOS focus zoom.
- Bounded payment/voucher waiting, clear malformed-response/network errors and a retry path; no automatic duplicate payment requests.
- Matching payment and connection screens. A grant is shown active only when the backend reports an active, unexpired grant; pending grants check for activation while the page is visible. Opening `/connected` by itself does not assert paid access.
- A missing/unavailable billing catalogue leaves the welcome and configured local directory available. This does not turn the cloud website into an offline application or make voucher redemption independent of the database.

## Local and online configuration

`lib/mesh-services.ts` reads server-side site settings. Leave these blank until the corresponding service is deployed and reachable from customers:

```env
MESH_LOCAL_BOARD_URL=
MESH_LOCAL_MEDIA_URL=
MESH_LOCAL_LEARNING_URL=
MESH_BLINK_FREE_ACCESS_ENABLED=false
```

The directory accepts HTTP(S) destinations without URL credentials and does not infer service health from a configured URL. Cloud production does not inherit private lab links from a developer's preview. Do not advertise raw storage endpoints as a media browser.

The Blink flag controls the catalogue's claim, not the router policy. Set it true only after the actual wallet journey works for unpaid visitors. [Blink research](blink-free-app-pilot.md) records exact candidate hostnames, API/WSS endpoints, conditional onboarding dependencies and current gateway limitations.

The separate [local captive shell](mesh-captive-shell.md) consists of five dependency-free files under `mikrotik/hotspot-mesh/`. It preserves an offline introduction, explicitly gates unconfigured actions and passes `view=internet` or `view=voucher` to the cloud portal. The existing `hotspot-bv` files remain available.

## Review and validation

Start a local preview with `npm run dev -- --hostname 127.0.0.1 --port 3000`, or use `npm run build` followed by `npm run start -- --hostname 127.0.0.1 --port 3000`. Review the welcome at `http://127.0.0.1:3000/`. Direct visitors without a captive context may browse the portal but cannot authorize a pass for an unidentified device.

Use an isolated development process to set site-local directory settings. For this lab, the existing community board is `http://10.20.0.10:8020/`; adding it to a local preview is not permission to add it globally to the cloud catalogue or bypass a firewall.

Validation commands:

```powershell
npm run typecheck
npm run lint
npm run build
node tests/visual-check.mjs
node tests/mesh-captive-check.mjs
```

The visual check reads configured packages and intercepts all payment/voucher mutations. It verifies 320/390/768/1440 px layouts, no horizontal overflow or page errors, keyboard tabs, native dialog focus, featured/all-pass selection, preserved payment and voucher context, inline recovery, voucher handoff, missing-device gating, unverified grant state and protected admin entry. It creates zero real payments. `TEST_BASE_URL` and `CHROME_PATH` can override the defaults.

The captive check substitutes RouterOS template markers on a local test server. It verifies default gating, zero external default requests, explicit configured actions, encoded context, one handoff view, unsafe configuration rejection, 44 px targets and a visible introduction without JavaScript at 320–580 px. Real RouterOS parsing, Wi-Fi joining and captive-browser behavior remain for commissioning.

Screenshots and verification reports are saved under ignored `artifacts/mesh-design/` and `artifacts/mesh-lab/mesh-captive-review/`. Lab download artifacts are excluded from TypeScript/ESLint so upstream Deno sources do not become part of the Next.js app. Existing unrelated package/roadmap changes remain unstaged and untouched.

The review gallery is `artifacts/mesh-design/review.html`. The production build and TypeScript check pass. ESLint completes with zero errors and one existing warning in `scripts/mesh/reconcile-nostr-lab.mjs`. Both browser suites pass; the local shell totals 19,385 bytes. The normal preview binds only to loopback `127.0.0.1:3000`, keeping it separate from the live website and router-hosted services.

## Next operator session

Review the design first. Then commission the home internet gateway and one isolated open customer network, local destination exceptions and trustworthy node-targeted authorization. Test Blink from an unpaid phone before enabling its free-access label. No direct M-Pesa work is a gate. Provider selection, multi-router billing and session accounting remain separate implementation work; existing pilot migration follows successful acceptance.
