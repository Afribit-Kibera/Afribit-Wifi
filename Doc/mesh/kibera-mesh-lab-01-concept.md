# Kibera Mesh Lab 01
## Concept and Initial Implementation Plan

**Status:** Initial two-node routed network operational; community rollout not yet validated
**Goal:** Build and test a small, offline-first, community-network model at home using existing equipment.

---

# 1. Vision

Kibera Mesh is envisioned as a **community-operated local network** that can continue providing useful digital services even when normal internet or mobile connectivity is unavailable.

The long-term goal is to create a network where people can connect to nearby community nodes and access services such as:

- local communication
- educational content
- community information
- emergency communication
- local file sharing
- privacy-focused tools
- locally hosted applications
- optional internet access through one or more gateways

The core principle is:

> **Internet access is a service running on top of the network. It is not the network itself.**

If the external internet connection disappears, local communication and locally hosted services should remain available.

---

# 2. Phase One Objective

The first step is not to build a large network across Kibera.

The first step is to prove the architecture in a controlled environment.

The home lab should answer one question:

> **Can we build a small independent local network where connected users can communicate and access local services even when the internet is disconnected?**

The first milestone is:

> **Connect a phone through the UniFi AP to the MikroTik network, access a local service hosted inside the network, disconnect the home internet, and confirm that the local service remains reachable.**

**Current result, 5 October 2026:** this milestone and the initial two-node network setup pass. Both MikroTiks run OSPF, exchange routes between `10.20.0.0/24` and `10.21.0.0/24`, and have preferred wired transit plus alternate radio transit. Physical cable withdrawal and recovery have demonstrated radio failover and wired failback. Each router serves its own UniFi AP and clients. WAN withdrawal preserves local access. The routers perform networking independently of the experimental portal, Nostr, Blossom and sync processes; those are optional application services used to validate the network.

The scope now returns to the **network foundation**. Existing applications may use its IP connectivity; there is no requirement to build custom communication or media applications to complete this milestone. An application that depends on an external server still needs a working Internet gateway or an independently configured local counterpart. Device/app transport compatibility must be checked rather than assumed. For the network-readiness review and rollout gates, see [network readiness](kibera-mesh-network-readiness.md).

---

# 3. Existing Equipment

Available hardware:

- MikroTik RouterBOARD RB951Ui-2HnD
- Ubiquiti NanoStation loco5AC
- UniFi UAP-AC-M
- Ethernet cables
- adapters and power supplies
- existing home router with internet connectivity
- laptop or desktop computer that can temporarily act as a local server

Additional equipment confirmed on 4 October 2026:

- second MikroTik **RB951Ui-2nD (hAP r2)**, authenticated and secured as `KM-LAB-002`
- second **UniFi UAP-AC-M**, deployed on Node2
- **HP Z240 SFF Workstation running Windows**, verified independent service host/client; replaces the earlier unverified laptop description

This equipment is enough to build the first laboratory environment.

The two-router routed mesh and alternate physical paths are now tested. The UniFi APs provide client access over wired router connections; the MikroTiks' internal radios provide the alternate inter-router transit. UniFi parent/uplink meshing is not required for this topology. A third routing node and another physical path would be needed to evaluate traffic routing around a failed intermediate router, rather than only a failed link between the same two routers.

A future point-to-point wireless backhaul test will require another compatible NanoStation or airMAX device.

---

# 4. Initial Architecture — starting baseline

The historical one-router baseline used the following topology. The current deployed two-router topology is described in [network readiness](kibera-mesh-network-readiness.md).

```text
                    INTERNET
                       |
                 [ Home Router ]
                       |
                optional uplink
                       |
                [ MikroTik RB951 ]
                 Gateway / Router
                       |
            -----------------------
            |                     |
     [ UniFi UAP-AC-M ]     [ Local Server ]
            |
       KiberaMesh-Lab
            |
      phones / laptops
```

The roles of each component are deliberately separated.

---

# 5. Device Roles

## 5.1 MikroTik RB951Ui-2HnD

