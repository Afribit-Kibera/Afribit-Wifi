# Jami: local foreground text trial

5 October 2026, Africa/Nairobi. The operator chooses Jami after confirming the
unpaid Signal internet exception. Acceptance here requires actual bidirectional
native Jami messaging with the lab WAN disconnected and cellular data off.
Service startup alone does not establish that result.

**Accepted milestone:** after switching both phones to the local UDP bootstrap
and restarting Jami, the operator confirms each fresh message appeared on the
other phone. Both apps remained in the foreground, cellular data was off, and
Primary's `ether1` remained disconnected. A subsequent router inspection
confirmed `ether1` status `no-link` and no IPv4 default route. This establishes
bidirectional offline text on `KiberaMesh-Lab`, not yet delivery across the two
routing nodes or on the open captive `Mesh` SSID.

**Screen-off result:** after the cross-node test instruction, the operator
reports Jami works while actively in the app but not when the screen is off.
The operator subsequently confirms **both iPhone and Android** fail with their
screens off. The Node2 address was not supplied, so do not promote this to
independently verified cross-node routing. This confirms a usability limitation of the current
phone trial. On 6 October the operator confirms calls also worked. Call type,
direction and behavior when locking an already connected call were not supplied;
those details are not separately validated.

Jami's official offline guidance says iOS local connectivity requires the app
in the foreground; notification wake-up depends on Apple's push service.
Android has local DHT/background options, whose screen-off behavior still needs
device-specific verification. A continuously running local bootstrap does not
remove the iOS client suspension limitation. Do not describe the current pilot
as reliable unattended offline phone messaging or incoming-call delivery.

That statement concerns the installed Jami configuration. Apple does support
offline background alerts through Local Push Connectivity in apps with the
required extension and Apple-granted entitlement. See the
[background-delivery options and correction](mesh-background-delivery-options.md).

## Prepared discovery service

Primary's existing Podman runtime now has a separate `kibera-jami-lab` network.
The official OpenDHT Alpine image is pinned to
`sha256:b678a6578605c409f069b5d117e2637d6850d238a602a2443dee311c9532e9de`.
`kibera-jami-bootstrap-001` runs `dhtnode -p 4222 --proxyserver 8043 -s`, explicitly
overriding the image's default public-bootstrap command. A small
`kibera-jami-seed-001` joins only that local container by name. These are two local
DHT processes on one computer, not two independent hosts or a fault-tolerant
community deployment. No public bootstrap, push server, user account or name
lookup service is configured.

The DHT proxy binds Windows loopback at `127.0.0.1:8043`.
[forward-jami-proxy.py](../../scripts/mesh/forward-jami-proxy.py) exposes
`10.20.0.10:8042` only to the protected `10.20.0.0/24` and `10.21.0.0/24` labs by
default; guest exceptions require explicit individual `--allow-client` arguments.
The front door has bounded connections and forwards bytes without logging
account IDs, requests or message content. It is a foreground operator process,
not yet a scheduled service. The existing Python firewall allowance is used;
no Windows or router firewall is changed.

The service's documented root HTTP endpoint returns valid node info, with one
healthy local DHT peer. An SSH probe from the HP at `10.21.0.198` also reached
`http://10.20.0.10:8042/` and returned the same node ID and one local peer.
This verifies proxy reachability across the protected lab networks, not phone
messaging. UniFi remains healthy; existing containers are not
restarted. A direct UDP bind to the Windows lab IP failed because the Podman
runtime is inside WSL. That unstarted container was removed by its exact ID.
At that stage, `10.20.0.10:4222` was not published; the later UDP path below
supersedes that limitation.
The HTTP DHT proxy option and local peer discovery must be checked against the
settings exposed by the installed phone versions. The current proxy is not a
TURN/media relay and does not make blocked peer traffic work automatically.

## Initial phone setup and failed attempt

The operator confirms Jami is installed on both phones and both accounts are
ready. The operator reports the two protected-lab phone addresses as
`10.20.0.197` and `10.20.0.196` (device-to-address mapping not yet confirmed).
The operator confirms the requested local discovery and mobile connectivity
settings are applied on both phones. Contacts were accepted, but the first
offline trial failed: messages remained unsent. Router inspection confirmed
`ether1` had no link, both phone MACs were learned on `ether5`, bridge IP firewall
was disabled and no bridge filter rules existed. The proxy still returned one
healthy local peer. The earlier controller snapshot had client isolation off;
that snapshot is not a fresh observation of the AP settings.

