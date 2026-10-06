# Kibera Mesh: network readiness

Read-only review, 5 October 2026, Africa/Nairobi. This note addresses the network infrastructure; application development is a separate workstream.

**Current commissioning state:** both protected lab networks pass public HTTPS and local phone access, and the single Primary WAN unplug/reconnect test passes withdrawal, local continuity and internet recovery. Primary now also broadcasts open **Mesh** on isolated VLAN 30 with a local captive welcome and one local board exception. Open phone entry, unpaid board/two relays in full Safari and public HTTPS denial pass; guest isolation/offline acceptance remains. The relay connections fail in this phone's captive popup, so the directory provides browser handoff instructions. Payments, vouchers and Blink remain disabled. Earlier disconnected/pending observations below are historical. [Gateway results](kibera-mesh-internet-gateway-test.md) and [current customer test](kibera-mesh-open-captive-test.md).

**Later commissioning update, 5 October:** gateway overlays are now installed on both routers. Protected lab internet forwarding uses both transits, Primary's existing WAN-only NAT and conditional default origination. Ether1 remains disconnected; neither router has a default route. Internet client acceptance and customer captive/free/paid enforcement remain pending. The [gateway test procedure](kibera-mesh-internet-gateway-test.md) records the new state; initial routing evidence remains valid.

**Subsequent WAN connection:** Primary obtains `192.168.100.77/24` with a default via `192.168.100.1`; Node2 learns an OSPF default through its wired transit. Public HTTPS and local access pass from both lab computers, including HP with home Ethernet disconnected. Both OSPF adjacencies remain Full. Phone checks, WAN withdrawal/recovery and customer free/paid policy acceptance remain pending; the earlier disconnected state above is historical.

**Phone acceptance:** the operator reports public HTTPS and each local board working on both protected SSIDs after the requested cellular-off checks. The two-node internet client gate passes. WAN default withdrawal/recovery and customer captive/free/paid enforcement remain pending.

**WAN-loss acceptance:** removal of only Primary ether1 withdraws both internet defaults. Both peer-LAN routes and wired/radio OSPF adjacencies remain established; local board requests pass in both directions while HP public HTTPS fails with DNS bypassed. Operator phone behavior matches the expected local-success/public-failure result. Recovery after reconnection remains pending; no router, AP or service host was shut down.

## Decision

**The initial two-node routed network is set up and working.** Each MikroTik serves its own client subnet through its UniFi AP. OSPF exchanges routes over two transit links, prefers Ethernet and switches to radio when the Ethernet link fails. Existing compatible applications can use this IP connectivity without a new communication or media application being built for every test.

This is a two-node laboratory foundation with a verified home internet gateway. It does not yet demonstrate three-node multi-hop routing, resilience to loss of an intermediate router, field coverage or production capacity. Two parallel links between the same routers provide link redundancy; they cannot bypass either router when that router is absent.

## Evidence

| Item | Evidence and scope |
| --- | --- |
| Client access | Primary LAN `10.20.0.0/24`, Node2 LAN `10.21.0.0/24`, separately served by the two APs; phone-to-service access across nodes passed |
| Live route exchange | Authenticated Node2 inspection on 5 October: both OSPF neighbours, `10.255.20.1` over cable and `10.255.20.5` over radio, are **Full** |
| Current selected route | Node2 learns `10.20.0.0/24` through OSPF via `10.255.20.1%ether2`; wired cost 10, radio cost 100 |
| Live physical links | Ethernet transit is 100 Mbps full duplex; radio is associated with WPA2/AES and reports 99%/100% TX/RX CCQ in this nearby indoor setup |
| Link failure recovery | The runbook records physical cable removal, peer-subnet route selection through radio, continued phone access and wired preference after reconnection |
| Independence from WAN | Node2 has no IPv4 default route and OSPF `originate-default=never`; the runbook records disconnected lab operation |
| Application demonstrations | Independent service hosts, retained posts/media and recovery demonstrate that applications can use the transport; they do not add routing nodes |

The live radio rates and quality above are interface observations, not measured application throughput or outdoor range guarantees. This review authenticated directly to Node2; Primary-side failover evidence comes from the existing runbook rather than a new Primary login or failure test.

## Infrastructure and applications

The MikroTiks route IP packets; the APs provide nearby Wi-Fi access. Phones are normally clients of this infrastructure. Computers are needed only for services that the community chooses to host, not to make each resident a routing node. The current router-to-router radio link uses an AP/station arrangement with routed OSPF transits; this is not proof of arbitrary radio-peer discovery or an 802.11s deployment.

Applications are a higher layer in the architectural sense. They are not Ethernet Layer 2. An existing application works locally only when it supports reachable local endpoints and its required authentication, discovery and data services are available. Cloud-only platforms still need an Internet gateway. Link-local multicast discovery does not automatically traverse routed subnets. An application's own Bluetooth or other radio mesh is a separate transport unless it explicitly interoperates with this IP network.

## Next network priorities

1. **Prepare a repeatable node configuration.** Allocate unique LANs, router IDs and transit addresses; document peering, AP/client settings, management access, backups and recovery. Replace two-subnet-specific forwarding rules with a reviewed policy for the intended topology before adding peers. Retire the retained commissioning alias when a safe replacement management path is confirmed.
2. **Add a third routing site and another independent path.** First establish A–B–C multi-hop connectivity; an A–C path or equivalent topology is needed to test rerouting around an intermediate node's loss. Plan compatible radios and placements before buying hardware. No third routing device is commissioned in this lab yet.
3. **Complete customer captive acceptance.** The home internet gateway, both protected client networks and WAN withdrawal/recovery pass. Primary's isolated open Mesh network is installed; verify phone welcome, unpaid local services and blocked internet/management next. Billing and measured external app exceptions follow separately. Internal node-to-node traffic remains routed without new NAT; the one customer-to-board NAT exception is documented in the [customer test](kibera-mesh-open-captive-test.md).
4. **Measure deployment conditions.** Record throughput, loss and recovery time under simultaneous clients at realistic distances, then check RF channel planning, power budget/backup and unattended whole-network startup. Current close-range radio measurements cannot establish Kibera site coverage.
5. **Complete operations and security before community deployment.** Review router/AP credentials and management transport, routing-peer admission/authentication, subscriber isolation/access policy, configuration recovery, service-independent monitoring and responsibility for each site. Node2 currently retains restricted HTTP management and a commissioning address; production readiness is not implied by the lab result.

No more media features or repeated page check codes are needed to accept the initial network foundation. The [runbook](kibera-mesh-lab-01-runbook.md) retains the detailed historical checks and service demonstrations.