The MikroTik acts as the **network core**.

Initial responsibilities:

- routing
- DHCP
- firewall
- local subnet management
- internet gateway routing
- client network isolation where needed
- future VLAN experimentation
- future routing between multiple network segments

Conceptually:

```text
Home Router
    |
    |
[MikroTik]
    |
    +---- UniFi AP
    |
    +---- Local Server
    |
    +---- Future Nodes
```

The MikroTik should not host all local applications.

Its primary role is networking.

## 5.2 UniFi UAP-AC-M

The UniFi AP acts as the **community access point**.

Users connect their phones, tablets, and laptops to this device.

Initial SSID:

```text
KiberaMesh-Lab
```

The AP provides normal Wi-Fi access to the local network.

Later, another compatible UniFi AP can be added wirelessly to begin testing actual mesh behaviour.

Example future architecture:

```text
MikroTik
   |
   |
UAP-AC-M #1
    )))
    ))) wireless uplink
    )))
UAP-AC-M #2
    |
 phones / laptops
```

## 5.3 NanoStation loco5AC

The NanoStation should initially be treated as a **future wireless backhaul device**, not as the primary mesh access point.

Its long-term purpose is to connect physically separated clusters.

Example:

```text
BUILDING A                         BUILDING B

Local Network A                   Local Network B
      |                                  |
 NanoStation )))))))))))))))) NanoStation
                wireless link
```

This becomes useful when two community locations are separated by distance but have suitable line-of-sight.

Examples could eventually include:

- community centre to school
- innovation hub to merchant cluster
- rooftop to rooftop
- community node to another neighbourhood node

For now, the existing NanoStation can remain outside the first lab milestone.

---

# 6. Internet Architecture

The home router should be treated as:

> **External Gateway 01**

not as the core network.

Architecture:

```text
             Internet
                |
          Home Router
                |
        External Gateway
                |
            MikroTik
                |
        Kibera Mesh Lab
```

The network must still function locally when this connection disappears.

---

# 7. Mode A: Internet Available

Normal path:

```text
Phone
  |
UniFi
  |
MikroTik
  |
Home Router
  |
Internet
```

Users should be able to access:

- normal internet services
- local services
- local portal
- local communication systems

The internet is simply another reachable destination.

---

# 8. Mode B: Internet Unavailable

The important test is:

```text
MikroTik -----X----- Home Router
```

The expected result is:

```text
Internet          X

Local Wi-Fi       OK
Local portal      OK
Local DNS         OK
Local chat        OK
Education         OK
Local services    OK
```

Phones may lose access to external services such as Google or YouTube.

However, anything hosted inside Kibera Mesh should remain available.

This is the defining behaviour of the project.

---

# 9. Initial Addressing Plan

Keep the first lab simple.

Suggested network:

```text
Network:       10.20.0.0/24
Gateway:       10.20.0.1
```

Suggested devices:

```text
10.20.0.1     MikroTik
10.20.0.2     UniFi AP
10.20.0.10    Local Server
```

Suggested DHCP pool:

```text
10.20.0.100 - 10.20.0.200
```

Later, the architecture may evolve into multiple subnets.

For example:

```text
10.20.0.0/24    Community clients
10.21.0.0/24    Infrastructure
10.22.0.0/24    Local servers
10.23.0.0/24    Node management
```

Do not introduce this complexity during the first experiment.

One subnet is enough initially.

---

# 10. Local Server

The first local server does not need to be a Raspberry Pi.

A laptop can act as the first server.

The server should have a static local address:

```text
10.20.0.10
```

The first service should be extremely simple.

Example:

```text
http://10.20.0.10
```

Initial page:

```text
KIBERA MESH LAB

Network Status: ONLINE

Local Services

[ Community ]
[ Learn ]
[ Chat ]
[ Emergency ]
[ Network Status ]
```

The goal is not to build the final interface.

The goal is to prove that local applications remain accessible without external connectivity.

---

# 11. Local Portal Concept

Eventually the network should have a simple entry page.

