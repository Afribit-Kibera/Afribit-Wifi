# Mesh local captive welcome

Updated: 5 October 2026. Scope: **welcome and internet purchase**, with Afribit/Bitcoin identity. Communication belongs in native apps; the community board is a completed lab demonstration and is no longer a choice in the captive. [Communication candidates and bounded next trial](mesh-communications-app-research.md).

The revised page uses warm ivory, Afribit orange, the retained woven Mesh mark and locally bundled real Kibera photography. The photo fills a welcome hero beneath a dark overlay; an overlapping warm-white panel puts **Get online** and **Choose an internet pass** immediately below it. The pass action fits the first viewport in the 320 × 568 and 390 × 844 browser fixtures. Voucher entry remains secondary. Bitcoin is visible over the photo and in the Afribit introduction. It loads without WAN, font-CDN requests, a framework or a build step; there is no automatic cloud redirect. [Photo source, typography and design review](mesh-captive-art-direction.md).

The open join, DHCP, automatic phone entry, unpaid Safari board/relay access and public HTTPS denial already passed on Primary. Those results are historical network evidence, not a reason to repeat the board inside the popup. Guest isolation/offline checks and paid authorization are still commissioning work. [Installation and prior evidence](kibera-mesh-open-captive-test.md).

## Files and defaults

Upload the configured source files together to the actual persistent HotSpot directory:

| File | Purpose |
| --- | --- |
| `login.html` | Welcome, Bitcoin/Afribit introduction, internet-pass/voucher handoff |
| `mesh-kibera-market-960.jpg`, `mesh-kibera-market-1440.jpg`, `mesh-kibera-market-3840.jpg` | Real Afribit photo at responsive widths; the largest is 3840 × 2560 |
| `geist-latin.woff2`, `geist-OFL.txt` | Same Geist font as the earlier portal, bundled locally with its license |
| `site-config.js` | Public configuration for this access router; no credentials |
| `api.json` | RouterOS captive-status template; requires RouterOS rendering |
| `status.html` | Actual RouterOS session duration and traffic fields |
| `error.html` | RouterOS error and return to welcome |
| `rlogin.html`, `redirect.html` | Local HTTP captive detection and redirect templates |
| `explore.html` | Retained legacy lab directory, not linked from the revised captive |

Purchase and voucher entry are disabled by default with the explanation **Internet passes are coming soon.** No price, wallet access or general connectivity is invented. If JavaScript or configuration fails, the introduction and locally hosted artwork remain readable while purchase stays disabled. If the image fails, welcome and purchase copy remain available.

```javascript
window.MESH_SITE = Object.freeze({
  locationLabel: "Kibera",
  routerId: "",                 // Actual commissioned access-router identity.
  billingReady: false,           // Enable only after isolated authorization checks.
  localDirectoryUrl: "",         // Legacy directory only; ignored by welcome.
  communityBoardUrl: "",         // Legacy explore.html configuration.
  blinkAccessVerified: false,    // Retained legacy setting; ignored by welcome.
});
```

`billingReady` requires a valid, nonempty `routerId` before purchase and voucher actions become usable. Router IDs allow letters, digits, period, underscore, colon and hyphen, up to 100 characters. Do not use the production pilot's `bitcoin-valley-main` ID for a lab router or reuse a node ID. Backend gateway job ownership must target the correct access router before multiple paid nodes can be commissioned. This visual gate is not authorization: the backend must validate context and enforce payment independently.

The Primary deployment uses `routerId: "mesh-lab-001"`, with billing and Blink false. Legacy directory/board settings and their narrowly scoped board exception are retained for the existing lab; the welcome ignores those settings. This revision installs no new service or internet exceptions. Blink wallet onboarding/free access and native communications require separate dependency and policy verification.

The hero revision is installed on Primary and its downloaded `login.html` matches the source SHA-256. The previous login is retained under ignored `artifacts/mesh-lab/captive-before-hero-20261005/`; installation evidence is `captive-hero-installed-verification.json`. The photo/font assets and site configuration are unchanged. Real phone chrome and text scaling still need observation.

The RB951Ui-2HnD can serve the HTML, JavaScript, font and JPEG directly from its persistent `mesh-captive/` folder. There is no `flash/` directory on this inspected router; its live profile is `KM-MESH-PROFILE` with `html-directory=mesh-captive`. This does not make the router an app, payment or messaging host.

## Cloud handoff contract

Only an explicit **Choose an internet pass** or **Already have a voucher?** action submits the GET form to `https://wifi.afribit.africa/`. Standard RouterOS template fields remain intact:

| Parameter | Source |
| --- | --- |
| `mac` | `$(mac)` |
| `ip` | `$(ip)` |
| `router` | The configured access router's identifier |
| `link-login` | `$(link-login)` |
| `link-orig` | `$(link-orig)` |
| `view` | `internet` or `voucher`, exactly one value |

The browser handles GET encoding. Identifiers and return links are context for the existing portal, not trusted proof of identity or authorization. The page submits no router administrator password, merchant credential or API key. Internet-pass checkout remains cloud-dependent. Keep context out of public screenshots and avoid adding tracking scripts to this page.

This shell does not perform RouterOS username/password or CHAP login itself. It hands off to the existing cloud authorization flow. It adds no anonymous free-login user, trial, payment bypass or session-grant behavior. The existing BTCPay checkout is unchanged; receiving Bitcoin through an optional external provider is a separate integration.

The status page labels counters from the visitor's perspective: received uses `bytes-out-nice` and sent uses `bytes-in-nice`, because RouterOS counts traffic from the router's perspective.

## Commission one isolated customer network

