# Berty local communication trial

6 October 2026. The operator confirms Berty is installed and opens on both the
Android phone and iPhone. Contact pairing and WAN-connected foreground delivery
work after enabling iPhone Multipeer Connectivity/Bluetooth and Android Bluetooth
Low Energy/Android Nearby. Turning off Wi-Fi on both phones stops delivery even
with Bluetooth left on. With lab Wi-Fi restored, WAN disconnected and cellular
data off, fresh messages arrived in both directions. This establishes offline
foreground delivery; Bluetooth-off and cross-node operation remain separate.

This trial evaluates native communication independently of the captive portal.
Use nonsensitive test messages: Berty's own repository says the app is still
under development and not hardened for sensitive use.
[Official source and status](https://github.com/berty/berty).

## First milestone

Use the protected **KiberaMesh-Lab** SSID on both phones. Keep Primary ether1
connected during installation and contact pairing. Turn cellular data off,
allow the app's Bluetooth/local-network permissions, exchange its contact
invitation or QR code, accept, and send one message each way with both apps open.
This is a setup baseline; WAN-connected success does not prove offline delivery.

After pairing succeeds, briefly disconnect Primary ether1 while keeping this
computer on home Wi-Fi. Send fresh messages each way with cellular still off.
Then turn Bluetooth off in each phone's Settings, leave Wi-Fi on and repeat with
new messages. Bluetooth-only delivery is useful but does not establish use of
our Wi-Fi backbone. Record app/OS versions, actual phone Wi-Fi addresses and
observed recipient delivery, rather than only the sender's status.

Only after this milestone, test screen-off delivery and a phone on each node.
Same-subnet discovery does not prove discovery across routed subnets. A failed
trial is not a reason to remove customer or management isolation globally.

## Results

| Check | Result |
| --- | --- |
| Installed/open on Android and iPhone | Operator confirmed |
| Contacts paired; WAN-connected foreground texts | Operator confirmed after enabling proximity transports |
| Wi-Fi radio off; cellular off; proximity enabled | Neither direction delivered |
| WAN absent; cellular off; foreground texts each way | Operator confirmed both receiving phones saw fresh messages |
| Wi-Fi only, Bluetooth off; fresh texts each way | Pending |
| Screen-off delivery and recovery | Pending |
| Across separate routing nodes | Pending |

No Berty customer firewall exception, daemon, paid pass or account migration has
been installed for this trial. Keep WAN connected while the separate HTTPS
checkout commissioning is in progress; coordinate the short offline step after
that cutover. [Communication architecture](mesh-communications-app-research.md).
