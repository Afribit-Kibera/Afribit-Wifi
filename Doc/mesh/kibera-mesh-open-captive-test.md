# Mesh open Wi-Fi: first customer test

Updated: 5 October 2026, Africa/Nairobi. Status: **open join, DHCP, automatic captive entry, unpaid board/two relays in Safari and public HTTPS denial pass**. Management/client isolation and guest WAN-loss acceptance remain commissioning work.

**Current commissioning state, 5 October:** the operator reports Mesh welcome for the unpaid router-web probe. The five-minute native profile, scoped RAW/forward/return rules and operator CHAP login are now installed, with an encrypted pre-change backup and matching downloaded file hashes. There are zero trial users, sessions and authorization-list members; billing remains false. Earlier preparation-only and next-check statements below are historical. **Next:** reconnect the phone to Mesh with cellular off and verify its current IPv4/MAC before creating one bound user. [Short-pass procedure and installation record](mesh-native-pass-test.md).

**Current welcome revision:** the operator clarified that the popup should welcome visitors and offer internet purchase; communication belongs in native apps. Board access below is retained historical evidence, not the captive product. The original woven logo and bold Geist typography are preserved, with no logo dot/byline. The page now uses warm ivory/orange, visible Bitcoin identity and a real Afribit photo at responsive widths including 3840 × 2560. The photo, local font/license, login, status and error files are uploaded to `mesh-captive/` on Primary, then downloaded and byte/hash verified. Browser tests pass; the revised phone popup appearance remains to check. Config stays `billingReady: false`; no SSID, guest allowance or firewall was changed. Before-revision files and installation evidence are retained under ignored `artifacts/mesh-lab/captive-before-photo-20261005/` and `captive-photo-installed-verification.json`. [Current welcome](mesh-captive-shell.md), [photo/type source](mesh-captive-art-direction.md), [native app research](mesh-communications-app-research.md).

The internet gateway milestone passes: both protected lab networks reach the internet, local services remain usable when Primary ether1 is unplugged, and both nodes recover after its single reconnection. The first customer connection opens the captive automatically; its free board works in full Safari while a fresh public HTTPS request fails. No further page check codes are required.

**Latest hero and next milestone, 5 October:** the photo now fills a welcome hero with an overlay. An overlapping pass panel puts internet purchase in the first phone viewport; the original green woven Mesh/Geist logo and Bitcoin identity remain. Primary's `login.html` is replaced after a backup, then downloaded and SHA-256 verified. The profile and billing-false configuration remain unchanged, with zero active users/bypass bindings observed. Evidence: ignored `captive-before-hero-20261005/`, `captive-hero-installed-verification.json` and the updated browser screenshots/checks. The operator chooses **internet checkout and access commissioning** next. Native five-minute pass preparation and rollback scripts pass the router's dry-run syntax checks; they have not been applied. First confirm unpaid router-web isolation, then provision one MAC-bound native pass. [Next sequence and code findings](mesh-internet-commissioning-next.md), [short-pass procedure](mesh-native-pass-test.md).

## Installed first access point

| Setting | Current value |
| --- | --- |
| Customer SSID | **Mesh**, open, primary UniFi AP only, 2.4/5 GHz |
| Customer network | VLAN **30**, subnet **10.30.0.0/24** |
| Gateway and DNS | **10.30.0.1** |
| DHCP pool | **10.30.0.100–199**, five-minute lease |
| Captive entry | **http://10.30.0.1/login** |
| Local directory | **http://10.30.0.1/explore.html** |
| Free local service | Community board at **http://10.20.0.10:8020/**, including its fixed relay proxy paths |
| Public internet | Unpaid clients blocked; native five-minute policy staged with zero users/authorizations |
| Blink / payments / vouchers | Disabled, awaiting their separate policy and authorization checks |

The router runs `KM-MESH-001` on `mesh-customer-30` with profile `KM-MESH-PROFILE`. The welcome files live in persistent `mesh-captive/` storage. Configuration uses the gateway IP for its HTTP entry; it does not depend on the earlier portal's local DNS name. No TLS certificate or DHCP captive-API advertisement is commissioned yet.

The primary AP's ether5 carries its existing native management/protected network plus tagged VLAN 30. Ether2 and ether3 accept only untagged/priority-tagged traffic. The bridge VLAN table explicitly retains native CPU/management access. Both existing WPA2 lab SSIDs and the separate protected OSPF radio/cable transits remain in place. The UniFi customer network is unmanaged because the MikroTik owns DHCP and HotSpot. UniFi's own guest authorization is not enabled.

