# HTTPS customer onboarding

## Status — 6 October 2026

The TLS overlay was installed at 19:52 EAT and safely paused while its private
tunnel was unavailable. At **21:30 EAT**, the original UDP 51820 path recovered
and existing-overlay activation passed with pinned router access, active health
and negative join checks. Billing readiness was enabled without a financial
request or allowance change. Physical unpaid-phone HTTPS catalogue acceptance
and a fresh provider purchase remain pending. The legacy HTTP capability entry
is blocked. This is home-pilot evidence, not field clearance.

## Why the transport must change

The old `http://10.20.0.10:8040/start` bridge redirects to an HTTPS checkout with
a one-use ticket and a browser capability. WireGuard encrypts router-to-cloud
traffic, but does not encrypt phone-to-router traffic on the open Mesh SSID.
That HTTP redirect can expose the capability to a nearby observer. A one-use
ticket does not make an exposed reusable capability safe.

The checkout entry becomes **https://mesh-core.afribit.africa/start**. Its DNS
record remains DNS-only at `170.75.168.29`; proxying it through a CDN would remove
the guest socket address used for attestation and must not be enabled.

## Scoped transport

1. The pinned Primary accepts only customer VLAN `mesh-customer-30`, source
   `10.30.0.0/24`, TCP 443 to `170.75.168.29`. A destination NAT translates that
   connection to `10.254.30.1:443` across `KM-MESH-CLOUD`, retaining the source.
   The exact NAT is inserted before the unique dynamic HotSpot jump. Two
   equally scoped walled-garden entries cover the original and translated
   destination, including the generated HotSpot forwarding rules. This avoids
   the unauthenticated HTTPS redirect and remains valid if native dynamic
   HotSpot rules are recreated above the static NAT.
2. Existing Caddy terminates TLS with its existing certificate for
   `mesh-core.afribit.africa`. No private certificate key moves into the Node
   service or router.
3. Caddy handles exactly `/start`. Its `remote_ip` matcher permits the actual
   guest socket range; other public sources receive 403 even if they supply
   forged forwarding headers. It overwrites `X-Mesh-Client-IP` from the real
   socket and `X-Mesh-Proxy-TLS` with `1`.
4. The daemon sets `MESH_JOIN_TRANSPORT="trusted-tls-proxy"` and
   `MESH_JOIN_BIND_HOST="127.0.0.1"`. That combination is mandatory. It accepts
   the two headers only on an IPv4 loopback socket, validates exactly one
   canonical customer IPv4 address, and rejects missing, duplicate, array,
   comma-separated, management, gateway, broadcast and IPv6 addresses.
5. The existing live router observer still verifies the IP/MAC/HotSpot binding.
   Browser query strings and `X-Forwarded-For` never select the customer.
6. Only after the transport is ready does the public router `site-config.js`
   change to the HTTPS entry. Portal code refuses the old HTTP URL and legacy
   browser-asserted MAC/IP context.

The legacy direct daemon mode exists only for controlled lab compatibility.
It is not selected by the commissioned cloud controller. The old named cloud
and laptop HTTP garden, NAT and forwarding rules are disabled and read back.
Two narrowly scoped raw drops also block guest TCP 8040 to the old cloud and
laptop destinations, including existing connections; there is no HTTP fallback.
Customer internet still exits the existing Primary WAN, not the cloud server.

## Review and commission

Read-only inspection:

```powershell
py scripts/mesh/commission-secure-join.py
```

After reviewing this change and the exact owned router rules, commission:

```powershell
py scripts/mesh/commission-secure-join.py --apply
```

The script pins the enrolled router SSH key and checks `KM-LAB-001` /
`HH70A8H82EG`, validates the current policy, builds the current daemon, validates
Caddy, and verifies the original Windows scheduled worker is disabled with no
matching daemon process. Run it from that original Windows operator host.
It retains private backups in
`artifacts/mesh-lab/private/secure-join/<UTC timestamp>/`. The server retains its
old environment and Caddy file under the same timestamp in a root-only
`/var/lib/mesh/secure-join-backups/` directory. Existing access order ledgers,
payment references, allowances, expiration times and the disabled laptop
worker are not reset or migrated. There is one daemon restart and a brief
purchase interruption while the transport changes.

Rollback is intentionally **fail closed**:

```powershell
py scripts/mesh/commission-secure-join.py --rollback artifacts/mesh-lab/private/secure-join/<UTC timestamp>
```

It restores the earlier release and Caddy configuration, places the controller
in standby, disables purchases, removes only the new owned overlay, and keeps
the old HTTP rules disabled. It never automatically resumes an older worker
or insecure customer path. Review retained allowance handoffs and repair TLS
before resuming purchases.

After a recorded fail-closed rollback, the reviewed operator can commission the
repaired TLS transport using the original retained portal configuration:

```powershell
py scripts/mesh/commission-secure-join.py --resume artifacts/mesh-lab/private/secure-join/<UTC timestamp>
```

