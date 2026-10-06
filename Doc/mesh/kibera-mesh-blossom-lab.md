# Kibera Mesh Blossom storage lab

Deployed and verified 5 October 2026. Two independent service hosts run the existing [hzrd149/blossom-server](https://github.com/hzrd149/blossom-server) implementation, version 6.4.0, upstream commit `7701f43011c1474dffbf5db3d69b40f488bf662c`. There is no custom Blossom protocol server. The existing Python TCP front door only restricts lab source networks and forwards bytes to the container's loopback port.

## Deployed endpoints

| Host | Server and upstream landing page | Persistent Podman volume | Container |
| --- | --- | --- | --- |
| KM-LAB-001 | http://10.20.0.10:8030/ | `kibera-blossom-data-001` | `kibera-blossom-001` |
| HP / KM-LAB-002 | http://10.21.0.198:8030/ | `kibera-blossom-data-002` | `kibera-blossom-002` |

Both containers publish only to Windows loopback `127.0.0.1:8031`, forwarding to container port 3000. The lab front door binds to each host's explicit lab IP on port 8030 and accepts only `10.20.0.0/24` and `10.21.0.0/24`. The HP additionally has the matching narrow Windows firewall rule `Kibera-HP-Blossom-Lab`. Both use a separate named data volume containing SQLite metadata and blob bytes under `/app/data`, independently of Nostr databases and the earlier media-copy prototype.

The upstream image is pinned for subsequent deployments:

```text
ghcr.io/hzrd149/blossom-server@sha256:36f87c950992b8e8a1a0ac8fbf15fd5afa34e9283068a6916b63b05ea3a8d817
```

Initial primary pull used the upstream `master` tag; its resolved digest and OCI source revision were inspected and match this pin. Runtime image ID on both machines is `36fed40be7fcb2f42ef6ab5427070a75a330e67fc126c807d64a91c802797276`.

Each container has 384 MiB memory and one CPU limits, dropped Linux capabilities and `no-new-privileges`. Primary uses the existing vendor Podman VM without modifying UniFi. HP uses its existing isolated `km-lab-002-root` connection without changing Nostr. Container restart policy is `unless-stopped`.

## Configuration and startup

[`blossom-lab.yml`](../../scripts/mesh/blossom-lab.yml) requires signed Nostr upload/delete/list authentication, limits each upload to 10 MiB, and uses one upload worker with two simultaneous jobs. The lab accepts any MIME type with a one-year inactivity retention rule. This is a lab setting, not an approved community retention policy or storage quota.

The upstream's empty-rule behaviour rejected the audio sample with HTTP 415 despite its example configuration describing empty rules as unrestricted. A concrete wildcard rule was configured and tested instead; no server source was patched.

Media transcoding, admin dashboard and server-side `/mirror` are disabled. Upstream mirror protection deliberately rejects private IP destinations, including these LAN addresses. Preserve that protection. Our verified LAN copy fetches from server 001, checks SHA-256, then performs a separately signed standard upload to server 002. It does not claim BUD-04 mirroring or automatic replication.

Primary front door is currently a hidden Python process. The registered user-login task `Kibera-Blossom-001` invokes [`start-primary-blossom.ps1`](../../scripts/mesh/start-primary-blossom.ps1) on future login. HP's running interactive administrator task `Kibera-Blossom-002` invokes a deployed copy of [`start-hp-blossom.ps1`](../../scripts/mesh/start-hp-blossom.ps1) and keeps its front door alive. HP files/logs are in `C:\Users\edmun\KiberaMesh-Blossom`. Tasks allow unlimited runtime and three retries at one-minute intervals. Cold boot/login startup has not yet been tested. HP depends on its existing Podman machine being available; this startup script does not replace or restart the Nostr VM provisioning task.

Offline-start preparation: the HP launcher now waits for the local Podman backend to become ready and checks whether the pinned image is cached. It pulls only if the image is absent, avoiding the previous unconditional registry request on every login. Nostr startup still owns VM activation. This change prepares an offline restart test; it does not establish successful cold startup until that test is observed.

Observed offline restart, 5 October: with HP home Ethernet disconnected and Node2 Wi-Fi connected, its Blossom task automatically returns to serving after login. Independent retrieval returns the retained 38,444-byte WAV with the same SHA-256. Direct-IP external HTTPS times out, and diagnosis uses pinned SSH over the mesh. This passes HP Blossom startup without internet after login; it does not test pre-login service startup or a whole-network power outage. The board startup gap found in the same experiment is recorded separately in the runbook.

## Acceptance evidence

[`verify-blossom-lab.mjs`](../../scripts/mesh/verify-blossom-lab.mjs), bundled using the lab's existing isolated nostr-tools/esbuild dependencies, generated a disposable Nostr key in memory. It signed short-lived, host-scoped kind-24242 authorization events with the object's hash. No private key was persisted or printed. Authentication follows [BUD-11](https://github.com/hzrd149/blossom/blob/master/buds/11.md); uploads and descriptors follow [BUD-02](https://github.com/hzrd149/blossom/blob/master/buds/02.md).

The explicitly selected generated WAV sample is 38,444 bytes:

```text
22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d
```

On both servers:

- Anonymous upload: HTTP 401.
- Expired signed authorization: HTTP 401.
- Valid signed upload: HTTP 201 and descriptor with matching hash and size.
- Independent retrieval: exact SHA-256 and 38,444-byte size match.
- Audio range request `bytes=0-43`: HTTP 206 and 44 bytes.

Second upload used the verified bytes downloaded from the first server. Both hosts now independently retain the same object. Results are in ignored `artifacts/mesh-lab/blossom/blossom-verification.json`. Independent Python retrieval also confirmed both copies. One later HP TCP connection timed out transiently; subsequent probes and independent retrievals succeeded, and its scheduled task and listener remained running.

Direct sample playback URLs:

- http://10.20.0.10:8030/22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d.wav
- http://10.21.0.198:8030/22c999b6af2442c71a0f75d69e90c57efe52c9939919896e0b9c93a5522a6a0d.wav

The upstream landing page offers upload using its own client. Its generated browser identity is saved in browser local storage; use only a disposable lab identity, and treat clearing browser storage as losing that ownership key. Phone upload/playback through this landing page remains an operator acceptance step; terminal protocol checks are complete.

## Remaining boundaries

All reads are public to reachable lab clients. Signed upload authorization proves a key authorized the action; it does not encrypt the media, authenticate a resident or set a per-person quota. HTTP is used on the isolated lab, with no production TLS or key-recovery policy. A content hash is not a secret. No private gallery was imported.

Two servers holding this sample do not make future uploads automatically replicated. New uploads through either landing page currently stay on that server until an explicit copy is requested. There is no background reconciliation worker, integrated board attachment interface, replica-aware reader, advertised Nostr media-server list, full backup strategy or production moderation/quota policy. Storage capacity is limited by the existing hosts and runtime volumes; no SSD/Pi purchase is required for this experiment. Next application work should expose verified replica locations and deliberate upload/copy policy before presenting durable availability to users.
