# Mesh internet gateway: commissioning test

Updated: 5 October 2026, Africa/Nairobi. Status: **internet/local client acceptance, WAN loss and recovery pass**. First open customer captive is installed; [phone acceptance is next](kibera-mesh-open-captive-test.md).

The two-node mesh, local access and cable/radio routing recovery already passed. The next milestone is internet from both protected lab networks through the home's Ethernet source. Public customer Wi-Fi, HotSpot and free/paid policies follow this milestone.

## Installed configuration and evidence

Primary has five new forwarding rules: block private upstream destinations from both lab LANs on ether1, allow Node2 internet traffic and established replies over either transit. OSPF default origination changes from `never` to `if-installed`. Node2 has four new rules permitting client internet forwarding and replies over cable or radio; its default origination remains `never`.

Primary retains its enabled ether1 DHCP client, upstream DNS learning and existing WAN-only masquerade. No new inter-node NAT is added. Original firewall rules, management restrictions, bridges, addresses and local DNS configuration are preserved. This grants general IPv4 internet to **protected lab LANs**; it does not implement subscriber billing or free-app policy.

Guarded install and removal files are in `mikrotik/kibera-mesh-lab-01-internet-gateway.rsc`, `kibera-mesh-lab-02-internet-transit.rsc` and their `remove-internet-*` companions. They check the specific router identity/serial and configuration. Installation deliberately rejects a second import. RouterOS `verbose=yes dry-run` validates all four files before installation; it does not prove runtime behavior. [MikroTik import documentation](https://help.mikrotik.com/docs/spaces/ROS/pages/47579229/Scripting).

Both routers' exports and encrypted binary backups were downloaded before staging to ignored, operator/SYSTEM-only `artifacts/mesh-lab/private/gateway-20261005/`. Staged exports remain there. Non-secret comparisons and backup checksums are in `artifacts/mesh-lab/internet-gateway-staged-verification.json`.

Settled authenticated inspection confirms nine enabled new rules with no invalid flags, two Full OSPF neighbors on each router, primary ether1 no-link and no IPv4 default route on either router. Primary and HP boards return HTTP 200 over lab Ethernet; source-bound home Wi-Fi HTTPS returns 200. These are staging checks, **not passed internet client tests**.

## Connected gateway result

The operator connects home Ethernet to Primary ether1. It negotiates **100 Mbps full duplex**, receives DHCP **192.168.100.77/24**, and installs an active default via **192.168.100.1**. Upstream DNS is **1.1.1.1 / 1.0.0.1**. Node2 learns an active OSPF default through **10.255.20.1%ether2**. Cable/radio adjacencies remain Full on both routers; Primary still has no IPv6 default.

Source-bound, proxy-bypassing HTTPS to `https://example.com/` returns 200 from Primary's computer at **10.20.0.10** and HP at **10.21.0.198**. HP's home Ethernet is Disconnected and its sole IPv4 default is Node2 **10.21.0.1**, establishing its lab path. Final probes use normal DNS and certificate checks. Primary and HP boards retain HTTP 200 across the mesh.

HP's first HTTPS request times out. Explicit router DNS works, and a fixed-DNS TLS connection reaches the server but subsequently times out. A best-effort revocation diagnostic succeeds; the subsequent ordinary DNS/TLS request also succeeds. The exact temporary failure cause is not established. No persistent DNS, Tailscale or certificate policy is changed.

One HP probe of the home router's port 80 times out. The private-upstream drop counter is inspected separately. A home-Wi-Fi control finds port 80 refusing connections, so this does not demonstrate isolation of a serving home web UI. The forwarding rule remains the isolation control. No home subnet scan is performed. Evidence is retained at `artifacts/mesh-lab/internet-gateway-connected-verification.json` and the listed SSH probe logs.

**Phone acceptance passed:** the operator reports “All working” after the requested cellular-off checks: `https://example.com/` and `http://10.21.0.198:8020/` on `KiberaMesh-Node2`, then public HTTPS and `http://10.20.0.10:8020/` on `KiberaMesh-Lab`. This closes the two-node client internet/local-access gate. Before the next physical test, live inspection confirms Primary ether1 remains up, both default routes are active, and both wired/radio OSPF neighbors remain Full.

**WAN-loss test passed:** after unplugging only Primary ether1, the operator reports the expected phone result: local board loads and the uncached public request fails. Authenticated inspection confirms ether1 no-link, DHCP stopped and no IPv4 default route on either router. Peer LAN routes remain active over OSPF, with cable/radio neighbors still Full. Source-bound board requests pass in both directions between the computers; HP's public HTTPS request times out even with DNS bypassed, while the operator's separate home Wi-Fi HTTPS succeeds. Route-withdrawal latency was not measured. Evidence: `artifacts/mesh-lab/internet-gateway-wan-loss-verification.json`.

**Recovery passed:** after the operator reconnects the same cable to Primary ether1, its DHCP/default route and Node2's OSPF default recover. Both routers retain Full cable/radio peers; ordinary DNS/TLS HTTPS and cross-node local boards return 200 from both computers. Evidence: `artifacts/mesh-lab/internet-gateway-recovered-verification.json`, `internet-node2-recovered.jsonl` and `internet-hp-recovered.jsonl`. This closes the bounded gateway milestone. Continue with the [first customer captive test](kibera-mesh-open-captive-test.md).

## Cabling to retain

Keep a **LAN port on the home internet router connected to primary MikroTik ether1**. Keep the computer on home Wi-Fi and its Ethernet on primary ether2. Keep both APs on their respective ether5 ports and the inter-router cable on primary ether4 → Node2 ether2. Preserve the existing radio transit.

## Bounded acceptance sequence

1. **Addressing/routes:** inspect primary WAN link, DHCP lease, default route, upstream DNS and router-originated public HTTPS. Node2 must learn an OSPF default towards Primary while both LAN routes and management remain usable.
2. **Real clients:** with phone cellular off, test `https://example.com/` and a local board on `KiberaMesh-Lab`, then `KiberaMesh-Node2`. Confirm SSID/IP. An HP source-bound HTTPS probe provides independent Node2 evidence. Use a fresh request; no repeated page-code loop is needed.
3. **Home isolation:** a bounded probe of the known home router's web port from a lab client must be blocked, with the new drop counter inspected. Local mesh services must still work. Do not scan the home network.
4. **One WAN-loss check:** unplug only primary ether1 after internet passes. Confirm withdrawal of both routers' internet defaults, retained local access and failed external access with cellular off. Keep operator home Wi-Fi connected. Reconnect ether1 and confirm recovery once.

Stop at the first failure and diagnose its exact symptom before requesting another physical change. Already-passed media, relay and transit-failure demonstrations do not need repeating.

`if-installed` ties advertisement to an installed default route. It does **not** detect an ISP outage while the home router continues offering a DHCP gateway. End-to-end upstream health and multiple gateways remain later work. [MikroTik OSPF reference](https://help.mikrotik.com/docs/spaces/ROS/pages/331612216/routing+ospf).

## Customer-access queue after the gateway

| Test | Acceptance |
| --- | --- |
| Isolated open SSID and captive | Password-free join, DHCP and Mesh welcome in captive windows/full browsers; local welcome retained without WAN |
| Unpaid policy | Approved local services work; arbitrary internet, protected LANs and management are blocked; IPv6/alternate DNS cannot bypass enforcement |
| Blink free app | Actual installed wallet's website/auth/API/WebSocket dependencies pass without payment; unrelated sites remain blocked; availability flag stays off until verified |
| Bitcoin pass or voucher | Trusted grant targets the exact client/access router; failed/pending payment grants no access |
| Session lifecycle | Speed, duration, expiry, revoke and reconnect pass; FastTrack is disabled/exempted as required by HotSpot/queues |
| Second access node | Router identity, job ownership and grant isolation pass before enabling Node2 paid access |

The local welcome and isolated open SSID are now enabled on **Primary only**, with one local service exception and public customer internet denied. Phone entry, isolation/bypass, guest offline availability and paid/free-app acceptance remain separate gates. Direct M-Pesa integration is not a prerequisite. Coverage/capacity, combined power recovery and a third routing site follow customer commissioning. See the [current open captive test](kibera-mesh-open-captive-test.md), [captive pilot](kibera-mesh-captive-access-pilot.md), [welcome deployment](mesh-captive-shell.md) and [Blink pilot](blink-free-app-pilot.md).

## Rollback

Unplug primary ether1 first. Import the matching removal file on Primary, then Node2, using the retained management connection. Primary default origination returns to `never`; only `kibera-mesh-lab:internet:`-tagged rules/address-list entries are removed. Existing DHCP/NAT remain, so unplugging WAN returns Primary itself to offline operation. Verify Full peers, local access and absent defaults afterwards. Removal syntax was validated; actual removal/reinstallation or binary-backup restoration was not performed for this stage.
