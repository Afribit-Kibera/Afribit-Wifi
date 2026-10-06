# Scoped iPhone push trial — installed, delivery pending

6 October 2026. Blink wallet refresh was reported working on unpaid Mesh, but an iPhone notification appeared only after switching to paid mobile data. Core Blink allowances were rechecked enabled with zero paid sessions. A single-phone Apple push policy is now installed for `10.30.0.197/32`; locked-screen delivery remains pending. Android push has not been commissioned.

The accepted commissioning record is
`artifacts/mesh-lab/private/mobile-push/20261006T171001589866Z/commissioning.json`:
five destination entries, two static forwarding rules, five garden entries and
ten generated HotSpot filter children. Each generated child was verified to
retain the exact guest source, Apple destination and TCP 5223 scope. No raw
HTTPS rule, payment or paid pass was changed.

## Narrow policy

`scripts/mesh/commission-mobile-push.py` prepares an optional IPv4-only policy on the pinned spare `KM-LAB-001`; default execution is read-only. It does not trigger a notification, wallet transaction, payment, paid pass or app registration. Existing Blink API/Signal/learning rules and raw HTTPS restrictions remain unchanged.

| Platform | Allowed destination | Device transport |
| --- | --- | --- |
| iPhone APNs | `17.249.0.0/16`, `17.252.0.0/16`, `17.57.144.0/22`, `17.188.128.0/18`, `17.188.20.0/23` | TCP 5223 only |
| Android FCM | Router DNS-resolved `mtalk.google.com`, `mtalk4.google.com`, `alt1-mtalk.google.com` through `alt8-mtalk.google.com` | TCP 5228–5230 only |

These are **shared OS push services for all applications**, not a Blink-only permission. An allowed phone may receive other apps' push messages; app content still needs its separately permitted API. The allowance has an Internet/WAN dependency and does not create offline notifications. Router DNS/IP rules cannot establish that traffic is exclusively one app or one Google hostname sharing that IP.

Apple documents device APNs TCP 5223 and the listed restricted IPv4 ranges; TCP 443 is also a device fallback and 443/2197 may be used by providers. The prepared policy intentionally excludes that fallback/provider traffic and Apple's entire `17.0.0.0/8` allocation. [Apple network guidance](https://support.apple.com/en-us/102266).

Google documents native FCM 5228–5230, HTTPS 443 and additional registration hosts. This prepared trial allows only native delivery ports to the ten listed production `mtalk` names: no staging/dev servers, registration/API HTTPS, Google ASN or broad address inventory. It may therefore fail for a phone needing registration/token renewal or HTTPS fallback; failure should prompt diagnosis rather than widening the policy blindly. Google cautions against brittle IP filtering and recommends persistent connections with NAT/SPI timeouts of at least 30 minutes. This helper does not globally change connection-tracking timeouts. [FCM network configuration](https://firebase.google.com/docs/cloud-messaging/network-configuration).

MikroTik's current CLI reference explicitly permits `min[-max]` port ranges in HotSpot walled-garden IP entries; firewall source/destination port matchers also support ranges. The helper uses `5228-5230` and typed exact `find` conditions for read-back, avoiding protocol enum stringification or `/32` display normalization. Live APNs readback now passes; Android FCM range-port commissioning remains untested. [HotSpot IP CLI](https://manual.mikrotik.com/docs/cli-reference/ip/hotspot/walled-garden/ip/), [firewall matchers](https://help.mikrotik.com/docs/spaces/ROS/pages/250708064/Common%2BFirewall%2BMatchers%2Band%2BActions).

## Commissioning boundaries

The helper checks SSH fingerprint, identity/serial, guest HotSpot/interface and existing firewall anchors. It refuses existing/partial owned policy, takes a strictly validated `/export terse` snapshot before mutation and inserts only owned destination-list, walled-garden and forwarding rules. Outbound rules require guest source/interface and `ether1`; return rules require WAN, guest destination/interface and established/related state. No raw rule or 443 allowlist is added.

Every write/read-back block is guarded by an explicit success marker and limited to 3,500 UTF-8 bytes to stay below the RouterOS SSH command buffer. Read-back verifies each destination and each rule independently, including exact ports, source, chain/interface, action and enabled state. Failure removes only the exact owned comments/static list entries. Removal and read-back reject unknown leftover owned items; rollback does not claim that unrelated configuration is restored.

Prefixes/lists: `mesh:push:apns-` / `KM-MESH-PUSH-APNS` and `mesh:push:fcm-` / `KM-MESH-PUSH-FCM`. APNs and FCM are independently owned; `--remove --platform apns` does not change Android or Blink rules. One policy per platform is intentional; remove/reapply explicitly to change its source scope. DNS-derived children may change as Google answers change.

## Root/operator commands

The current phone OS/address is operator-confirmed. This independent push
trial is being tested while checkout remains paused for tunnel recovery; it
does not enable purchases. A single-phone `/32` scope is preferable for the
first test; an IP is not immutable identity and may later be leased to another
guest. Remove the trial after acceptance or deliberately choose a shared
subnet policy.

```powershell
# Read-only owned-policy counts for both platforms.
py scripts/mesh/commission-mobile-push.py

# Examples only: substitute the actual current guest address.
py scripts/mesh/commission-mobile-push.py --apply --platform apns --client 10.30.0.197
py scripts/mesh/commission-mobile-push.py --apply --platform fcm --client 10.30.0.195

# Whole guest subnet is an explicit shared platform policy.
py scripts/mesh/commission-mobile-push.py --apply --platform both

# Exact owned removal; no paid/Blink/Signal changes.
py scripts/mesh/commission-mobile-push.py --remove --platform apns
```

## Phone acceptance

1. Phone remains on Mesh with cellular data off, no paid pass, notifications enabled and wallet already signed in. Record OS/app version and current guest address privately.
2. Confirm Blink foreground balance/history refresh still works. Lock the phone.
3. Use an available non-financial, consented notification fixture; do not send funds just to trigger a notification. If no safe Blink trigger exists, acceptance remains pending until a normal wallet notification occurs.
4. Verify locked-screen delivery and then prove an unrelated public website remains blocked. Inspect only counters/connection metadata if diagnosis is needed; do not collect notification contents.
5. Remove the owned trial and retest the restriction if a negative baseline is needed. No notification delivery claim should be inferred from installed firewall rules alone.

## Local evidence

Ten tests in `tests/mobile-push-policy.test.py` pass. They cover source/platform
bounds, enabled policy anchors and ordering, exact `/32` readback, generated
children, bounded commands, independent platform removal and sanitized failure
reports. Python compilation passes. Root applied and verified the scoped policy
after fixing RouterOS host-address normalization and dynamic-child counting;
earlier unsuccessful trials removed their owned rules. Physical notification
acceptance is still pending.

The requested non-financial check is an iPhone Signal alert while locked,
followed by verifying unrelated website blocking. That can demonstrate the
shared Apple push path, but does not alone prove Blink-specific event delivery.
Actual Blink push remains pending a normal notification or a safe fixture.