Users should not need to understand networking.

They connect to:

```text
KiberaMesh
```

and see something similar to:

```text
--------------------------------
        KIBERA MESH
--------------------------------

Connected locally

Services

[ Chat ]
[ Learn ]
[ Community ]
[ Emergency ]
[ Files ]
[ Network Status ]

Internet:
Available / Unavailable

Nearest Node:
KM-001
--------------------------------
```

The portal becomes the main doorway into the local digital ecosystem.

---

# 12. Conceptual Node Types

The larger network can eventually contain three main classes of nodes.

## 12.1 Community Nodes

These are the nodes normal users connect to.

Purpose:

- Wi-Fi access
- local application access
- nearby services
- communication

Example:

```text
[ Community Node ]
       |
       +---- phones
       +---- laptops
       +---- tablets
```

## 12.2 Backbone Nodes

These move traffic between locations.

They may use:

- point-to-point wireless links
- NanoStations
- fibre
- Ethernet
- other dedicated backhaul

Example:

```text
Community A
     |
Backbone Node
     ))))))))))))))))))
                   Backbone Node
                        |
                   Community B
```

## 12.3 Gateway Nodes

Gateway nodes provide optional external internet access.

Example:

```text
             ISP A
               |
          Gateway Node A
               |
      ---------------------
      |         |         |
    Node      Node      Node
                          |
                     Gateway Node B
                          |
                        ISP B
```

The long-term network should ideally support multiple gateways.

If one gateway fails, the local network should continue operating.

---

# 13. Long-Term Topology

A future community network could look like:

```text
                     INTERNET
                    /        \
              Gateway A    Gateway B
                  |            |
                  |            |
             -----+------------+-----
             |         |            |
            [A]-------[B]----------[C]
             | \       |           / |
             |  \      |          /  |
            [D]--------[E]--------[F]
                        |
                       [G]
```

Each location may provide:

- Wi-Fi access
- local service discovery
- communication
- educational content
- emergency information
- internet where available

Some nodes may also host servers.

---

# 14. First Test Sequence

## Test 01: MikroTik LAN

Goal:

Confirm that the MikroTik provides a working independent local network.

Steps:

1. Power the MikroTik.
2. Connect laptop through Ethernet.
3. Configure local subnet.
4. Enable DHCP.
5. Confirm the laptop receives an address.
6. Ping the MikroTik.
7. Connect a second device if possible.
8. Confirm devices can communicate locally.

Success criteria:

```text
Device A <----> MikroTik <----> Device B
```

without internet access.

## Test 02: UniFi Access Point

Goal:

Allow wireless users onto the local network.

Topology:

```text
Laptop
   |
MikroTik
   |
UniFi
  / \
Phone Laptop
```

Success criteria:

- phone connects to `KiberaMesh-Lab`
- phone receives a local IP
- phone can reach MikroTik
- phone can reach local laptop/server

## Test 03: Local Web Service

Run a simple local web application on the laptop.

Example:

```text
10.20.0.10:8080
```

Test from a phone.

Success criteria:

```text
Phone
  |
UniFi
  |
MikroTik
  |
Laptop Server
```

The page loads successfully.

## Test 04: Internet Gateway

Connect the MikroTik to the home router.

Topology:

```text
Internet
   |
Home Router
   |
MikroTik
   |
UniFi
   |
Phone
```

Confirm both:

- local services work
- external internet works

## Test 05: Internet Failure

Physically unplug the connection between:

```text
Home Router
     X
MikroTik
```

Confirm:

```text
Google             FAIL
YouTube            FAIL

Local Portal       PASS
Local Service      PASS
Local Device Ping  PASS
```

This is the first major proof-of-concept milestone.

---

# 15. Milestone 001

## Three components, one local service, optional internet

Initial components:

```text
MikroTik
UniFi AP
Laptop Server
```

Success definition:

> A user connects through the UniFi AP, receives an address from the MikroTik, accesses a locally hosted application, and continues accessing that application after the external internet connection is physically disconnected.

