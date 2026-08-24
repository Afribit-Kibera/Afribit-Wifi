# MikroTik Gateway Runbook

## Commissioned Test Router - 2026-08-24

This RB951Ui-2HnD was commissioned in place without a factory reset.

- RouterOS: `7.20.8 (long-term)`
- WAN: `ether1`, DHCP from home network, observed as `192.168.1.234/24`
- HotSpot LAN: `bridge1`, gateway `10.5.50.1/24`
- Client pool: `10.5.50.2-10.5.50.254`
- Local gateway agent host: `10.5.50.252`, Ethernet MAC `AC:F4:66:BA:FA:D7`
- HotSpot server/profile: `hotspot1` / `hsprof1`
- HotSpot DNS name: `login.wifi.afribit.africa`
- Portal domain: `https://wifi.afribit.africa`
- BTCPay domain: `https://pay.insats.org`

Pre-change rollback files are stored on the router as:

- `before-bitcoin-valley.backup`
- `before-bitcoin-valley.rsc`

RouterOS REST is exposed only on the HotSpot LAN to `10.5.50.252/32` through the `www` service. The `bitcoin-valley-agent` RouterOS user is restricted to `10.5.50.252/32` and uses the `bitcoin-valley-agent` group with `read,write,web,api,rest-api` policy. Do not forward RouterOS management ports from WAN.

The production gateway token is stored in Vercel Production as `GATEWAY_AGENT_TOKEN` and locally in ignored `.env.gateway` for the bench agent. If the gateway token changes in Vercel, update `.env.gateway` and redeploy production before restarting the agent.

End-to-end commissioning test passed by queueing a production `sync_walled_garden` job and processing it through the local gateway agent into the MikroTik.

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
                    -> gateway agent machine at 10.5.50.252
WiFi clients       -> 10.5.50.2-10.5.50.254
MikroTik gateway   -> 10.5.50.1
```

For this bench router, connect the home router LAN to MikroTik `ether1` and connect this computer directly to MikroTik `ether2`. Keep the computer's Wi-Fi on the home network for internet access while testing payments and deployments. A future clean site can use a different subnet, but `mikrotik/bitcoin-valley-hotspot.rsc`, `.env.gateway`, and the gateway agent static address must be changed together.

WinBox is a graphical RouterOS client, not a terminal protocol. Commissioning can be completed from this computer with SSH, SCP, and RouterOS REST once the router is physically connected. The operator must provide the factory/admin password and explicitly approve any factory reset; router passwords are never stored in the repository.

On every Huawei AP, disable DHCP, NAT, and routing. Give each AP a fixed management address outside the client pool, connect it LAN-to-LAN, and broadcast the same Bitcoin Valley WiFi SSID. MikroTik must be the only DHCP server and default gateway for customers.

## 3. Router Prerequisites

1. Export a backup with `/export file=before-bitcoin-valley` and create a binary backup in WinBox.
2. Upgrade the RB951 to a stable RouterOS v7 release. The gateway agent uses REST, which is a RouterOS v7 feature.
3. Confirm WAN internet access already works.
4. Confirm the customer LAN bridge is named `bridge1`, or edit `hotspotInterface` in `mikrotik/bitcoin-valley-hotspot.rsc`.
5. Reserve `10.5.50.252` for the gateway agent, or change `agentAddress`, `.env.gateway`, and the subnet variables together.

Do not import the script into a live router until its interface and subnet values have been reviewed. It does not erase configuration, but duplicate DHCP or overlapping subnets can interrupt service.

## 4. Upload And Import

In WinBox:

1. Open **Files** and upload `mikrotik/bitcoin-valley-hotspot.rsc`.
2. Upload the files from `mikrotik/hotspot-bv` into the router's `hotspot` directory.
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

The script initially enables HTTP REST only from `10.5.50.252/32`. This is acceptable only on the isolated LAN during commissioning and bench testing. Production should install a trusted router certificate, enable `www-ssl`, restrict it to the same address, disable `www`, and set `MIKROTIK_USE_TLS=true`.

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
MIKROTIK_HOST=10.5.50.1
MIKROTIK_USERNAME=bitcoin-valley-agent
MIKROTIK_PASSWORD=<router agent password>
MIKROTIK_USE_TLS=false
```

Run the agent with Windows Task Scheduler, NSSM, systemd, or another process supervisor after commissioning. The router API must never be forwarded from the WAN.

## 7. Captive Portal Behavior

`hotspot/login.html` is a dependency-free local page. It automatically forwards MikroTik values (`mac`, `ip`, `link-login`, and `link-orig`) to the cloud portal. No external CSS or JavaScript is needed before that redirect.

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
