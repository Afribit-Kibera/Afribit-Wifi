# Mesh: one free messaging-app trial

5 October 2026, Africa/Nairobi. Use the existing Signal Android and iPhone apps.
This is one foreground text-message trial, not a claim of offline Signal or full
app functionality. Existing accounts avoid registration and app-store dependencies.

**Acceptance passed:** after the messaging-endpoint update, the operator confirms
messages work in both directions and other internet usage remains blocked. Both
reported phones are on unpaid Mesh (`10.30.0.197`, `10.30.0.195`). This is a
successful free internet-app exception. It does not prove messaging with the WAN
disconnected; Signal still depends on external servers. Next milestone is a
native local communication app, with an actual WAN withdrawal.

Primary's `Mesh` customer VLAN has scoped TCP 443 exceptions for the Signal
messaging, storage, CDN and contact-service names from
[official Android endpoint configuration](https://github.com/signalapp/Signal-Android/blob/main/app/build.gradle.kts).
The list is `KM-MESH-SIGNAL-TEXT`; it also includes the current
`grpc.chat.signal.org` messaging endpoint from
[libsignal's production configuration](https://github.com/signalapp/libsignal/blob/main/rust/net/src/env.rs).
The HotSpot walled garden and the existing
customer RAW/outbound/return filters all carry `mesh:signal:text-*` markers.
Private-destination denial and the general unpaid-internet denies remain ahead
of or after the appropriate exceptions. No customer IP binding bypass is added.
DNS-resolved CDN IPs can be shared by other services, so this is not strict
application isolation. Calls, background notifications, registration and media
are separate milestones. No broad UDP exception is installed.

[Install script](../../mikrotik/kibera-mesh-signal-text-trial.rsc) is identity/serial
guarded, syntax-checked and installed on Primary at 21:21 EAT. Inspection confirms
eight walled-garden entries, resolved messaging-service IPv4 addresses and valid
RAW/outbound/return exceptions in their expected positions. A pre-change export is retained privately
as `artifacts/mesh-lab/private/automatic-setup/primary-before-signal.rsc`.
[Scoped removal](../../mikrotik/kibera-mesh-remove-signal-text-trial.rsc) removes
only this trial. The historical pending checks below are superseded by the
operator's acceptance above; installed rules alone did not prove delivery.

**First phone attempt:** the operator reports unsent messages. Both reported
addresses (`10.30.0.197`, `10.30.0.195`) are observed as unauthorized HotSpot
clients; active sessions are zero. Initial trial counters show 74 outgoing and
85 return packets, but delivery is not established. A ten-second metadata-only
trace is stopped and sniffer settings restored. Current libsignal source reveals
that the original eight-name list omitted `grpc.chat.signal.org`. The scoped
[update](../../mikrotik/kibera-mesh-signal-chat-update.rsc) passes RouterOS dry-run
and is installed at **21:46:29 EAT**. Its DNS-resolved addresses match the official
production fallbacks `76.223.66.180` and `15.197.251.99`; the ninth TCP443 garden
entry is valid. No UDP or general internet exception is introduced. A retry after
reopening Signal is pending; the omission is a confirmed policy gap, not yet a
confirmed cause of the reported failure.

After the update, router inspection observes established TCP443 connections from
`10.30.0.197` to `76.223.66.180` and CDN2, with trial counters increasing to 190
outgoing and 199 return packets. HotSpot active sessions remain zero. This proves
that phone can now reach the current messaging server without paid access; it
does not prove delivery to the other phone. Foreground send/receive and ordinary
website denial are still awaiting the operator's retry result.

When both phones are ready, with no paid pass active:

1. Join open **Mesh**, disable cellular data, and keep Signal open on both phones.
2. Send one text each way in an existing conversation.
3. Open `https://example.com/?mesh-free-app=1`; ordinary internet should remain blocked.

Stop at that result. Signal's
[full firewall guidance](https://support.signal.org/hc/en-us/articles/360007320291-Firewall-and-Internet-settings)
contains additional destinations/ports; do not treat this trial as that full policy.

Jami is a later local communication trial. Its
[LAN documentation](https://docs.jami.net/user/lan-only.html) supports local
discovery or a reachable DHT bootstrap, but discovery broadcasts do not normally
cross our routed node subnets. Mobile proxy/push dependencies, especially iOS
background delivery, need separate tests.

Both projects publish source. Jami is GPLv3-or-later and offers white-label
development; Signal's mobile source is AGPLv3. A fork needs license compliance,
app signing, releases, push credentials and ongoing security maintenance.
Open-source licenses do not by themselves grant branding rights. Keep the
familiar original apps for this pilot. Sources:
[Jami](https://jami.net/), [Jami white-label contact](https://jami.biz/contact),
[Signal Android license](https://github.com/signalapp/Signal-Android/blob/main/LICENSE),
[Signal iOS license](https://github.com/signalapp/Signal-iOS/blob/main/LICENSE),
[Signal trademarks](https://signal.org/brand/trademarks/).