UniFi identifiers, retained for precise rollback:

- Site: `88f7af54-98f8-306a-a1c7-c9349722b1f6`.
- Customer network: `ce59b6fd-541a-4d4f-a74c-86bcf71e56a2`.
- Customer broadcast: `e3753c6e-329b-4436-b137-1b8bba1e5d7e`.
- Primary AP: `eae13ecb-95aa-3be4-9e33-9b124cdef12c`.

## Enforced policy and current limits

Customer forwarding enters dedicated firewall chains before the existing forwarding accepts and FastTrack. The only permitted local destination is TCP 8020 on `10.20.0.10`; other protected/private destinations and unpaid public forwarding are dropped. The staged native trial requires both HotSpot authentication and membership in its profile's authorization list, retaining the private deny ahead of internet forwarding. Input permits DHCP, local DNS, the HotSpot servlet and gateway ICMP; router management access is not granted. Raw filtering rejects customer source addresses outside the customer subnet, with the initial DHCP exception. IPv6 input, forwarding and router output on this VLAN are denied, including router advertisements. AP client isolation is configured; its actual behavior remains a device acceptance test.

RouterOS **7.20.8** does not expose the `https-redirect` profile setting documented in newer material. Syntax validation detected that before installation. Unpaid customer TCP 443 is therefore dropped in raw prerouting before HotSpot's HTTPS redirect can intercept it. The staged native pass adds an earlier RAW exception for its authorization list; subsequent forwarding still requires authenticated HotSpot state and preserves private denial. The list is empty. UDP 443 and other public traffic remain subject to authenticated trial forwarding or the terminal unpaid deny. Arbitrary unpaid HTTP browsing may show the captive page instead of a browser error.

One application-specific source-NAT rule maps customer traffic to **10.20.0.1**, exclusively for destination **10.20.0.10:8020**. It supplies the existing Windows host and board subnet allowlist with a valid local return path. It does not masquerade node-to-node traffic or grant public internet. The board consequently sees customer connections as the router's IP; that address must not be used as an individual identity or payment proof. An attempted Windows administrator launch was automatically rejected by policy; no Windows route or firewall changes were applied. A future service host can replace this narrow application NAT with explicit return routing and a customer-specific host allowance.

This is an open, IPv4-only lab network. HTTP/WS local services are not encrypted over the open Wi-Fi link. Use lab content and identities during this acceptance; trusted service TLS, customer capacity/rate limits, full isolation/bypass checks and operational security remain deployment work. No payment adapter, public portal deployment or second customer access node is enabled here.

## Evidence before the phone joins

- Primary was backed up before configuration: encrypted binary backup and private export under ignored `artifacts/mesh-lab/private/captive-20261005/`. A post-install export is retained there too.
- Guarded installation and rollback files both pass RouterOS `verbose=yes dry-run`. The installation ran successfully with the new broadcast disabled. VLAN filtering was enabled last, with an eight-minute rescue scheduler; fresh SSH, native AP management, OSPF and WAN checks passed before that scheduler was removed and the broadcast enabled.
- Settled inspection shows a valid enabled HotSpot and DHCP server, the intended VLAN membership, enabled policy rules with no invalid flags, zero authorized users and zero bypass bindings before the phone test.
- UniFi reports the new open broadcast enabled on VLAN 30 and the original two broadcasts enabled with WPA2/native networks. Direct AP SSH confirms `Mesh` and `KiberaMesh-Lab` in the provisioned radio configuration and an active controller connection.
- Normal public HTTPS and both local boards still pass from the lab computers. Node2 retains both Full OSPF peers, its learned default and no HotSpot.
- A router-originated request from `10.30.0.1` reaches the board through the narrow source-NAT rule, whose counter increments. This checks that application's return path, **not** guest Wi-Fi or captive enforcement.
- Downloaded welcome/config files match their deployment copies by SHA-256. Browser fixture checks pass for capability gates, directory navigation, URL rejection and mobile widths. These do not replace real RouterOS/client testing. A router-originated probe of the internal servlet times out; it supplies no guest welcome acceptance evidence.

Non-secret observations are in `artifacts/mesh-lab/captive-primary-installed-verification.json`, with HP/Node2 transport probe logs alongside it. The next results must come from the customer interface.

## Bounded phone acceptance