Do not import `mikrotik/bitcoin-valley-hotspot.rsc` unchanged: its bridge, addressing and NAT assumptions belong to the existing pilot. Preserve the protected commissioning SSID, management path, OSPF transit and protected radio backhaul. Local and external exceptions should allow approved service destinations and ports, not entire management subnets.

1. Read the current configuration and preserve an operator-controlled management connection. The following RouterOS commands inspect state and create recoverable snapshots; choose unique backup filenames and retain the binary backup locally, outside Git.

   ```routeros
   /ip hotspot print detail
   /ip hotspot profile print detail
   /interface bridge port print detail
   /ip firewall filter print detail
   /ip firewall nat print detail
   /export file=mesh-before-captive
   /system backup save name=mesh-before-captive
   ```

   **Expected:** current access paths and the exact customer HotSpot profile are identified; export and backup can be downloaded. Never print `show-sensitive` exports into chat. Backups can contain sensitive configuration.

2. Make an operator deployment copy of `mikrotik/hotspot-mesh/`, outside the tracked source if it contains site-specific data. Edit only that copy's `site-config.js`. Leave billing and Blink gated while commissioning. Establish the isolated customer SSID/VLAN, subnet and HotSpot through the reviewed network overlay; do not apply HotSpot to the existing router-to-router transit or management interfaces.

   **Expected:** public Wi-Fi clients are separated from management, and the existing mesh routes still work. A welcome HTML folder alone does not configure an SSID, VLAN, DHCP, DNS or access policy.

3. Upload the configured folder using WinBox Files or the existing authenticated file-transfer tool. Use the actual storage directory shown by `/file print`; where the device uses `flash/`, place the folder there for persistence. Record the current profile's `html-directory` value before switching it. Replace the profile and directory values below with those inspected in step 1.

   ```routeros
   /file print
   /ip hotspot profile print detail where name="MESH_CUSTOMER_PROFILE"
   /ip hotspot profile set [find where name="MESH_CUSTOMER_PROFILE"] html-directory="hotspot-mesh"
   ```

   **Expected:** an unpaid client on that isolated customer network sees Mesh. Enable no capabilities merely to remove the disabled-state labels.

4. Serve welcome assets from the local HotSpot folder. Independently configure narrow pre-payment access to the cloud portal, checkout and any separately approved service destinations. Revisit management isolation, IPv6 bypass, NAT/forwarding and expiry behavior before authorizing paid operation.

   **Expected:** permitted services work, while arbitrary unpaid internet browsing and management access do not. Application redirects, DNS and shared-CDN dependencies require actual verification; this page cannot implement those firewall policies.

5. Test the welcome on iPhone and Android captive windows and a full browser. Then test the bounded acceptance cases below. Enable each capability in the public configuration only after its policy passes. Retain an ordinary browser address people can revisit; app and wallet use should continue in the regular browser rather than assuming the captive window supports every handoff.

## Acceptance and rollback

| Check | Expected |
| --- | --- |
| WAN unavailable | Local introduction and artwork remain readable; no forced cloud navigation |
| Default configuration | Purchase/vouchers gated, reason visible; only local requests |
| Legacy service flags | No app catalogue, board navigation or wallet action appears in the welcome |
| Image or config missing | Welcome remains readable; missing config never enables checkout |
| Configured billing | Exact node identity and RouterOS fields preserved in the cloud URL; one `view` value |
| Voucher choice | Cloud voucher screen opens without duplicate `view` values |
| Invalid router ID or missing configuration | Purchase remains disabled |
| Widths 320–430 px, keyboard and large text | Readable content, visible focus, usable controls, no horizontal overflow |
| Real paid session | Authorization, expiry and revoke enforced on this exact access router |

If the welcome fails, restore the recorded previous `html-directory` on the specific customer profile. If networking changes fail, use the separately prepared network-overlay rollback while retaining the protected management connection. Switching this folder alone is not a rollback of firewall, VLAN, DHCP or gateway changes. Do not restore a binary backup blindly over a running production router.

## References

- [MikroTik HotSpot customization and external authentication](https://help.mikrotik.com/docs/spaces/ROS/pages/87162881/Hotspot%20customisation)
- [MikroTik HotSpot, captive-status API and DHCP advertisement prerequisites](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot%2B-%2BCaptive%2Bportal)
- [Blink](https://www.blink.sv/)

RouterOS captive-API advertising requires its configured DNS name and a valid certificate. Adding `api.json` does not supply either prerequisite, and does not by itself make a captive window appear. Real-device commissioning is intentionally separate from this implementation.

## Implementation verification

Primary installation: eight changed files (photo variants, font/license, login/status/error) are uploaded to the existing `mesh-captive/` folder and downloaded again; all match source bytes/SHA-256. Before-revision pages are retained in ignored `artifacts/mesh-lab/captive-before-photo-20261005/`. The live profile remains `KM-MESH-PROFILE`, billing stays false, and no SSID/firewall policy changed. Protected-computer HTTP probes to the captive servlet timed out; they are not guest-path evidence. The revised appearance and local asset/font loading on the actual phone popup remain a single visual acceptance check. Web logo source changes are lint checked and have not been publicly deployed.

The reproducible Chromium check in `tests/mesh-captive-check.mjs` passes: welcome/purchase scope, visible Afribit/Bitcoin identity, local photo/font loading, responsive retina-photo selection, default billing gates, local-only requests, missing config/image handling, preserved/encoded client context, exactly one internet/voucher view, invalid router rejection, at least 44 px targets, JavaScript-disabled introduction and no horizontal overflow at 320/390/430/580 px. Retained legacy-directory URL/credential and browser-handoff checks also pass without exposing it in the welcome. Results and the reviewed mobile screenshot are in ignored `artifacts/mesh-lab/mesh-captive-review/`. This is an implementation check with fixture substitutions, not a RouterOS or phone captive acceptance result.