Once this works, the base architecture exists.

**Verified on 4 October 2026:** Milestone 001 passes. With WAN connected, the operator confirmed external HTTPS and the local named page worked; check code `E6EF6D01DDD6` matches HTTP 200 from phone `10.20.0.199` at 07:47:32 EAT. After physically disconnecting ether1, authenticated inspection confirmed no WAN link/address/default route. Fresh phone code `0176D395F121` matches HTTP 200 at 08:00:45 EAT, and the operator confirmed the fresh external test URL failed. See the [guided runbook and results](kibera-mesh-lab-01-runbook.md).

This establishes local service continuity through WAN loss. Subsequent restart checks also pass for the portal process, AP, router and controller. Fresh phone access continued during a deliberate controller outage (`7397630C94C9`, 09:47:29 EAT), and local dashboard login plus phone access recovered afterwards (`C1B25A6383F2`, 09:57:25 EAT). A further scoped test confirms fresh phone login to the local controller with the existing UI account while its cloud/public connections are blocked, followed by phone portal code `BCB2AA06AD34` at 10:32:00 EAT. The test retained host DNS proxies, and its temporary filter has been removed. The HP Windows laptop also passes the additional-client check: `8A7FFC9E30BA` matches HTTP 200 from `10.20.0.198` at 11:22:35 EAT. A later physical transit-cable failure test proves radio path failover; entirely air-gapped cold startup, backup restoration and service replication remain separate tests; see the runbook for the active checkpoint.

The second MikroTik, `KM-LAB-002`, is secured and now provides LAN `10.21.0.0/24`. OSPFv2 exchanges LAN routes over primary ether4 to node2 ether2, using transit `10.255.20.0/30`; both neighbors show Full. Direct node2 SSH and the server's Ethernet return route are verified. After replacing AP2's unstable cable, its 100 Mbps full-duplex link and pings pass. AP2 is now locally adopted as `KM-LAB-002-AP` at reserved `10.21.0.2`, broadcasting **KiberaMesh-Node2** on the second router's native LAN, with the existing lab password. Both APs are ONLINE; each test SSID is scoped to its own AP. **Fresh phone application access across the two routers passes:** `04ABFDFCF1C4` matches HTTP 200 from AP2's iPhone client `10.21.0.199` at 20:45:32 EAT, preserving its source address. The operator changed Limit IP Address Tracking for this new SSID to obtain that response; privacy-enabled local service access is a separate deployment requirement, and the exact relay failure mechanism was not captured. Local-name access also passes: `76015B12280C`, HTTP 200 from the same phone at 20:53:18 EAT. The missing primary wireless driver is now installed at matching RouterOS 7.20.8 after a backed-up reboot; wired OSPF and a named node2 backend request recover. Fresh phone recovery passes with `E108996389DE`, HTTP 200 at 21:10:12 EAT. A separate internal-radio routed transit uses `10.255.20.4/30`, WPA2/AES and OSPF cost 100, with ten peer pings each way passing. **Physical cable-loss failover passes:** after the operator removes primary ether4 transit, `DA183173CFD0` matches HTTP 200 from phone `10.21.0.199` at 21:24:43 EAT. Both wired ports show no-link, both peer LAN routes select `wlan1`, and radio OSPF remains Full. **Wired-path recovery also passes:** after reconnecting the cable, `D6FCCF857F2D` matches HTTP 200 from the same phone at 21:31:41 EAT. Both cable ports are 100 Mbps full duplex, both routers prefer the wired LAN routes again, and the radio OSPF adjacency remains Full. The spare HP is on node2 at reserved `10.21.0.198`, with Python 3.14.8 reported by the operator. A small identified portal bundle is prepared and its routed download path verified; the active gate is starting that copy on the HP and checking phone access. Service replication remains untested; both routers are still required and the portal currently has one host. Detailed evidence, protected credentials and backups are in the runbook. The planned wireless-uplink milestone below remains unverified.

---

# 16. Milestone 002

## First Wireless Mesh Hop

