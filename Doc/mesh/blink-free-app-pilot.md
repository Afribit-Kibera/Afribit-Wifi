# Blink as the first Mesh free internet app

Research date: 5 October 2026. This is a candidate access policy and a later device-test plan. No router, database whitelist, SSID or production configuration was changed by this research.

## Product direction

Mesh sells internet access and settles in bitcoin. Customers may eventually choose a third-party mobile-money-to-Lightning provider such as Bitika; Mesh does not need a direct M-Pesa integration. Keep the existing BTCPay checkout working. Provider choices must only become available when their server integration and settlement verification are complete.

Blink is the first proposed wallet for the free-app catalogue. Free access means Mesh sponsors the network traffic required for the approved features. It does not mean Mesh supplies a wallet account, eliminates the wallet's fees or makes a cloud wallet work without the upstream internet connection. The portal must never ask for wallet credentials, recovery words or an API key.

## What is verified about Blink

Blink publishes its native applications as open source and links official store downloads and APK releases from its website. Its FAQ describes phone-based onboarding, Bitcoin/Lightning payments and Swahili support. This makes it a relevant app to evaluate for the pilot; availability and successful onboarding on this network still need a real device test. [Blink website](https://www.blink.sv/), [Blink FAQ](https://faq.blink.sv/).

The documented production GraphQL endpoint is `https://api.blink.sv/graphql`; subscriptions use `wss://ws.blink.sv/graphql`. Developer API keys are a separate integration feature, not something a Mesh visitor should provide. [Blink API authentication](https://dev.blink.sv/api/auth), [Blink WebSocket documentation](https://dev.blink.sv/api/websocket).

The native app's production configuration independently names those API and WebSocket hosts, uses `api.blink.sv` for authentication, and specifies payment, KYC and fiat web views. These are source-confirmed endpoints, rather than a packet trace of the installed app. Source reviewed at commit `e6f92cbe9810fdb5baedf3076f3e749bf25796e3`; a store build can differ. [Native production instance configuration](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/config/galoy-instances.ts).

## Proposed first allowlist

Start with exact hostnames and TCP 443. Keep the website and installed-wallet tests separate. The following is a policy specification for commissioning, not an executable router script.

| Exact hostname | Protocol / port | Intended use | Evidence / inclusion decision |
| --- | --- | --- | --- |
| `www.blink.sv` | HTTPS / TCP 443 | Wallet introduction and official download links | Official website; presentation entry point only |
| `blink.sv` | HTTPS / TCP 443 | Blink Lightning address / LNURL entry point | Native instance and self-custodial configuration |
| `api.blink.sv` | HTTPS / TCP 443 | GraphQL queries, mutations and native authentication | Official documentation and native production source; core candidate |
| `ws.blink.sv` | WSS / TCP 443 | GraphQL real-time updates | Official documentation and native production source; core candidate |
| `pay.blink.sv` | HTTPS / TCP 443 | Blink payment web pages | Native production source; include for the selected payment flow |
| `lnurl.blink.sv` | HTTPS / TCP 443 | Possible Blink LNURL service callback | Official Blink tooling names this host; capture the actual callback before including it |
| `get.blink.sv` | HTTPS / TCP 443 | Invitation / installation link | Native app constants; add only if used by the portal entry flow |

Blink's own tooling identifies `lnurl.blink.sv` as a receive-flow dependency. The app also recognizes several Lightning address domains and an installation link. A resolver may return a callback on another host; every additional destination needs its own review. Arbitrary Lightning addresses cannot be covered by a small Blink-only hostname list. [Official Blink tooling](https://github.com/blinkbitcoin/blink-skills/blob/main/blink/SKILL.md), [Native app link constants](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/config/appinfo.ts).

Keep these outside the initial guarantee unless the chosen feature needs them:

| Feature | Source-confirmed dependency or unresolved dependency |
| --- | --- |
| KYC and buy/sell | `kyc.blink.sv`, `fiat.blink.sv`; their downstream providers are not enumerated here |
| Explorer links | `mempool.space`, `sparkscan.io`; useful extras, not core wallet access |
| Phone registration CAPTCHA | Native Geetest module; the actual challenge/CDN hosts need observation |
| App attestation | Firebase App Check with Android Play Integrity and iOS App Attest/DeviceCheck; platform hosts need observation |
| Self-custodial mode | Breez Spark SDK; its remote service dependencies require a separate source/device review |
| Telegram / WhatsApp / email auth | Depends on the selected login channel; do not open an entire messaging platform to make one wallet test pass |
| Push notifications / telemetry | Not equivalent to payment API dependencies; determine which failures are optional and which affect the required user journey |

The native code confirms Geetest, Firebase attestation and Breez Spark use but does not establish a complete hostname allowlist for them. Start by testing an already installed, already authenticated wallet, then evaluate new-user onboarding separately. [Geetest integration](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/hooks/use-geetest-captcha.ts), [App Check providers](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/screens/get-started-screen/use-device-token.ts), [Self-custodial SDK configuration](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/self-custodial/config.ts).

## Downloads and captive browser behavior

Use the official Blink website as the initial catalogue destination. Give visitors a visible full-browser option: the captive mini-browser should explain the app, not become a wallet login or recovery interface. Installed-app deep links are an optional enhancement after the target OS and captive-browser behavior are verified.

An App Store / Google Play link does not make the app binary downloadable through the current whitelist. Stores involve authentication, CDN and operating-system services. Do not allow `*.apple.com`, `*.google.com`, `*.googleapis.com`, all of GitHub or a whole CDN merely to enable installation. First acceptance should use a preinstalled wallet. A later Android APK distribution experiment must use an official release, verified provenance and an explicit update plan; it is not a substitute for iPhone installation.

The portal catalogue should distinguish planned access from verified free access. Promote Blink to “Free with Mesh” only after the approved features pass with an unpaid customer session. When the WAN is unavailable, explain that Blink needs internet and keep local Mesh services reachable.

## Existing code and enforcement gaps

The current implementation provides these building blocks:

| File | Observed behavior | Consequence for this pilot |
| --- | --- | --- |
| `app/admin/(protected)/whitelist/actions.ts` | Saves enabled hostnames and queues one `sync_walled_garden` job | Suitable administration foundation; no protocol, port or router scope in its payload |
| `lib/db/schema.ts` | `whitelistedSites` stores hostname, subdomain inclusion, category and notes | Does not distinguish proposed / verified / retired service policies |
| `gateway-agent/index.ts` | Deletes managed `/ip/hotspot/walled-garden` rules and recreates hostname exceptions | Native HTTPS/WSS and platform dependencies are not proven by a successful job alone |
| `lib/utils.ts` | `normalizeHostname()` removes `www.` | Exact `www.blink.sv` cannot survive normalization when subdomains are disabled |
| `app/api/gateway/jobs/claim/route.ts` | Claims from a shared queue without authenticated router targeting | Multiple access routers cannot safely consume the current shared jobs independently |
| `scripts/seed.ts` | Seeds the portal and BTCPay checkout hosts | No Blink free-access policy is installed by the existing seed |

MikroTik documents separate web and IP walled-garden menus; the latter supports destination hostname/address, protocol and port. It also documents IPv4-only HotSpot enforcement and certificate-dependent captive advertisement. Plan native HTTPS/WSS transport with an explicit, scoped IP walled-garden policy and verify it on RouterOS 7.20.x. A UI entry or DNS response is not proof of unpaid access. [MikroTik HotSpot documentation](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot%2B-%2BCaptive%2Bportal).

Commissioning needs:

1. Per-router enrollment, job ownership and customer-session validation before distributing paid grants or allowlists across both nodes.
2. An app policy with exact hostname, protocol/port, purpose, feature scope and verification status; preserve exact hosts instead of stripping `www.`.
3. DNS refresh / expiry handling, reviewed CNAME behavior and rollback of only Mesh-managed rules. Failures must not silently turn into general internet access.
4. Separate guest and management access. Free wallet access must not expose router administration, SSH, the controller or service management ports.
5. An explicit IPv6 policy and UDP 443 / QUIC behavior; do not leave an alternate network path outside paid-access enforcement.
6. An unpaid-session acceptance test on each access node. A test from the administrator's connected computer is insufficient.

Read-only DNS observations on 5 October: `www.blink.sv` pointed to `cdn.webflow.com`; Blink's bare/API/WebSocket/payment/LNURL hosts shared one observed IPv4 address with short TTLs. These observations are not permanent policy data. IP-based permission may also allow another virtual host at the same destination address, while CDN and address changes can break access. Do not claim application-specific isolation from a static IP allowlist. Record and test the actual behavior on the chosen router; do not intercept or replace wallet TLS.

## Bitika provider direction: public API is verified

Bitika's official developer site documents mobile-money collection followed by Lightning settlement. It supports API keys, idempotent requests, a no-money sandbox, invoice-based flows and signed callbacks. This supports the user's provider direction; no provider account was created and no payment API was called. [Bitika developers](https://bitika.xyz/developers).

The published base URL is `https://bitikaserver.up.railway.app`. Its reference includes fixed-amount BOLT11 collection, KES-priced invoice collection, transaction lookup, and HMAC-SHA256 webhooks. `fulfilled` / `payment.completed` represents delivered bitcoin; `processing_payment` is not terminal success. Live credentials require provider approval. The docs advertise a 3% live conversion fee; confirm fees, quoting and invoice amount matching with the provider before exposing checkout. [Bitika API reference](https://bitika.xyz/developers/docs).

Recommended later integration: create an invoice tied to the Mesh purchase, use a server-only provider adapter and stable idempotency key, verify signed callbacks against the raw body with a replay window, and reconcile provider settlement to the invoice before granting access. Handle collected-money / failed-Lightning settlement as a distinct pending-resolution state. Keep provider secrets out of the browser. Browser clients should contact Mesh; only server-side integration needs provider API egress, avoiding a broad public `*.railway.app` exception.

**Implementation update, 5 October:** the optional Bitika adapter and gated M-Pesa checkout are now built. Actual sandbox lookup/idempotency verifies fulfilled, declined and collected-but-undelivered outcomes, using the supplied test key and receiving address. No real money, STK prompt, production sale or access grant is performed. BTCPay remains the default independent option; Bitika is not enabled in public checkout. The provider signing secret, public callback deployment and network/payment lifecycle are still commissioning work. [Implementation and remaining checks](mesh-bitika-provider.md).

## Acceptance when network testing resumes

| Scenario | Expected evidence |
| --- | --- |
| Unpaid phone opens Mesh | Portal renders with local assets; free / paid choices are clear |
| Installed, authenticated Blink | Balance refresh and receive flow work without purchasing general internet |
| Small wallet payment, with explicit operator approval at test time | Correct recipient, settled result and real-time update; no secret credentials in logs |
| New-user onboarding | Selected login channel, CAPTCHA and attestation complete with only reviewed dependencies |
| App installation | Assessed separately; no broad store/CDN wildcard added as a shortcut |
| Unpaid general browsing | A destination outside the catalogue stays blocked, including alternate IPv6/QUIC paths |
| Purchased internet | Authorized browsing works; expiry returns to the free-app policy |
| Both access nodes | Identical service policy applies to clients on each router |
| WAN removed | External wallet reports unavailable; local Mesh services continue |
| iPhone privacy settings | Record captive popup, full-browser and native-wallet results with Limit IP Address Tracking both enabled and disabled |

Record the installed Blink version, chosen wallet mode, login channel, DNS/CNAME results, required remote destinations and rule-hit evidence. Inspect destination metadata only where possible; never record authentication tokens, seed phrases or payment secrets. Mark the feature scope actually tested, rather than declaring every Blink screen supported.
