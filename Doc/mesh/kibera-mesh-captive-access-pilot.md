# Kibera Mesh captive access pilot

Updated: 5 October 2026. Status: **internet gateway, open Mesh phone entry, unpaid local board/two relays in full Safari and public HTTPS denial pass on Primary**. Management/client isolation and guest WAN-loss acceptance remain; payments, vouchers, external free-app exceptions and Node2 customer access below remain planned. [Installed settings and next test](kibera-mesh-open-captive-test.md).

Mesh is a bitcoin-first platform. Retain the implemented BTCPay payment path. Customers can eventually pay in KES through a third-party provider such as Bitika while Mesh receives bitcoin; understanding or owning bitcoin should not be a prerequisite for choosing that provider. A direct M-Pesa adapter is not needed. Bitika has public collection and Lightning-settlement API documentation, and future providers can use the same provider boundary. No provider integration or real payment is enabled by this plan. See [Blink free-app and provider research](blink-free-app-pilot.md).

## Intended experience

Home Ethernet is the lab internet source. A visitor joins an open customer SSID without a Wi-Fi password and receives a local welcome explaining Mesh. The operator's current direction is **welcome and internet purchase**: a real-photo hero, the original woven Mesh mark/Geist typography, visible Bitcoin identity and a prominent internet-pass action. Communication runs in independent apps; the already-tested board is not a customer captive destination.

The network can provide these access categories independently of the welcome layout:

| Choice | Access before payment | Internet required? |
| --- | --- | --- |
| Local apps | Separately approved local communication, media and educational endpoints | No, when those services and their dependencies are hosted locally |
| Free external apps | Operator-approved external service endpoints | Yes; free to the visitor, still consumes the ISP connection |
| Buy internet | General internet after a confirmed payment or valid voucher | Yes |

The welcome should make internet purchase clear and explain honestly when checkout is not yet enabled. Keep a persistent address visitors can reopen in a full browser. Native communication, wallet use and app installation belong outside the captive popup. Popup display and Wi-Fi retention must be verified on real iOS/Android devices, including privacy defaults.

A local welcome page with bundled photo/font assets must remain available during WAN loss. The existing cloud billing application is still cloud-dependent; local access cannot depend on its database, checkout or login being reachable. A local page can link to `wifi.afribit.africa` when WAN is available without claiming to replicate its billing backend.

## Network arrangement

```text
Home ISP router LAN
        |
Primary MikroTik ether1: WAN DHCP, scoped WAN NAT/firewall
        |
   Existing routed OSPF mesh: preferred cable + backup radio
        |
Each MikroTik: its own customer access policy and HotSpot
        |
UniFi AP: open customer SSID -> phone/client
```

Keep OSPF transit, radio security and router/AP management outside the public HotSpot enforcement interfaces. Preserve routed access between nodes; do not introduce transit masquerading. Apply internet NAT only at the WAN egress and advertise the default route conditionally. Withdrawal of WAN/default routing must preserve local routes and local services.

Each router must enforce policy for clients attached to it. The primary router sees routed node2 traffic, not the original node2 client's Ethernet MAC, so the existing MAC-based grant mechanism cannot simply run on the internet gateway for all nodes. Do not put HotSpot on the transit links or solve this by bridging away the existing routed mesh.

Prefer a separate customer SSID/VLAN and subnet per routing node, preserving the current protected commissioning access while piloting. Determine VLAN/subnet assignments after reviewing the actual bridge, UniFi and management configuration. Provide destination-and-port exceptions for approved local services, not a blanket bypass of every local subnet or management interface.

IPv4 HotSpot is the initial enforcement path; prevent unintended IPv6 internet bypass. Review FastTrack and rule ordering so unpaid traffic and rate limits cannot bypass enforcement. Allow paid traffic from node2 through both the node2 policy and primary gateway forwarding policy. Do not use the legacy overlay unchanged: it assumes `bridge1` and `10.5.50.0/24` and includes unscoped source masquerading.

## Existing code and gaps

| Component inspected | Existing behavior | Needed for this pilot |
| --- | --- | --- |
| `mikrotik/hotspot-bv/login.html` | Local page immediately redirects to cloud purchase portal; fixed router identifier | Mesh welcome choices, offline local links, unique per-node context |
| `components/portal-experience.tsx` | Package selection, BTCPay checkout and vouchers | Reliable purchase flow with validated access-router context |
| `app/admin/(protected)/whitelist/actions.ts` | Enabled domains queue a `sync_walled_garden` job | Consistent distribution to all participating access routers and verification of each |
| `gateway-agent/index.ts` | One configured router; grants bypass bindings, speed queues and web hostname exceptions | Per-router job ownership, scoped local/IP/port rules and dependable expiration |
| `lib/access.ts` and gateway job claim API | Grants carry client MAC/IP; queue claim is not filtered by router | Trusted node identity, router-targeted grant/revoke jobs and independently scoped agent credentials |
| `app/api/payments/route.ts` | Implemented BTCPay invoice path, retained for bitcoin settlement | Optional Bitika / future provider adapters for customer payment choice, verified bitcoin settlement, idempotent grants and reconciliation; no direct M-Pesa adapter required |