Required additional hardware:

- one compatible UniFi mesh access point

Topology:

```text
MikroTik
   |
UAP A
  )))
  ))) wireless uplink
  )))
UAP B
   |
Phone
```

Success criteria:

- UAP B has no Ethernet network connection
- UAP B reaches the parent AP wirelessly
- client connected to UAP B reaches local services
- client reaches internet while gateway exists
- client still reaches local services when gateway is removed

---

# 17. Milestone 003

## Point-to-Point Backhaul

Required:

- second compatible NanoStation / airMAX radio

Topology:

```text
Site A                             Site B

Mesh Lab
   |
NanoStation A )))))))))))) NanoStation B
                               |
                          Local Network
```

Test:

- throughput
- latency
- stability
- line-of-sight sensitivity
- outdoor range
- packet loss
- failure recovery

This models how two community clusters could eventually connect.

---

# 18. Future Local Services

Once the network layer is stable, begin adding useful services.

Possible categories:

## Communication

- local messaging
- group chat
- local voice
- announcements

## Education

- offline learning platforms
- Bitcoin education
- cybersecurity education
- technical training
- school content
- local documents

## Community

- events
- emergency notices
- local directory
- community services
- maps
- local marketplace information

## Files

- local file sharing
- community documents
- media distribution
- software packages

## Emergency

- emergency reporting
- incident alerts
- structured disaster telemetry
- radio gateway integration

---

# 19. Emergency Communication Layer

The emergency protocol research should be treated as a later resilience layer.

It should not replace the IP network.

Conceptually:

```text
                     Internet
                        |
                  Community Mesh
                        |
                   Local Gateway
                   /     |      \
                LoRa   JS8Call   Other RF
```

The local network handles normal communication and applications.

Low-bandwidth radio transports provide fallback communication when wider infrastructure is unavailable.

---

# 20. ESP32 and Low-Power Devices

ESP32-based devices may eventually be useful for:

- network health monitoring
- emergency buttons
- low-power terminals
- sensors
- Bluetooth bridging
- LoRa interfaces
- environmental monitoring
- power monitoring
- node status displays

They should not initially be used as the primary community routing infrastructure.

---

# 21. Security Principles

Security must be part of the architecture from the beginning.

Questions the lab should eventually test:

- Can an unknown device join the network?
- Can one client inspect another client's traffic?
- What happens if a node is stolen?
- How are administrator credentials protected?
- How are nodes authenticated?
- How are firmware updates distributed?
- What happens if one node is compromised?
- What information is logged?
- How long are logs retained?
- Who controls the infrastructure?
- How are cryptographic keys rotated?
- Can malicious users flood the network?

A threat model should grow alongside the technical prototype.

---

# 22. Community Operation Principle

A real community network cannot depend permanently on one technical administrator.

The system should eventually allow trusted community operators to:

- install nodes
- replace hardware
- perform basic diagnostics
- restart services
- monitor status
- apply signed updates
- safely extend coverage

A key future test should be:

> Can another person install and join a node using documented instructions without requiring the original developer to configure everything manually?

If not, the network is not yet operationally decentralized.

---

# 23. Hardware Expansion Priorities

Do not purchase large quantities of equipment yet.

Recommended order:

## Priority 1

Use existing:

- MikroTik
- UniFi AP
- laptop
- home router

Build Milestone 001.

## Priority 2

Acquire or borrow:

- second compatible UniFi mesh AP

Build Milestone 002.

## Priority 3

Acquire or borrow:

- second compatible NanoStation

Build Milestone 003.

## Priority 4

Add:

- Raspberry Pi or other low-power Linux server
- UPS / battery backup
- monitoring hardware

## Priority 5

Experiment with:

- ESP32
- LoRa
- emergency radio
- alternative transports

---

# 24. Design Direction

The visual identity should represent a **network of community nodes**, not simply Wi-Fi.

Core concepts:

- local first
- community owned
- open
- resilient
- privacy aware
- educational
- modular
- extensible
- decentralized

