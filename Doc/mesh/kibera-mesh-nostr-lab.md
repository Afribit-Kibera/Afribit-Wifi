# Kibera Mesh: local Nostr relay

Date: 5 October 2026, Africa/Nairobi. Current checkpoint: **12 passes — automatic signed-post catch-up**.

Latest setup result: the operator restarted and signed into the HP. Administrator SSH reconnects successfully on Tailscale `100.88.182.58:2222`. Virtual Machine Platform is enabled. Podman **5.8.3** now runs the pinned relay image in its own WSL machine **km-lab-002**. The HP's lab Wi-Fi is restored at **10.21.0.198**; home Ethernet remains available for downloads with IP forwarding disabled. Relay 002 exposes its own metadata and persistent database. Initial reconciliation copies all three existing signed posts to the HP and independently retrieves them from both relays.

The media-copy experiment is complete. This step uses the existing [nostr-rs-relay](https://github.com/scsibug/nostr-rs-relay) server for event storage and subscriptions. The small lab board delegates signing, verification and relay communication to [nostr-tools](https://github.com/nbd-wtf/nostr-tools). It is an integration screen, not another relay implementation or a complete social application.

## Current operator action

Automatic bounded reconciliation is now deployed on both hosts and passes an isolated HP-worker recovery test. Both relays hold twelve verified posts. Refresh either board to see its stored-copy check/retry status; no new outage or phone code is required. [Automatic catch-up](kibera-mesh-automatic-post-sync.md) supersedes the earlier manual-only state below. Scope is tagged lab text posts with fewer than 100 events; media and deletion policies are not synchronized. Next useful work is board media upload with explicit verified copies and signed references.

HP recovery is verified: all three services return with home Ethernet still disconnected. Explicit reconciliation copies the one outage post to HP, bringing both relays to ten verified signed posts. Independent ID-specific queries confirm outage event `cfabcb8eaa5b3740b207092884a954ae98be0fcefe9aa238501dd917fbf9b6db` has identical original content/signature on both. Evidence is in `hp-host-recovery-verification.json`. No additional operator post, shutdown or restart is needed. Next useful work is a bounded automatic catch-up worker; current reconciliation still requires an explicit command.

The operator shuts down the HP completely after confirming the Primary-board phone baseline. Primary accepts the phone post with one relay available. Independent query verifies the new event `cfabcb8eaa5b3740b207092884a954ae98be0fcefe9aa238501dd917fbf9b6db` and ten signed Primary posts; all four tested HP management/application ports are unreachable. Primary media remains available. Power HP back on, sign in with Node2 Wi-Fi and home Ethernet still disconnected, then report readiness. The next assistant action is explicit missing-post reconciliation and independent retrieval of this same event from HP; automatic catch-up is not implemented.

Repeat offline boot passes: HP boot `2026-10-04T23:21:11.500Z`, home Ethernet disconnected, all three login tasks Running automatically. The corrected board displays the original phone post and connects to both relay paths; direct HP query verifies nine retained signed posts. No manual process start is needed. No further reboot is required for checkpoint 11e. Next establish the Primary-board phone baseline on KiberaMesh-Lab before testing full HP shutdown; the operator computer must remain running to preserve diagnosis and the cloud connection.

The first HP offline boot automatically recovers its runtime, relay and Blossom. The board task exits 1, with no original stderr captured. The assistant updates the task to `start-hp-nostr-board.ps1`, which waits for the reserved lab address and captures output/state, and restores the board while HP remains offline. Both browser relay paths work and nine stored posts verify. Repeat the HP restart/sign-in with home Ethernet still disconnected to verify the corrected launcher's cold startup; no phone code is needed. See the runbook's checkpoint 11e observations for network evidence and exact limits.

The operator confirms **Primary and HP both connect with Limit IP Address Tracking enabled** after the local-entry change. Relay compatibility passes for this setup. Legacy portal-name access remains unresolved. Next follow the runbook's HP offline-start test: save work, remove only HP home Ethernet, keep Node2 Wi-Fi, restart and sign in. Direct pinned-key SSH over `10.21.0.198:2222` from `10.20.0.10` is verified for offline diagnosis. Do not interrupt the operator computer's internet or the router links.

With iPhone Limit IP Address Tracking enabled, reload the HP-hosted board at **http://10.21.0.198:8020/** and check the separate Primary/HP connection labels. Both boards now use same-host WebSocket paths **/relays/primary** and **/relays/hp** on port 8020, rather than asking the browser to connect directly across subnets. Each service host forwards these fixed paths to the two original independent relay endpoints, subscribes independently and deduplicates event IDs. The result states how many relays accepted a post. No repeated portal check code is required.

The operator identifies Primary as unavailable with tracking enabled while HP connects; both connect when disabled. The separate `portal.kibera.home.arpa` naming issue is not resolved by these paths. The revised browser connections are a candidate workaround for direct off-subnet access; iPhone acceptance remains pending. No Private Relay block or router-subnet change is applied.

Verification catches a separate dual-network host issue: HP had no specific `10.20.0.0/24` route and selected its home Ethernet gateway `192.168.100.1` for Primary traffic. A scoped persistent route now sends **10.20.0.0/24 via 10.21.0.1 on Wi-Fi interface 13, metric 5**. `Find-NetRoute` confirms source **10.21.0.198**, and Primary relay metadata is retrieved from the HP. Home default routes remain intact. The initial `New-NetRoute -PolicyStore PersistentStore` call is rejected by this Windows installation; `route.exe -p add 10.20.0.0 mask 255.255.255.0 10.21.0.1 metric 5 if 13` succeeds, with active and persistent state observed. For a future adapter replacement, re-identify the lab interface index. Rollback removes only this exact added route, using `route.exe delete 10.20.0.0 mask 255.255.255.0 10.21.0.1 if 13`, then verifies active/persistent stores; do not execute as part of normal operation.

The two fixed tunnels in `serve-nostr-client.py` accept only WebSocket upgrades from the lab subnets, permit no arbitrary destination, and use 32 connection slots with ten-minute idle timeouts. The content policy permits connections only to that board's explicit local address/port. Direct relay ports remain available for independent checks and reconciliation. Each board host is the entry point for its users; another host's page is the alternate entry if that host is lost.

Desktop browser verification passes on both pages: both WebSocket URLs remain on the respective board host; the original phone post appears; a new post from the HP board is accepted by both and retrieved with the same valid signature/event ID directly from each separate database. Unknown relay paths return 404 and non-upgrade requests return 400. Evidence: ignored `artifacts/mesh-lab/nostr/local-entrypoints-verification.json`; event **36ac254133cbb1f4226efec6b2b5c54e1d7a1673aae764d1fcb27f7644b2fa31**. These checks do not establish iPhone Private Relay compatibility until the operator retests.

The HP stores events in its own **kibera-nostr-db-002** volume, container **kibera-nostr-relay-002**, network **kibera-nostr-lab**, isolated from the original computer and UniFi runtime. Scheduled tasks **Kibera-Nostr-Relay-002** and **Kibera-Nostr-Board-002** start after the operator signs into Windows. This is not an unattended service before login; cold startup after provisioning remains untested. Windows firewall and TCP front doors restrict access to the two lab subnets.

The WSL image did not delegate rootless memory-control groups: initial container creation failed opening `memory.max`. The startup script therefore selects **km-lab-002-root**, the privileged Podman backend inside the isolated VM; the relay image still runs as its unprivileged app user, with 256 MiB/one-CPU limits, dropped capabilities and no-new-privileges. The failed rootless container never ran or received posts. Its empty runtime objects are retained rather than deleting volumes speculatively.

`scripts/mesh/reconcile-nostr-lab.mjs` explicitly reconciles at most 100 recent tagged lab text posts, verifies signatures and preserves original event IDs. It requires both endpoints to be reachable. This is manual bounded reconciliation, not continuous relay replication or a full-history backup. A post accepted by only one relay needs reconciliation after recovery. Private signing keys are not copied between hosts.

Verification passes: separate browser contexts load the two different host endpoints; a new post is accepted by both relays and delivered live. With **only relay 001 stopped**, a fresh HP-hosted page reads the original phone post, publishes successfully to relay 002, and retrieves the new post after reload. Relay 001 is restored and explicit reconciliation copies the HP-only post back. Both endpoints independently return **seven signature-verified posts**, including the original phone event. Evidence: ignored `artifacts/mesh-lab/nostr/two-host-verification.json` and `reconciliation-result.json`. One transient browser connection reset required a navigation retry; it did not establish a host outage. UniFi remains healthy. This test establishes primary-relay process independence, not full primary-computer power-off, air-gapped cold startup, or automatic replication.

## Earlier setup observations

Checkpoint 11a passes. The user confirms acceptance and posting. A fresh relay query independently retrieves **Hello from node 2**, verifies its signature, and records event ID `4d4ff4c07d1b5a636d6374b7e6ab93da6c5321e919d1e37a779fb71bb1320862`, created **5 October at 00:18:35 EAT**. HTTP requests from phone `10.21.0.199` also confirm the client loaded through node2. Public-event evidence is saved in ignored `artifacts/mesh-lab/nostr/phone-post-evidence.json`; no private key is recorded there.

The operator confirms the HP is connected but has no container software installed. Ping to its previously reserved address does not answer; this alone does not establish whether it is offline. Before selecting/installing the runtime, obtain its Windows edition/build, architecture, RAM, virtualization/SLAT state, WSL version and current lab IPv4 address. Docker's current Windows prerequisites are described in [its official installation guide](https://docs.docker.com/desktop/setup/install/windows-install/). The HP runtime and management access are not established, so do not assume a second relay is deployed. The next increment will run a separate persistent relay on that host, configure publishing to both relays and reconcile existing signed events. Merely starting another relay does not copy the existing posts. After that, validate each host has the same signed post through its own endpoint; avoid another sequence of page check codes.

An independent browser on the HP can open the same page to watch posts arrive live. This is optional for the first phone post; it does not require installing anything on the HP.

HP prerequisite report: **Windows 11 Pro, version 10.0.22631, 64-bit**. `wsl --version` prints an older command's usage rather than a version; this does not establish that a usable WSL 2 installation exists. RAM, CPU virtualization/SLAT and lab IPv4 were not visible in the pasted output. The mixed PowerShell objects can share the first object's table layout, hiding later fields. Repeat only those missing checks with explicit `Format-List`; also obtain `wsl --status`. Confirm an HP download path before installing WSL/container software, since the lab routers have no Internet default route. The original computer's home Wi-Fi does not supply Internet to the HP automatically.

The operator requests administrator SSH over Tailscale to replace manual prerequisite copying. This is authorized for the HP lab setup. The original computer **Doja** already runs Tailscale at **100.120.190.75**. Windows will use OpenSSH over the Tailscale network, since [Tailscale SSH's server component](https://tailscale.com/docs/features/tailscale-ssh) does not support Windows. A dedicated Ed25519 client key is stored in ignored `artifacts/mesh-lab/private/hp-ssh-ed25519`, with access limited to the operator account and SYSTEM. Its private half is never transferred to the HP.

Prepared bootstrap: `scripts/mesh/enable-hp-admin-ssh.ps1`. The HP must join the same tailnet, then run this script locally in elevated PowerShell. It installs Windows OpenSSH if needed, preserves existing configuration/authorized keys as timestamped local backups, adds the public key, sets administrator-key ACLs, configures public-key-only access for the current account, validates SSH configuration, and starts the service. The default installation firewall rule is disabled; a new rule permits TCP 22 from Doja's Tailscale address only. Other pre-existing firewall rules are not audited by this bootstrap. Administrator account names from unsupported formats stop before changes. Return the printed account, HP Tailscale IP and Ed25519 host fingerprint so the operator can verify and pin the target before SSH.

A temporary public-script-only server runs on **100.120.190.75:8001**, PID **8896**. It serves exactly `/enable-hp-admin-ssh.ps1`; unknown/private paths return 404. Script SHA-256: `8FE26A8A7994133ACAE85186555C947D5F6206E9BCEFC8A2350FD45DBF1087D5`. Stop the helper after the HP has downloaded it. The bootstrap has passed PowerShell syntax parsing and download/hash checks; execution on the HP and SSH access remain pending. Tailscale is an administration path, not a required dependency for local relay/client traffic or the OSPF mesh.

HP bootstrap result: the user ran the verified script. Host keys were generated and execution passed SSH syntax validation, but `Start-Service sshd` failed. The HP is now present as **Afribit / afribit-1**, Tailscale **100.88.182.58**; an authenticated Tailscale ping succeeds directly via home-LAN `192.168.100.177:41641` in 13 ms. SSH login is not established. Next collect the OpenSSH Admin event messages and SSH directory/configuration ACLs from the HP. Microsoft documents a possible directory-permission cause for this startup symptom, but the cause on this HP is not yet established. Do not reinstall or repeatedly rerun bootstrap before inspecting its service error. [Microsoft startup troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-server/system-management-components/error-1053-1067-7034-after-update-openssh-doesnt-start).

Subsequent HP diagnostics: OpenSSH/Admin contains no events. `C:\ProgramData\ssh` and `sshd_config` are owned by Administrators, with SYSTEM/Administrators FullControl and Authenticated Users ReadAndExecute; these reported ACLs do not show the suspected excessive-write or missing-SYSTEM permissions. Service configuration points to `C:\WINDOWS\System32\OpenSSH\sshd.exe`, Automatic startup, LocalSystem, no dependencies. The logs directory ACL, service return code and runtime diagnostic remain unknown. Next request `sc.exe start sshd`, the System service-control events and foreground `sshd.exe -ddd -e` per the upstream troubleshooting guide. Do not change these apparently correct folder/configuration ACLs speculatively.

Resolved administrator access: the operator supplies the HP Ed25519 host fingerprint **SHA256:X3+jhskachV+x/F/Nwkj8Zc0gfesqC5qpXNy2R66wu8**. A pinned, public-key SSH connection to the debug server authenticates as **afribit\edmun**, with administrator elevation confirmed. Direct inventory identifies **HP Z240 SFF Workstation**, **15.8 GiB RAM**, Intel Xeon E3-1225 v5, firmware virtualization and SLAT enabled. This replaces the earlier unverified laptop description. Home Ethernet is `192.168.100.177`; the HP currently has no `10.21.*` address, so its lab Wi-Fi must be restored for the second local relay endpoint after installation.

A bounded temporary SYSTEM diagnostic task exposes the actual failure: all three private host keys have an owner rejected by the LocalSystem daemon (`Bad owner`, `sshd: no hostkeys available`). Folder/config/log ACLs were otherwise correct. Their original ownership/ACLs were recorded in `C:\ProgramData\ssh\kibera-hostkey-acl-before.json`. The assistant normalized private host-key ownership to Administrators and permissions to SYSTEM/Administrators only, retaining the existing key material and fingerprint. The bootstrap source now includes this fix. The temporary diagnostic task was removed.

The Windows SSH service now runs automatically on **100.88.182.58:2222**, PID **1932** when verified. A fresh service connection verifies the same fingerprint, key authentication and administrator elevation. Port 2222 was used to avoid interrupting the original debug session during diagnosis. Firewall `Kibera-HP-SSH-Service-Operator` permits only Doja `100.120.190.75`; default broad OpenSSH rule remains disabled. Configuration backup: `C:\ProgramData\ssh\sshd_config.before-service-port-20261005`. The debug SSH connection has been closed. The temporary script-transfer server PID 8896 was verified and stopped; its previously advertised checksum describes the initial script, not the corrected source.

WSL provisioning is now launched on the HP with `wsl --install --no-distribution --web-download`, using elevated interactive scheduled task **Kibera-Install-WSL** so it survives closure of SSH command sessions. A first detached launch did not survive session closure and produced no installation output; it is not counted as installation. Task script/logs/result are under **C:\Users\edmun\KiberaMesh-Node2-Setup**. Installation completion and reboot requirements must be observed before deploying Podman or the second relay. No second relay is running yet. Relay 001 and the local phone board remain on the original computer.

WSL completion observed: installer PID **12208** exits **0**. Output confirms Virtual Machine Platform and Windows Subsystem for Linux installed, and says changes require a system reboot. `wsl --version` reports **3.0.1.0**, kernel **6.18.40.1**, Windows **10.0.22631.6199**. VirtualMachinePlatform reports EnablePending. The completed installer task is removed; logs and result files are retained. Host inventory and install-result snapshots are downloaded to ignored `artifacts/mesh-lab/hp-host-prerequisites.json` and `hp-wsl-install-result.json`. Await the operator's normal restart/sign-in before creating the Podman VM. The source's original private host-key owner omission has been corrected without rotating any host key.

## What runs where

| Component | Location | Purpose |
| --- | --- | --- |
| Existing MikroTik OSPF network | Both routers | Carries IP traffic over wired or radio paths |
| `nostr-rs-relay` 0.10.0 | Container `kibera-nostr-relay-001` on the original computer | Accepts signed events, persists them in SQLite, serves subscriptions |
| Persistent database | Podman volume `kibera-nostr-db` | Retains posts independently of the container process |
| Local relay endpoint | `ws://10.20.0.10:7777/` | Lab-only front door, restricted to the two lab subnets |
| Container endpoint | `127.0.0.1:7778` | Loopback-only runtime forwarding |
| Board and bundled SDK | `http://10.20.0.10:8020/` | Phone/browser signing, publishing and live reading; no CDN assets |
| Independent HP relay | `ws://10.21.0.198:7777/`, container `kibera-nostr-relay-002` | Separate host, WSL machine and SQLite volume `kibera-nostr-db-002` |
| Independent HP board | `http://10.21.0.198:8020/` | Serves the same locally bundled client from the HP; either relay can supply posts |

The phone is an application participant that can create signed posts. It does not become an always-on routing node or a relay by opening this page. There are now **two independently hosted relays**, each with its own database and board endpoint. Media files remain on the existing media services; Nostr stores posts and references, not the WAV objects. An established Blossom server is the next media integration candidate.

## Runtime and isolation

Docker Desktop was installed but exited before its engine became ready, including a retry without the IDE's `ELECTRON_RUN_AS_NODE` environment variable. This step uses the already running Podman engine through `scripts/mesh/run-lab-podman.py`. It shares the VM/runtime with UniFi, but has a separate container, bridge network, read-only configuration mount and database volume. The UniFi container was not restarted or reconfigured and remained healthy. This is service separation within one host, not an independent failure domain.

The image is pinned to `docker.io/scsibug/nostr-rs-relay@sha256:48d54c2d2781577cf3ed2951112f0953dc2c5e7c9d2ea20c64e8c0fa37d16e4d`. Configuration source: `scripts/mesh/nostr-relay-lab.toml`; deployed copy: ignored `artifacts/mesh-lab/nostr/config.toml`. Limits include 256 MiB container memory, one CPU, 16 KiB events and five event creations per second. The lab allows public posts from connected clients; there is no membership system or disk quota yet.

Container creation used these commands from the repository root, after pulling the pinned image and copying the configuration into the ignored directory:

```powershell
py scripts/mesh/run-lab-podman.py network create kibera-nostr-lab
py scripts/mesh/run-lab-podman.py volume create kibera-nostr-db
py scripts/mesh/run-lab-podman.py run --detach --name kibera-nostr-relay-001 --network kibera-nostr-lab --publish 127.0.0.1:7778:8080 --mount type=volume,source=kibera-nostr-db,target=/usr/src/app/db --mount type=bind,source=/mnt/d/dev/wifi/artifacts/mesh-lab/nostr/config.toml,target=/usr/src/app/config.toml,readonly --memory 256m --cpus 1 --cap-drop ALL --security-opt no-new-privileges --restart unless-stopped docker.io/scsibug/nostr-rs-relay@sha256:48d54c2d2781577cf3ed2951112f0953dc2c5e7c9d2ea20c64e8c0fa37d16e4d
```

Do not repeat creation against the running resources. `--restart unless-stopped` operates within the running container engine; it does not establish Windows/VM startup. The Python front door and board server also require explicit startup. Full cold-start recovery and database backup/restore remain pending.

The SDK/build dependencies are isolated in ignored `artifacts/mesh-lab/nostr`, with exact direct versions `nostr-tools@2.25.2` and `esbuild@0.28.2`, plus its npm lockfile. No application package dependencies changed. Build the source `scripts/mesh/nostr-lab-client.js` using esbuild with `nodePaths` set to that isolated `node_modules`, bundle as ESM to `public/client.js`, and copy `nostr-lab-client.html` to `public/index.html`. The current build helper is `artifacts/mesh-lab/nostr/build-client.mjs`.

Foreground startup commands, only when the current listeners are absent:

```powershell
py scripts/mesh/forward-nostr-relay.py
```

In a separate terminal:

```powershell
py scripts/mesh/serve-nostr-client.py artifacts/mesh-lab/nostr/public
```

Current hidden Python processes: front door PID **51348**, board PID **15028**. Logs and generated assets are under `artifacts/mesh-lab/nostr`. Stop only these verified processes and `kibera-nostr-relay-001` to undo this step; preserve the database volume. No router changes were needed.

## Verified evidence

- NIP-11 metadata identifies the expected relay, software/version and supported NIPs.
- A signed kind-1 post was accepted, independently queried by ID and verified through the SDK. Event ID: `f50dda90fa4a49042af0c4c4d5efe8eef9cf15e19cfded77dd33387af77063f8`.
- The same event was retrieved with a valid signature after restarting only the relay container: persistent storage passes.
- Two independent Edge browser contexts loaded the board, published and received a live post, then retrieved it after page reload. No browser errors occurred. The subsequent iPhone post through node2 also passes, with independent signature verification as recorded above.
- Windows listeners were inspected: only `10.20.0.10:7777`, `10.20.0.10:8020` and loopback `127.0.0.1:7778` for this increment.
- The UniFi container remained running and healthy. The HP media service independently served two verified WAV objects at the start of this step. A final later request to its catalogue timed out; do not infer continued HP uptime from the earlier result. This does not affect the relay, which runs on the original computer.

## Lab identity and transport limits

The board generates a disposable secret key locally and retains it only in the browser tab's session storage when available. It never asks for an existing personal key or sends the secret key to the relay. Closing the tab or clearing its storage can lose this identity; it is not a backed-up account. Posts are public and the current HTTP/WebSocket transport is unencrypted. Use sample content. Durable identities, trusted HTTPS, membership/moderation and capacity policies belong to the next application design before community deployment.