A 12-second header-only capture on `ether5`, filtered to the two phone addresses,
returned no packets. Same-AP unicast may not traverse the router; this does not
prove that peer traffic is blocked. The sniffer was stopped and its settings
restored. No firewall exceptions were added. Next diagnosis checks each app's
DHT proxy mode/address before choosing a local proxy or native DHT path.

## Explicit UDP bootstrap follow-up

The operator reports `bootstrap.jami.net` and `turn.jami.net`, with TURN username
`ring`; these are public endpoints, not the local HTTP proxy configuration.
Public bootstrap cannot be reached while `ether1` is disconnected. This remains
a discovery hypothesis, not proof that it caused the failed message delivery.

Added `kibera-jami-udp-001`, using the same pinned image and separate lab network,
with `dhtnode -p 4222 -b kibera-jami-bootstrap-001:4222 -s`. It joins only the local
DHT. Publishing UDP on Windows loopback produced no replies, so the unsuccessful
container was replaced with a UDP publish on the local WSL interface address,
currently `172.27.149.154:4222`. Existing UniFi/proxy/seed containers were left
running. The temporary OpenDHT probe container was stopped and removed.

[forward-jami-bootstrap.py](../../scripts/mesh/forward-jami-bootstrap.py) now
forwards `10.20.0.10:4222/udp` to that WSL endpoint. It admits only protected
`10.20.0.0/24` and `10.21.0.0/24` sources, bounds mappings to 64 with idle expiry,
and logs only aggregate counters. It is an operator process, not a persistent
deployment; its WSL upstream address must be checked after runtime restart.
No guest firewall or AP isolation policy was changed.

[probe-jami-bootstrap.py](../../scripts/mesh/probe-jami-bootstrap.py) sends an
OpenDHT wire-protocol ping using a random non-account node ID. A probe bound to
Primary's `10.20.0.10` received a valid matching pong from `10.20.0.10:4222`
(50 bytes). The same probe on the HP, bound to `10.21.0.198`, also received a
valid 50-byte pong from `10.20.0.10:4222`, establishing remote protected-lab UDP
reachability. The subsequent phone retry passed as recorded above.

The successful phone configuration uses **Bootstrap `10.20.0.10:4222`**, followed
by an app restart and fresh foreground texts while WAN and cellular remain off. This
UDP endpoint must not be entered as a TURN or HTTP DHT proxy server.

Transport counters advanced to 243 datagrams toward the node and 309 back, with
zero rejected source datagrams. Those counts include probes and DHT maintenance;
they do not identify or independently prove delivery of a particular message.
Recipient-screen confirmation provides the messaging acceptance evidence.

## Next milestone and remaining boundaries

Keep one phone on `KiberaMesh-Lab`; move the other to `KiberaMesh-Node2`. Retain
the same local bootstrap and keep WAN/cellular off. Reopen both Jami apps and
exchange fresh texts each way. Across-node phone delivery remains pending;
the HP UDP probe alone does not establish it. The operator's subsequent report
is that active use works but screen-off delivery fails; avoid repeating broad
connectivity tests. Both platforms are now identified as affected; the next
bounded diagnosis is Android's background-operation/battery settings, with the
iPhone kept active as sender. No Android background pass is recorded yet.

Open-Mesh client discovery and peer traffic need a scoped access policy before
trying the captive SSID. Guest isolation was not globally disabled. The operator
now reports working calls; media sharing, reliable locked-phone delivery,
failure-independent bootstrap nodes and
unattended startup remain unverified or unimplemented. The current local DHT
processes share Primary's physical host and are manually started.

Sources: [Jami offline phone instructions](https://forum.jami.net/t/jami-survival-kit-internet-down-keep-talking/5351),
[LAN configuration and ports](https://docs.jami.net/user/faq.html),
[OpenDHT node](https://github.com/savoirfairelinux/opendht/wiki/Running-a-node-with-dhtnode),
[proxy REST API](https://github.com/savoirfairelinux/opendht/wiki/REST-API).
