# Free on Mesh

What a phone on open **Mesh** can use without an internet pass. One list,
[lib/free-access.json](../../lib/free-access.json), drives both the router rules
and the "Free on Mesh" screens (router welcome page and the web portal). To add
or remove something, change that file, then re-apply the router rules.

This replaces the separate Signal, Blink and learning-site trial notes
(October 2026). Their results are kept below.

## What is free

| Item | Hosts (TCP 443 only) | Why these hosts |
| --- | --- | --- |
| Signal | `chat`, `grpc.chat`, `storage`, `cdn`, `cdn2`, `cdn3`, `cdsi`, `svr2`, `contentproxy` `.signal.org` | [Signal-Android build config](https://github.com/signalapp/Signal-Android/blob/main/app/build.gradle.kts) and [libsignal production config](https://github.com/signalapp/libsignal/blob/main/rust/net/src/env.rs) (`grpc.chat`) |
| Blink | `api.blink.sv`, `ws.blink.sv` | [blink-mobile production config](https://github.com/blinkbitcoin/blink-mobile/blob/e6f92cbe9810fdb5baedf3076f3e749bf25796e3/app/config/galoy-instances.ts) and [Blink API docs](https://dev.blink.sv/api/auth) |
| Bitcoin Diploma (PDF, 23 MB) | `bitcoinekasi.com`, `www.` | Publisher's original [workbook PDF](https://bitcoinekasi.com/wp-content/uploads/2025/03/bitcoin-diploma-2025-pdf.pdf) |
| Bitcoin Kenya | `bitcoin.co.ke`, `www.` | |
| Afribit | `afribit.africa`, `www.` | |
| Insats | `insats.org`, `www.` | |

Nothing else is free. App stores, Google/Apple services, CAPTCHA and other
CDNs are deliberately left out. Install and sign in to apps on normal internet
first.

Blink is also how a phone with no pass pays for one: the portal shows a
Lightning invoice, the person taps the QR to copy it, then opens Blink, taps
Send and pastes. The Wi-Fi sign-in window can't open other apps, so there is no
"Open Blink" button there; in Chrome or Safari the button uses `blink://`.

## How the router enforces it

[scripts/mesh/free_access.py](../../scripts/mesh/free_access.py) writes, for
each host, a `KM-MESH-FREE` address-list entry and a HotSpot walled-garden IP
entry (`src-address=10.30.0.0/24`, TCP 443). Three firewall rules let that list
through ahead of the unpaid denies: raw prerouting (before
`https-pending-deny`), customer outbound (before `internet-pending-deny`) and
return traffic (before `return-deny`). Every rule carries a `mesh:free:`
comment, so re-running replaces exactly these rules. It also removes the older
separate allowances (`KM-MESH-SIGNAL-TEXT`, `KM-MESH-BLINK-CORE`,
`KM-MESH-PAY-BLINK`, `KM-MESH-LEARN`).

The same rules are in the fresh-gateway template
([render-fresh-gateway.py](../../scripts/mesh/render-fresh-gateway.py)).

```powershell
# Inspect (default), then apply. Run from the laptop; the password file stays local.
$env:MESH_ROUTER_HOST_KEY = "SHA256:..."; $env:MESH_ROUTER_SERIAL = "..."
python scripts/mesh/free_access.py PASSWORD_FILE
python scripts/mesh/free_access.py PASSWORD_FILE --apply
```

It reaches the router over the controller's WireGuard link and checks the
pinned host key, serial and identity before changing anything.

### Limits

- **Not hostname isolation.** The router resolves hosts to IPv4 addresses.
  Several hosts share addresses with other sites (WordPress.com, Vercel,
  Cloudflare, and one Google front-end address for `storage.signal.org`), so
  those other sites become reachable too. Accepted for the pilot.
- IPv4 only. Field IPv6 policy is still open.
- Free means no pass is needed. It still uses Mesh's internet uplink; nothing
  here works if the gateway is offline.

## Results

### Signal

5 October 2026, old Primary. Existing Signal accounts on an Android phone and
an iPhone sent and received foreground text messages both ways on unpaid Mesh,
cellular data off, while other browsing stayed blocked. The first attempt
failed until `grpc.chat.signal.org` was added. Not tested: registration, calls,
media, background notifications.

### Blink

6 October 2026, old Primary. A signed-in custodial Blink wallet refreshed its
balance and history on unpaid Mesh, cellular data off. A notification arrived
only after switching to mobile data (see
[mobile push trial](mesh-mobile-push-trial.md)). Not tested: new sign-up (it
needs Firebase App Check and a CAPTCHA), self-custodial Spark, push.

### Learning sites

The Diploma is the publisher's unchanged 176-page PDF (22,939,045 bytes); it is
linked, not copied onto the router or website.

### Current router, 8–9 November 2026

`KM-LAB-001` (serial `DE7A0E5D61EC`): `free_access.py --apply` installed 19
garden entries and the three firewall rules in the right places; old lists 0.
A laptop on unpaid Mesh reached every host (Signal 404/403, Blink 400/426,
PDF 200, bitcoin.co.ke 206, insats 206, afribit 200) while `example.com`,
Google, YouTube and WordPress.com timed out. On Windows, curl needs
`--ssl-no-revoke` while unpaid (certificate revocation checks are blocked) and
`-k` for Signal (its own CA).

### Still to check on a phone

1. Pay for a pass with Blink from the sign-in window: tap QR, open Blink, Send, Paste.
2. Signal text both ways with no pass.
3. Open the Diploma PDF with no pass.
4. Scan another device's QR to pay for it.
5. Add Mesh to the home screen from Chrome/Safari (`/app`).
