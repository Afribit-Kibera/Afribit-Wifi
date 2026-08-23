# MikroTik Gateway Runbook

## 1. How An Unpaid Phone Reaches Payment

The phone does not need mobile data. The MikroTik remains connected to the internet through its WAN, but HotSpot blocks general traffic until authorization. Its walled garden permits only:

- `wifi.afribit.africa` for the purchase and voucher portal
- `pay.insats.org` for BTCPay checkout
- domains enabled under Admin > Free sites
- local DNS through the MikroTik

When an invoice is created, the backend can also issue one three-minute 128 Kbps grant per MAC address every 12 hours. This lets a Lightning wallet on the same phone contact its wallet backend and pay. The grant is deliberately short and slow; a voucher remains the offline fallback.

## 2. Required Topology

```text
Internet/ONT -> MikroTik WAN
MikroTik LAN bridge -> Huawei access points in bridge/AP mode
                    -> gateway agent machine at 10.20.0.2
WiFi clients       -> 10.20.0.10-10.20.0.254
MikroTik gateway   -> 10.20.0.1
```

For bench testing on a home connection, connect the home router LAN to MikroTik `ether1` and connect this computer directly to MikroTik `ether2`. Keep the computer's Wi-Fi on the home network for internet access. With the factory configuration, the MikroTik management address is normally `192.168.88.1` on `ether2`.

WinBox is a graphical RouterOS client, not a terminal protocol. Commissioning can be completed from this computer with SSH, SCP, and RouterOS REST once the router is physically connected. The operator must provide the factory/admin password and explicitly approve any factory reset; router passwords are never stored in the repository.

On every Huawei AP, disable DHCP, NAT, and routing. Give each AP a fixed management address outside the client pool, connect it LAN-to-LAN, and broadcast the same Bitcoin Valley WiFi SSID. MikroTik must be the only DHCP server and default gateway for customers.

## 3. Router Prerequisites

1. Export a backup with `/export file=before-bitcoin-valley` and create a binary backup in WinBox.
2. Upgrade the RB951 to a stable RouterOS v7 release. The gateway agent uses REST, which is a RouterOS v7 feature.
3. Confirm WAN internet access already works.
4. Confirm the customer LAN bridge is named `bridge`, or edit `hotspotInterface` in `mikrotik/bitcoin-valley-hotspot.rsc`.
5. Reserve `10.20.0.2` for the gateway agent, or change `agentAddress`, `.env.gateway`, and the subnet variables together.

Do not import the script into a live router until its interface and subnet values have been reviewed. It does not erase configuration, but duplicate DHCP or overlapping subnets can interrupt service.

## 4. Upload And Import

In WinBox:

1. Open **Files** and upload `mikrotik/bitcoin-valley-hotspot.rsc`.
2. Upload the whole local folder `mikrotik/hotspot-bv` as `/flash/hotspot-bv`.
3. Open **Terminal** and validate the script on RouterOS 7.16 or newer:

```routeros
/import file-name=bitcoin-valley-hotspot.rsc verbose=yes dry-run=yes
```

4. Import it:

```routeros
/import file-name=bitcoin-valley-hotspot.rsc verbose=yes
```

On earlier RouterOS v7 versions without dry-run, use `/import file-name=bitcoin-valley-hotspot.rsc verbose=yes` during a maintenance window. Keep the RouterOS version used for testing and production aligned.

## 5. Enable The Agent Account

The import creates a disabled least-privilege REST account. Set a unique password and enable it:

```routeros
/user set [find where name="bitcoin-valley-agent"] password="USE-A-LONG-RANDOM-PASSWORD" disabled=no
```

The script initially enables HTTP REST only from `10.20.0.2/32`. This is acceptable only on the isolated LAN during commissioning. Production should install a trusted router certificate, enable `www-ssl`, restrict it to the same address, disable `www`, and set `MIKROTIK_USE_TLS=true`.

## 6. Install The Gateway Agent

On the always-on LAN machine:

```powershell
npm install
Copy-Item .env.gateway.example .env.gateway
npm run gateway:dev
```

Configure:

```env
GATEWAY_API_URL=https://wifi.afribit.africa
GATEWAY_AGENT_TOKEN=<value from Vercel>
GATEWAY_POLL_INTERVAL_MS=5000
MIKROTIK_HOST=10.20.0.1
MIKROTIK_USERNAME=bitcoin-valley-agent
MIKROTIK_PASSWORD=<router agent password>
MIKROTIK_USE_TLS=false
```

Run the agent with Windows Task Scheduler, NSSM, systemd, or another process supervisor after commissioning. The router API must never be forwarded from the WAN.

## 7. Captive Portal Behavior

`/flash/hotspot-bv/login.html` is a dependency-free local page. It automatically forwards MikroTik values (`mac`, `ip`, `link-login`, and `link-orig`) to the cloud portal. No external CSS or JavaScript is needed before that redirect.

For the most reliable Android/iOS captive popup, install a valid certificate on the HotSpot profile for `login.wifi.afribit.africa`. RouterOS v7.3 and later then advertises the captive portal through DHCP/RFC 7710 using `api.json`. Without that certificate, normal HTTP captive checks still redirect, but popup behavior varies by device.

## 8. Walled Garden

The import seeds the portal and BTCPay hosts. Admin > Free sites controls additional domains and queues a full synchronization to the router. Because modern pages can call third-party hosts, test BTCPay from an actually unpaid phone and add only confirmed required hosts.

Do not broadly allow CDNs, Google, Apple, or entire payment networks. The short payment grant exists specifically to avoid a large permanent allowlist for wallet backends.

## 9. Acceptance Test

1. Connect an unpaid Android phone with mobile data disabled.
2. Confirm the local page opens the mobile portal and packages are visible.
3. Confirm unrelated websites are blocked.
4. Create a low-value invoice and confirm BTCPay loads.
5. Pay from a wallet on the same phone and confirm access is granted after settlement.
6. Redeem a voucher on a second unpaid device.
7. Create, extend, and revoke a manual grant from Admin > Network.
8. Confirm speed-limited grants create a managed simple queue.
9. Wait for a grant to expire and confirm its IP binding and queue are removed.
10. Repeat on iOS and one laptop.

Useful checks:

```routeros
/ip hotspot host print
/ip hotspot ip-binding print where comment~"bitcoin-valley-wifi"
/ip hotspot walled-garden print where comment~"bitcoin-valley-wifi"
/queue simple print where comment~"bitcoin-valley-wifi"
/log print where message~"hotspot"
```

## 10. Rollback

Disable the HotSpot first:

```routeros
/ip hotspot disable [find where name="bv-hotspot"]
```

If service does not recover, restore the pre-change binary backup from WinBox during the maintenance window. Keep the exported `.rsc`, binary backup, router version, and tested script together for every site.