Resume verifies the exact retained previous release, recorded standby rollback,
disabled Windows worker, one server daemon and a bounded TCP probe from the
server to the router's private management route before any mutation. Public
cloud-API health alone is not sufficient. It preserves the allowance
ledger and explicitly selects active mode only with loopback/TLS-proxy settings.
The purchase capability is published only after active controller health and
owned router-rule readback succeed. Retained sanitized failure phases appear in
`failure.json`; raw credentials and provider responses never appear there.

If the operator laptop is on home Wi-Fi rather than the lab subnet, add
`--via-vm` to inspect/apply/resume/rollback. It opens a direct TCP channel over
the existing pinned VM SSH connection to the router's WireGuard route, then
performs a separate pinned RouterOS SSH handshake. Router passwords remain
inside that end-to-end encrypted inner session; keys and secrets are not
uploaded or passed to a VM shell. A working VM health response alone does not
prove the physical WAN/WireGuard is restored: the pinned router handshake must
also succeed.

When the computer has both lab Ethernet and home Wi-Fi, `--source-address`
can select its current home Wi-Fi IPv4 for pinned VM SSH without changing
Windows routing or server firewall permissions. This does not repair an
unavailable router tunnel.

On 6 October the TLS configuration was installed in
`secure-join-20261006T165251Z`, but the router's tunnel remained stale. Purchases
were disabled again and standby verified; the TLS overlay is retained.
Do not repeat `--apply` or resume an older backup over this installed overlay.
Inspect the retained configuration and restore the private tunnel first;
the later 21:30 EAT activation checkpoint above supersedes that historical
hold. Physical phone acceptance remains pending.

### Resume service with the existing TLS overlay

This is a reviewed recovery checklist, not a new `--apply` invocation:

Read-only preflight of the retained installed release:

```powershell
py scripts/mesh/commission-secure-join.py --check-activation artifacts/mesh-lab/private/secure-join/20261006T165251Z
```

After it passes, activate that same overlay:

```powershell
py scripts/mesh/commission-secure-join.py --activate-existing artifacts/mesh-lab/private/secure-join/20261006T165251Z
```

Use `--source-address` for the operator's current home-Wi-Fi IPv4 when needed.
These modes verify the retained bundle hash and release, paused environment,
one server worker, disabled laptop worker, loopback binding, Caddy guest-source
policy, exact owned static rules and six native HotSpot child rules. RouterOS
string values in child-rule queries are quoted so the read-back tests the
intended protocol/action rather than a parser-dependent expression.

1. Prove server-to-router connectivity using the private tunnel and the pinned
   router SSH identity/serial, not only a TCP listener or cloud health.
2. Confirm the installed release and bundle hash against its retained
   verification record, one server worker, the disabled laptop worker,
   loopback/TLS-proxy settings, and the eight enabled owned TLS rules. The old
   HTTP rules must remain disabled.
3. Retain a private backup of the currently paused environment and portal.
   Check that public `/start` rejects a request even with forged guest headers
   and that the loopback endpoint rejects missing/invalid attestations.
4. Activate only the existing controller service; confirm active health and
   repeat the pinned private-router check before publishing billing readiness.
5. Test the catalogue on an unpaid physical phone over HTTPS, with cellular off,
   before requesting a new payment.

Any failed activation must pause billing and return the same controller to
standby while preserving TLS and the access ledger. No reset, second worker or
plaintext fallback is part of this procedure.

The 21:30 EAT activation record is retained privately under
`artifacts/mesh-lab/private/secure-join/activation/20261006T183021Z/`.
Later signed-request hardening must follow its own
[controller/schema/API release order](mesh-agent-replay-protection.md), while
retaining this TLS policy and the ledger. A new bundle requires a new recorded
hash/release; do not rewrite this earlier verification record to match it.

## Validation and remaining acceptance

- Seven daemon tests pass, including malicious forwarding/header fixtures and
  direct-WireGuard/direct-customer requests rejected in secure mode.
- `tests/mesh-captive-check.mjs` passes phone layouts, secure internet/voucher
  handoff with only a `view` field, and disabled HTTP/legacy configurations.
- Type checking passes.
- Read-only `caddy adapt` against the actual server binary confirms the guest
  matcher is evaluated before the denial fallback inside `/start`; no server
  runtime configuration was changed by that check.
- Before a new payment: verify public `/start` returns 403 despite forged guest
  headers, the old HTTP path cannot issue a redirect, and an unpaid physical
  phone on Mesh reaches the catalogue through HTTPS with cellular data off.
- Live TLS commissioning, physical unpaid phone acceptance and an actual
  purchase are separate evidence. Do not mark them passed from mock tests.

The open captive welcome HTML remains public information served locally over
HTTP. TLS onboarding protects capabilities once the purchase button is tapped;
it does not authenticate the initial HTTP welcome document against a rogue
access point. A fully authenticated captive origin/CAPPORT certificate, client
isolation, router hardening and management-plane protections remain separate
production requirements.
