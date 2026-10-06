# Controller connectivity investigation — 6 October 2026

**Recovery checkpoint, 21:30 EAT:** the private tunnel recovered on its original
UDP 51820 endpoint. A fresh handshake and pinned VM-to-router SSH succeeded;
the retained HTTPS overlay passed preflight and was activated at **18:30:21 UTC**.
Controller active mode, billing readiness and negative join checks passed.
The access ledger and installed TLS release were preserved. No new payment was
requested. Physical unpaid-phone HTTPS catalogue acceptance remains pending.
Core Blink access and the independently scoped Apple push trial are separate
from this controller recovery. The cause of the earlier interruption remains
unresolved; recovery alone is not a diagnosis or a field clearance.

## Earlier interruption evidence

- Primary `KM-LAB-001` has its home-internet lease on ether1. Management SSH
  works from the operator's lab Ethernet address. Public ICMP succeeds.
- The dedicated Toronto VM `170.75.168.29` is active. SSH, WireGuard, Caddy and
  controller services were verified active during successful pinned sessions.
  Controller standby and disabled portal billing were verified after cutover.
- The last observed WireGuard handshake was **13:59:55 UTC / 16:59:55 EAT**.
  Router UDP connections to port 51820 showed outgoing packets and no replies.
- Provider ingress permits UDP 51820, TCP 80/443 and SSH from the recorded
  operator IP. Guest/root host firewalls retain their expected permits.
  Fail2ban recorded no bans; no service restart explained the interruption.
- Server SSH is intermittent even when explicitly bound to home Wi-Fi.
  Successful recent SSH sources were all the existing allowed operator IP.
- A short source-port change on the router did not restore the tunnel. The
  original listen port 51821 was restored; no VM reboot or firewall widening
  was performed.
- A bounded server capture from **17:00:12–17:00:42 UTC** saw no incoming UDP
  51820 packets and no kernel capture drops. Three small diagnostic datagrams
  were sent from each local network path during this investigation. No payload
  capture, wallet request or private-key logging was performed.
- A comparison probe from the documented owned Insats VM could not run because
  its SSH connection timed out before authentication. No change was made to
  that server.

These observations do not identify whether the interruption is on the home
ISP path, an upstream route, or the provider network/security-group path.
An independent-source packet comparison or provider-side flow evidence is
still needed. Repeated resets or broad firewall permissions are not a diagnosis.

## Recovery and next acceptance milestone

At **17:58:23 UTC**, a bounded comparison probe sent six small diagnostic
datagrams to each candidate endpoint. The VM saw six on UDP 4500 and zero on
UDP 51820. A temporary provider ingress permit for UDP 4500 was restricted to
the recorded operator IP and removed after the probe. This is path evidence,
not proof that switching the operational tunnel would have repaired it.

At **18:24:35 UTC**, the original UDP 51820 peer had a fresh handshake.
Pinned private VM-to-router SSH then succeeded. No operational endpoint
migration was applied. Activation used the existing
`secure-join-20261006T165251Z` release and overlay; it did not rerun `--apply`,
reset the router, revive the laptop worker or reset customer allowances.
Public forged-header and invalid loopback attestation rejection passed.

Before another purchase, accept the current HTTPS catalogue on an unpaid
physical phone with cellular data off. Security follow-up has an independent
[controller/schema/API rollout order](mesh-agent-replay-protection.md).
See [secure join](mesh-secure-join.md) for the fail-closed activation procedure.

Commissioning now performs a bounded private-router socket check before any
new apply mutation. Cloud API health alone must not enable billing. Three
tests cover reachability, failed socket execution and interrupted SSH transport;
neither remote errors nor credentials are exposed in their failure messages.

Private metadata-only evidence is retained in
`artifacts/mesh-lab/private/lunanode/recovery-readonly-evidence.json` and the
installed secure-join release's `runtime-status.json`. Probe metadata is in
`artifacts/mesh-lab/private/lunanode/port-probe/result.json`; activation evidence
is in `artifacts/mesh-lab/private/secure-join/activation/20261006T183021Z/`.
No support message has
been sent and no field-production clearance has been issued.
