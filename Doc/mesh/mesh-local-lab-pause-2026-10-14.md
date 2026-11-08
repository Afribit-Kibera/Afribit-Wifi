# Local Mesh lab paused - 14 October 2026

The operator requested that Mesh test processes on this computer be stopped and
kept inactive until later work. This change is reversible; no project files,
container volumes, relay events, media, account configuration or payment state
were deleted.

## Confirmed local state

| Resource | State after pause |
| --- | --- |
| `AfribitMeshAutomaticAccess` task | Disabled; was already disabled after the cloud-controller handoff |
| `Kibera-Blossom-001` task | Disabled and stopped |
| `Kibera-Nostr-Sync-001` task | Disabled and stopped |
| `kibera-nostr-relay-001` container | Exited; restart policy `no` |
| `kibera-blossom-001` container | Exited; restart policy `no` |
| `kibera-jami-bootstrap-001`, `kibera-jami-seed-001`, `kibera-jami-udp-001` | Exited; restart policy `no` |
| `podman-uosserver` WSL distribution | Stopped after container-policy verification |
| UniFi OS Server Elevation Service | Stopped; startup changed from Automatic to Manual |
| Old UniFi TCP port forwards | Thirteen exact previously inventoried forwards removed, with restoration records retained |

The portal/board/media/relay and laptop-controller processes were already absent
when inspected. Final inspection found no project-owned running host processes
or listeners on the lab service ports. UniFi itself was already exited inside
the stopped container runtime; its configuration and data remain installed.

Only forwards from `0.0.0.0` to the old UniFi VM address `172.27.149.154` with
matching listen/destination ports were removed: 10003, 3478, 5514, 5671, 6789,
8080, 8444, 8881, 8882, 8880, 28082, 9543 and 11443. No global portproxy reset
was used. The UniFi helper cleanup ran with Windows administrator privileges.

## Scope and preserved recovery evidence

This is a local-computer pause. No changes were made to Vercel, the LunaNode
controller, router/AP configuration, the HP computer, Tailscale or other
applications. Their current remote availability was not re-audited by this
procedure. Stopping local service hosts makes their local prototypes unavailable;
it does not undo the router network or shut down the cloud deployment.

Private recovery records are in
`artifacts/mesh-lab/private/pause-2026-10-14/` (ignored by Git):

- Original XML definitions for the three tasks and before/after states.
- Container restart policies before the pause.
- Original UniFi helper service state and startup type.
- Exact removed port-forward records and completed cleanup result.

## When resuming

1. Decide which local experiments are actually needed. Keep the laptop
   `AfribitMeshAutomaticAccess` task disabled while the LunaNode controller owns
   this router; do not run competing paid-access workers.
2. Start the UniFi helper manually from elevated PowerShell if UniFi is needed:
   `Start-Service -Name 'UniFi OS Server Elevation Service'`. Open UniFi OS Server
   normally to start its own runtime. Automatic service startup can be restored
   explicitly when required. The app should recreate its current forward map;
   do not blindly restore the old VM address, which may have changed.
3. Start only the selected lab containers using `scripts/mesh/run-lab-podman.py`.
   Restart policy `no` permits deliberate starts without automatic resurrection.
   Restore the recorded policies only if unattended local startup is intended.
4. Enable/start the Blossom or Nostr-sync tasks only after checking their host
   addresses, runtime and dependencies. Their task definitions and saved data
   are intact. Manual starts of the existing scripts also remain possible.
5. Check listeners and the intended service once. Follow the
   [developer handoff](mesh-developer-handoff.md) before commissioning a new site.

The pause itself was not pushed to Git or deployed; it changes local operational
state, with this document left in the workspace for later handoff.
