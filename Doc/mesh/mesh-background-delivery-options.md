# Mesh: background communication on phones

Reviewed 6 October 2026, Africa/Nairobi.

## What the pilot establishes

The operator confirms Jami calls work, following the successful offline
foreground text trial. Calls are operator-reported acceptance in the offline
trial context; call direction, audio/video type and behavior when locking an
already connected call were not separately recorded. Both phones previously
failed to receive messages with their screens off. Android's proposed
background/battery-settings check has not returned a result.

The customer requirement is incoming messages and calls with the screen off,
over Mesh even when WAN is absent. Foreground-only success does not satisfy it.

## Correction: iPhone has a supported local notification path

The earlier discussion correctly described Jami's documented foreground-only
iPhone offline mode, but overstated that limitation as a general impossibility.
Apple supports **Local Push Connectivity** for isolated networks. An app's
`NEAppPushProvider` maintains a background connection to a local server on
configured Wi-Fi SSIDs. The extension can issue local notifications and report
incoming calls through CallKit without APNs connectivity.

This needs integration in the installed app, plus Apple's grant of the
`app-push-provider` entitlement for both app and extension. A router setting,
ordinary notification permission or a generic notification app cannot add this
capability to stock Jami. The existing local DHT bootstrap also does not provide
this integration.

[Apple Local Push Connectivity](https://developer.apple.com/documentation/networkextension/local-push-connectivity),
[reliable connection lifecycle](https://developer.apple.com/documentation/networkextension/maintaining-a-reliable-network-connection).

## Existing apps and development candidates

| Candidate | Evidence and decision |
| --- | --- |
| Installed Jami | Offline texts and calls have operator acceptance. Its published iPhone offline instructions require foreground use; retain it as a functional pilot, with no claim of unattended delivery. [Official instructions](https://forum.jami.net/t/jami-survival-kit-internet-down-keep-talking/5351) |
| Linphone and a local SIP service | An open-source communication stack to evaluate for a custom client. Vendor history contains a LocalPushProvider extension, but a 2024 release disabled local push. The inspected current GitHub master tree, commit `520d51addf408bec96670d105a014d8b7b83e6ec`, has no LocalPushProvider paths and its app entitlement lacks `app-push-provider`. The documented standard iOS push path uses APNs. Do not present the store app as a verified offline background solution. [Earlier implementation](https://gitlab.linphone.org/BC/public/linphone-iphone/-/merge_requests/305), [release disable](https://gitlab.linphone.org/BC/public/linphone-iphone/-/blob/release/5.2/linphone.entitlements), [current entitlement](https://github.com/BelledonneCommunications/linphone-iphone/blob/520d51addf408bec96670d105a014d8b7b83e6ec/Linphone/Linphone.entitlements), [vendor iOS push documentation](https://wiki.linphone.org/xwiki/wiki/public/view/Lib/Features/Push%20notifications/IOS%20push%20notification%20management/) |
| Apple SimplePush | Official sample implementing local text/call alerts, paired with SimplePushServer. Suitable as a feasibility proof before choosing or modifying a messenger; it is not a ready consumer Android/iPhone product. The documented sample needs a Mac, signed builds, two iOS devices and the approved entitlement. [Sample and setup](https://developer.apple.com/documentation/networkextension/receiving-voice-and-text-communications-on-a-local-network) |
| Berty / Bitchat | Remain separate app/transport evaluations. No locked-screen local-IP delivery acceptance exists on our phones. Bluetooth delivery or an Android foreground service does not establish offline iPhone delivery through the MikroTik network. [Berty source](https://github.com/berty/berty), [Bitchat Android transport/background design](https://github.com/permissionlesstech/bitchat-android) |

## Proposed next milestone

Prove **one locked iPhone receiving a local message alert and an incoming call**
with WAN and cellular disconnected, using Apple's supported local push path.
First establish access to a Mac/Xcode and an Apple Developer team that can
request the entitlement. The grant is an external prerequisite, not presumed
available. Only then implement a minimal signed app/server proof and choose
whether to integrate that capability into Jami or another open client.

A local notification service should run on an always-on host. Later replicas
and reconnection must be tested across routing nodes; this does not require
replacing the mesh routing protocol. Notifications are a distinct service from
message/media storage and end-to-end encryption.

When WAN is available, free access to an app's normal notification services is
a separate near-term option. It requires the correct app/provider/server path
and measured whitelisting; it ceases to provide notification wake-up when WAN
is absent. No new internet exceptions, app installs, payments or iOS builds
were performed by this research.
