# Catalogue handoff latency

6 October 2026, home pilot. No payment, voucher or access allowance was issued.

The router's welcome page is local, but opening the online catalogue goes
through the private LunaNode join controller. It must observe the current
guest IP/MAC on the enrolled router and obtain a short-lived checkout context.
The controller previously opened a new SSH connection for each observation.

## Measurements and fix

Before the change, three observations of a connected guest took **3,820,
3,660 and 3,534 ms**. Creating a checkout context took **1,232 ms**;
an independent warm catalogue HTML request took **215 ms**. These are separate
server measurements, not a measured phone page-load total. They explain part
of the reported ten-second delay; DNS, TLS, mobile connectivity and rendering
were not isolated by that measurement.

`gateway-agent/mesh-observer.py` now retains the authenticated, pinned SSH
transport. Each request still queries the live router and validates the router
identity, HotSpot server and guest binding. It does not cache an IP/MAC result.
The daemon warms this read-only connection on startup. Access activation still
uses the independent guarded provisioning helper and existing allowance ledger.

After deployment, a diagnostic connection took **3,378 ms** initially, then
**976 and 998 ms** for subsequent observations. The guest had disconnected by
this run, so these were fresh **unconfirmed** lookups; no checkout context was
created and no access was granted. An independent catalogue HTML request took
**313 ms**, HTTP 200. This verifies reduced transport overhead, not the complete
successful customer handoff. The daemon's already-warmed connection normally
avoids that initial handshake; reconnect after transport failure still incurs it.

Join responses now include `Server-Timing` for router observation and context
creation. Safe logs contain only those durations, never credentials, MACs,
join tickets or cookies. A missing client fails closed without dropping a
healthy authenticated transport. Network failure closes it and the next
request reconnects; no stale binding is accepted.

## Release and verification

Active release: `/opt/mesh/releases/cloud-pilot-20261006-fast-join` on
`mesh-core.afribit.africa`. Previous release:
`/opt/mesh/releases/cloud-pilot-20261006`. The environment, tunnel, payment
providers and access-ledger records were retained. The updater can restore the
previous release without resetting customer deadlines or locks.

- Automatic-access suite: **32 tests passed**, including fresh observations on
  a reused connection, wrong-address rejection and worker failure/recovery.
- Typecheck and focused lint passed. Python syntax compiled.
- Router captive checks passed at 320/390/430/580 px.
- Live controller service is active; HTTPS health reports cloud polling active.
  That health endpoint alone is not an end-to-end payment/access check.

## Next physical acceptance

On unpaid Mesh with cellular data off, reopen `http://10.30.0.1/login`, then tap
“Choose an internet pass.” Record the complete opening time, repeat once while
connected, and compare the response timing with rendering. Do not make a payment
for this timing check. Also verify the three free learning destinations while
an unrelated external website remains blocked.

The welcome assets are on the router. The catalogue, learning websites and
cloud controller need WAN. The operator reports the automatic popup returned
after reconnecting ether1; this does not prove popup behavior during every
outage. A separate WAN-off test should check manual local welcome access and
honest unavailable-service messaging. Do not promise offline online checkout.
