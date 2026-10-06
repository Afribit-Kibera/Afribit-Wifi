# Mesh: original goal, current network and optional LoRa

Architecture review, 6 October 2026. This is a direction checkpoint, not a
configuration change or a field deployment approval.

## What we originally intended

The [original concept](kibera-mesh-lab-01-concept.md) defines a community-operated
local network with optional internet. Its section 19 already places LoRa and
other low-bandwidth radio transports alongside the IP network as a later
resilience layer. Section 22 requires other community operators to be able to
install and maintain nodes: operational decentralization remains a goal.

The work so far follows that architecture. However, paid-internet commissioning
has taken more time than expanding the underlying routing topology. A working
hotspot and a working payment system do not establish a resilient community
mesh by themselves.

## What exists today

| Requirement | Evidence and remaining scope |
| --- | --- |
| Connect ordinary phones without buying another radio | Two UniFi APs serve the two routed lab networks; Primary also offers the open Mesh customer SSID |
| Local network survives internet loss | WAN withdrawal preserved local services and inter-router routes |
| Alternate route after a link fails | OSPF uses Ethernet first and the MikroTik radio transit after cable loss |
| Route around a failed intermediate router | Not demonstrated: there are two routers and two links between them, with no third routing site or independent path around either router |
| Services live at more than one location | Separate hosts and local relay/media experiments exist; availability and replication are service-specific |
| Offline communication | Jami texts and calls worked in the foreground on the protected lab; screen-off delivery failed on both phones. Unpaid guest access needs its own commissioning |
| Optional paid internet | The enrolled Primary lab gateway demonstrated verified payment, Bitcoin settlement and automatic access; wider deployment remains gated |
| Independent community operation and multiple paid gateways | Not commissioned; current billing enrollment is specifically KM-LAB-001 |

This is an initial routed IP network with link redundancy. It is neither a
LoRa network nor a demonstrated arbitrary-peer 802.11s network. Its routing
can continue locally without the public checkout site. New online purchases
currently depend on cloud services and a working WAN.

See [network evidence](kibera-mesh-network-readiness.md),
[current production verdict](3west-production-readiness.md) and
[operations guide](mesh-production-operations.md). Older network-readiness
payment observations are historical; the production verdict records later work.

## Where LoRa fits

| Transport | Intended job | User connection |
| --- | --- | --- |
| Existing Wi-Fi / Ethernet / routed radio backbone | Local applications, files, voice and optional internet | Ordinary phone or computer over Wi-Fi |
| Optional Meshtastic LoRa network | Short messages and limited telemetry beyond Wi-Fi coverage | Compatible LoRa device, commonly paired to a phone over Bluetooth |

Meshtastic is a separate mesh protocol using LoRa radios. Ordinary phones do
not gain LoRa reception from an app installation. Its documented radio/client
connection supports one user at a time; a few rooftop nodes do not automatically
give every resident independent phone access. A shared kiosk or many-user
Wi-Fi-to-LoRa service would require a separately designed application bridge.
[Meshtastic introduction](https://meshtastic.org/docs/introduction/).

Our existing routers and APs have no LoRa transceiver installed. Their IP
connectivity can carry a compatible Meshtastic gateway's MQTT traffic, but that
does not convert their radios or their routing protocol into Meshtastic.
MQTT can link radio networks through a broker. A broker can be local; reaching
an outside broker requires internet. It does not provide ordinary web access
over LoRa or automatic interoperability with Signal, Jami or other messengers.
[MQTT configuration](https://meshtastic.org/docs/configuration/module/mqtt/).

LoRaWAN is another protocol using LoRa, with gateways forwarding end-device
traffic to a network server in a star-of-stars architecture. The server can
be hosted locally: centralized topology does not inherently mean a cloud
dependency. It is not a substitute for a Meshtastic messaging mesh.
[LoRa Alliance architecture](https://lora-alliance.org/about-lorawan-old/).
MikroTik's plain [KNOT](https://mikrotik.com/product/knot) is not interchangeable
with its [KNOT LR8G kit](https://manual.mikrotik.com/hardware/knot-lr8g-kit/),
which includes a LoRa card. Exact hardware and protocol support matter.

## Corrections to the shared proposal

- **Kenya frequency selection:** an 868 MHz label alone is insufficient. CA's
  published SRD guidelines specify individual sub-bands and radiated-power,
  access and duty-cycle conditions. For example, 869.4–869.65 MHz is listed at
  500 mW ERP with at most 10% duty cycle or LBT+AFA. Meshtastic's EU_868 profile
  uses this sub-band and enforces its duty-cycle limit. This supports examining
  that profile, not blanket approval for arbitrary 863–870 MHz settings,
  high-power repeaters or any antenna. Check the exact device and installation
  against the applicable CA requirements before procurement/deployment.
  [CA guidelines, Table 6](https://www.ca.go.ke/sites/default/files/2023-05/Guidelines-on-the-Use-of-Radiofrequency-Spectrum-by-Short-Range-Devices-2022.pdf),
  [Meshtastic region settings](https://meshtastic.org/docs/configuration/radio/lora/).
- **Privacy:** the default Meshtastic channel has a publicly known key.
  Private group keys and modern authenticated direct messages need deliberate
  configuration; MQTT encryption is a separate setting. Do not present a
  default public channel as private communication.
  [Encryption guidance](https://meshtastic.org/docs/overview/encryption/).
- **Range and capacity:** kilometer and Wi-Fi-distance claims are not Kibera
  coverage measurements. Terrain, buildings, placement, interference, airtime
  and traffic matter. More repeating nodes do not create unlimited capacity.
- **Everyday availability:** a radio receiving while a phone sleeps is distinct
  from the phone showing an immediate notification. Meshtastic does not by
  itself establish that our Android/iPhone screen-off requirement passes.
- **Cost and emergency use:** the supplied KES figures are unverified estimates.
  Free-to-use messaging still needs hardware, power and maintenance; a delivery
  demonstration is not a guaranteed emergency-alert service.

## Direction and next meaningful proof

Keep the IP network as the primary community infrastructure. It matches the
requirement that residents use existing phones for local applications and
optional paid internet. LoRa is an optional complementary communication lane.

The next network-topology milestone is a third routing site: first demonstrate
A–B–C communication, then provide an A–C alternative and show communication
between A and C survives removal of B. Use unique addressing and admitted
routing peers. That proves a different failure mode from the already accepted
two-router cable-loss test; it requires additional compatible routing hardware.

Continue the bounded production gates separately, especially guest isolation,
unpaid local-service policy, exact plan semantics and serving-router enrollment.
Fixing offline background delivery is an application/platform milestone and
must not be declared solved by changing backbone radios.

If LoRa is pursued, start with two compatible devices to prove WAN-independent
radio messaging, then a third with an arranged path to prove actual relaying.
Measure locked-screen behavior and delivery under load before promising it to
residents. Do not replace the existing IP backbone or buy a community-wide
fleet on the strength of the shared proposal alone.