Running two agents against the current shared queue could send a grant or free-site update to the wrong router. Add router targeting before enabling billing across both nodes. Browser-provided `routerId`/MAC alone is not trusted authorization context; validate it against the access router and bind it to a short-lived session. Cross-node paid-session continuity needs explicit identity and authorization design; a randomized MAC is not a person or a stable roaming identity.

Current expiration is queued when an agent polls the cloud. A dropped cloud connection could leave a bypass binding beyond its purchased duration. Plan router-enforced session expiry or a durable local expiry mechanism before paid operation; data caps and reliable accounting also need enforcement, not just database fields. Free traffic must not consume a paid quota if that is the advertised policy. A single per-client simple queue currently limits all matched traffic and does not distinguish these categories.

## What whitelisting means

A router permits destinations and protocols, not the intention of an app. An educational app or wallet can contact API, login, file, notification and payment hosts; approve only measured dependencies. HTTPS/shared CDN destinations can make exceptions broader than intended, and QUIC or non-web protocols need explicit consideration. Avoid broad CDN/proxy/VPN exceptions and unlimited bootstrap grants. Define a free-service bandwidth budget and validate both functionality and unintended access.

Keep public services separate from management ports. Opening the customer SSID must not remove WPA2 from the router-to-router backhaul. Open Wi-Fi does not supply link encryption; use HTTPS/WSS for supported service endpoints and test optional OWE compatibility separately rather than assuming every phone supports it.

## Communication applications

Bitchat documents Bluetooth mesh plus Nostr relay transport. Android additionally documents Wi-Fi Aware, a device-to-device transport; this is not evidence of routing Bitchat's nearby mesh through these UniFi/MikroTik LANs. Stock iPhone Bitchat is not yet validated against our local relay endpoints. Our lab relays currently accept a limited set of event kinds and must not be called Bitchat-compatible without checking its kinds, endpoint selection and encryption envelopes. Its documented private Nostr envelopes are app-specific rather than general NIP-17 interoperability.

For an existing browser-accessible chat candidate, evaluate **XMPP with Prosody and Converse**: rooms and messaging can run on local IP services, Converse can be hosted locally, and XMPP server federation can occur across the mesh. This is a candidate, not a deployed service or a serverless/Bluetooth equivalent. Validate registration, TLS, mobile background behavior, storage and per-client encryption capabilities before promising them. The current Nostr boards remain optional evidence; no additional custom chat development is required to commission captive access.

Primary references:

- [MikroTik HotSpot: IPv4 enforcement, walled garden, IP rules and captive advertisement](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal)
- [Bitchat iOS transport and private-envelope documentation](https://github.com/permissionlesstech/bitchat)
- [Bitchat Android and Wi-Fi Aware transport](https://github.com/permissionlesstech/bitchat-android)
- [Converse XMPP client](https://conversejs.org/)
- [Prosody WebSockets](https://prosody.im/doc/websocket)
- [Prosody federation](https://prosody.im/doc/s2s)

## Next commissioning sequence

The mobile-first Mesh welcome and purchase experience are built and reviewed locally; the operator has resumed commissioning. Steps 1–2 below pass. Step 3 is installed on Primary with one local board exception and no external app exception yet; real customer-device acceptance is next. The rest of the sequence remains pending.

1. Read and back up current router/firewall/bridge/OSPF and UniFi configuration. Prepare a reviewed lab overlay and rollback, preserving management access.
2. Connect home Ethernet to primary ether1 when the operator is ready. Commission WAN DHCP, WAN-only NAT, forwarding and conditional default advertisement. Verify internet from both protected lab LANs and retain local operation on WAN loss; use one bounded acceptance pass.
3. Add the isolated open customer network on the first AP/router, a local welcome page, narrowly allowed local services and one small external free-site catalogue. Verify unpaid service access, blocked general internet, private management isolation and captive/full-browser behavior.
4. Commission a targeted gateway agent and voucher authorization on this one access node first. Verify grant, speed, expiry and revocation; no production billing jobs should be consumed by a lab agent.
5. Implement and verify multi-router job/session ownership before extending the captive policy to node2. Test unpaid policy and paid authorization on each node without disturbing OSPF failover.
6. Validate the retained BTCPay paid flow and accounting before migrating the operating pilot. Add optional Bitika and future provider adapters later: a customer can pay through the provider without needing to understand bitcoin, while Mesh grants access only after verified bitcoin settlement. Keep the existing paid router available until replacement acceptance passes.

The lab now has an internet gateway and Primary's isolated open HotSpot/SSID. The operating paid pilot remains unchanged, and no real payment or provider adapter is commissioned. The current network-readiness result remains valid; guest captive acceptance and then billing/free-app policy are the next milestones. The customer-to-board source-NAT exception is limited to one application and does not masquerade inter-node transit; see the [installed overlay and rollback](kibera-mesh-open-captive-test.md).