The interface should communicate clearly whether a user has:

```text
Local Network: ONLINE
Internet: ONLINE
```

or:

```text
Local Network: ONLINE
Internet: OFFLINE
```

The second state is not a failure.

It is a normal supported operating condition.

---

# 25. Product Principle

The project should never imply:

> "No internet means no network."

Instead:

> "The local network remains useful. Internet access is optional."

That principle should guide:

- infrastructure
- software
- interface design
- user education
- failure testing
- community training

---

# 26. Immediate Next Actions

## Hardware

- identify the correct power supply and PoE injector for every device
- label every device
- label every cable
- record MAC addresses
- record firmware versions
- factory reset lab devices if appropriate
- update firmware before testing

## Network

- configure MikroTik
- create `KiberaMesh-Lab`
- establish `10.20.0.0/24`
- connect UniFi AP
- connect laptop server
- test client connectivity

## Software

- run a minimal local web service
- create a simple local portal
- add network status indicator
- later add local DNS

## Testing

- internet-on test
- internet-off test
- device reboot test
- AP failure test
- router reboot test

## Documentation

Record:

- topology
- configuration
- firmware
- IP addresses
- credentials storage process
- issues
- latency
- throughput
- observed failures
- fixes

---

# 27. First Definition of Done

Kibera Mesh Lab 01 is considered operational when:

- [x] MikroTik creates an independent LAN
- [x] UniFi provides wireless access
- [x] phone receives an IP automatically
- [x] phone reaches the local server
- [x] local portal loads
- [x] external internet works when connected
- [x] external internet can be physically disconnected
- [x] local portal still works without internet
- [x] another local client remains reachable
- [x] architecture is documented
- [ ] configuration can be reproduced

Verified items refer to the 4 October 2026 evidence in the [runbook](kibera-mesh-lab-01-runbook.md), including fresh portal access from the additional HP client. A clean reproduction/recovery exercise remains pending; this broader definition of done is not yet complete.

---

## Latest service-host experiment — 4 October 2026

The spare HP now serves a separate static portal copy at `10.21.0.198:8000`, identified as **KM-LAB-002-HP**. Its request-log screenshot matches phone code **CF02A05BA95C**, source `10.21.0.199`, HTTP 200 at **22:08:36 EAT**. The original portal process has subsequently been stopped: its port refuses connections at **22:18:17 EAT**, while the HP copy still responds successfully at **22:18:19 EAT**. The active gate is a fresh phone request to the HP during this outage, followed by original-service recovery. This tests static-copy availability during service-process loss, with manual selection of the HP address; automatic service failover, data synchronization and whole-node power-loss tolerance remain separate work. See checkpoint 9d in the runbook.

The subsequent outage phone test passes: **5719D1E75C15** matches the HP screenshot's HTTP 200 from `10.21.0.199` at **22:20:57 EAT**, while the original service is stopped. The original portal is then restored as PID **31852**, and both identified service copies return HTTP 200 around **22:26:43 EAT**. The active gate is a fresh phone check of the recovered original named portal, checkpoint 9e. The second static copy preserves manual access during original-service-process loss; automatic service selection and changing-data synchronization remain unimplemented.

# 28. Final Concept

The project should evolve toward this model:

```text
                  OPTIONAL INTERNET
                 /                 \
          Gateway Node         Gateway Node
               |                   |
        --------+-------------------+--------
        |               |                  |
     Community       Community          Community
       Node             Node               Node
        |                |                  |
      Users            Users              Users
        |                |                  |
        +----------------------------------+
                     LOCAL NETWORK
                         |
             -------------------------
             |           |           |
           Chat        Learn      Emergency
             |           |           |
             -------------------------
                         |
                 LOCAL SERVICES

                         |
                 RESILIENCE LAYER
                 /       |        \
              LoRa    JS8Call    Other RF
```

The network is useful every day.

The network survives internet loss.

The network can grow node by node.

The community should eventually be able to operate and extend it.

That is the foundation of Kibera Mesh.