**Unpaid service result and browser boundary:** the operator reports the board loads at **10.20.0.10** inside the Wi-Fi welcome popup, but both relay connections are unavailable. A fresh protected desktop browser independently connects to both fixed board WebSocket paths without errors; both backend relays answer metadata requests. Router forwarding counters show accepted board traffic and no drops in its customer forwarding chains during that inspection. The operator then keeps the phone on Mesh with cellular off and opens **http://10.20.0.10:8020/** directly in full Safari: **both relays connect**. This comparison confines the observed failure to this phone's captive popup; the underlying browser restriction was not packet-traced and is not asserted as a universal iOS limitation. No firewall, whitelist, relay configuration or privacy setting was changed to resolve it.

The reported fresh **example.com** failure passes the requested unpaid public HTTPS test; the router's raw customer HTTPS deny counter also increases. Zero authorized sessions and bypass bindings remain. This does not establish all bypass/isolation cases or a paid-session lifecycle.

The local directory now displays the exact validated board address and tells visitors to use Safari or Chrome for conversations. Secure-context clipboard copying is optional; plain HTTP falls back to selecting the visible address with manual Copy instructions. Generic/untrusted/credential-bearing URLs expose no browser address. Browser checks cover that fallback, safe URL gates and mobile widths; the router's downloaded updated `explore.html` matches its deployment copy by SHA-256. The user has not separately accepted the revised directory interaction in the captive popup. The former file is retained at ignored `artifacts/mesh-lab/captive-deploy/explore-before-browser-handoff.html` for file-level rollback.

**Remaining commissioning check:** while unpaid on Mesh in Safari, open **http://10.20.0.1/**. The Mesh welcome or a blocked request is acceptable; a RouterOS/WebFig administrator login is not. This is a bounded check of the known router web UI, not proof of every management port or client-isolation path. This check is pending, deferred during the current welcome/app-selection work; follow with the remaining isolation cases and one guest-specific WAN-loss test when commissioning resumes.

**Initial phone entry, historical checkpoint:** the operator reports that the captive opens automatically at **10.30.0.1**. Authenticated router inspection finds one bound customer lease, **10.30.0.199**, and the same client in `KM-MESH-001` on VLAN **30**, with **zero authorized sessions and zero bypass bindings**. This passes open join/addressing and automatic entry; the subsequent Safari/local/public comparison above closes the next gate. No manual entry was needed for that connection. The checklist below is retained as the commissioning procedure, rather than a request to repeat passed checks.

1. Keep all cables connected. On the iPhone, turn cellular data off and join **Mesh**, without a Wi-Fi password. Keep the normal privacy settings for the first attempt.
2. Confirm an address **10.30.0.xxx** and gateway/DNS **10.30.0.1**. Observe whether the Mesh welcome opens automatically. If it does not, open **http://10.30.0.1/login** in Safari and record that manual entry was needed.
3. Choose **Explore Mesh**, then **Open the board**. The directory and board should load without buying a pass. Use the regular browser for the board; verify its two local relay connections.
4. Try a fresh **https://example.com/** request. It should fail while unpaid; an ordinary HTTP request may redirect to Mesh. Payment and Blink actions should remain unavailable.

Report the welcome/IP result first; stop at the first failure and diagnose DHCP, DNS, redirection or policy before proceeding. No extra outage cycle is needed yet. After entry works, perform a bounded management/isolation check and one guest-specific WAN-loss check. Do not repeat the already-passed relay/media demonstrations.

## Rollback

Disable **only** customer broadcast `e3753c6e-329b-4436-b137-1b8bba1e5d7e` in UniFi (or PUT its retained full broadcast payload with `enabled: false`). Preserve both protected SSIDs. Then import `km-lab-001-remove-captive.rsc` on Primary through its protected management connection. The guarded script removes only this HotSpot/DHCP/policy/VLAN overlay and its board-only NAT, restores the original native bridge filtering/frame policy, and preserves internet gateway and OSPF changes. Retain the now-unused UniFi VLAN record disabled or for later reuse. Recheck protected management, APs, both peers, public HTTPS and local access afterwards. Actual rollback/restoration has not been exercised in this stage.

References: [HotSpot configuration](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal), [bridge VLAN table](https://help.mikrotik.com/docs/spaces/ROS/pages/28606465/Bridge+VLAN+Table), [HotSpot templates](https://help.mikrotik.com/docs/spaces/ROS/pages/87162881/Hotspot+customisation).
