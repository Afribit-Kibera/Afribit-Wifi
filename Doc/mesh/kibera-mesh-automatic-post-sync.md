# Kibera Mesh automatic signed-post catch-up

Deployment: 5 October 2026. This extends the existing nostr-tools reconciliation client; the two upstream nostr-rs-relay servers and their independent databases are unchanged.

## Operation

Each computer runs its own copy of `scripts/mesh/reconcile-nostr-lab.mjs` in `--watch` mode. A worker queries both relay endpoints, verifies the completed snapshots, publishes missing original signed events and independently retrieves the stored copies. Cycles are sequential and repeat after a 30-second pause. Neither worker requires signing keys or calls a cloud API. Publishing the same event ID from both workers is idempotent; per-worker copied counters count acknowledged publications rather than globally unique transfers.

The Windows tasks are **Kibera-Nostr-Sync-001** and **Kibera-Nostr-Sync-002**, triggered at the respective operator's login, with unlimited runtime, three one-minute process-restart retries and IgnoreNew instance policy. Each task directly owns its Node process. An initial PowerShell wrapper left a child alive when stopped; that wrapper was replaced, and only matching lab worker processes were cleaned up. Current direct tasks avoid that parent/child ownership problem. Automatic network retries happen inside the worker without starting additional processes.

Primary files: ignored `artifacts/mesh-lab/nostr/sync/`. HP files: `C:\Users\edmun\KiberaMesh-Nostr\sync`. The bundled worker has its dependencies included. Both use a local copy of the existing **Node v24.20.0** executable. Its OpenJS Foundation Authenticode signature is Valid on both hosts; the HP transfer hash matches **5C976096E04E5C2C1F091938926234CC9FBEBFE9787DDD149351B3B0ECC707B5**. No HP internet download, npm install or repository-root dependency change was needed.

## Scope and status

- Only kind-1 posts tagged `kibera-mesh-lab` are copied.
- A source query or combined history reaching **100 events** pauses copying with `window-limit`; fewer than 100 is the supported lab scope. This avoids pretending a truncated latest-post query is complete history.
- Connection failure, incomplete query, invalid signature or failed publication records `retrying` and preserves the previous successful result. Unavailability is never treated as an empty database. An eight-second snapshot deadline precedes the SDK's synthetic EOSE timeout.
- Copies retain IDs, content and signatures. One-second pacing leaves room for both workers within the configured relay rate limit.
- No blobs, profiles, deletion requests or retention decisions are synchronized. The worker is unsuitable for production deletion/retention semantics; these require a separate design.

Each worker atomically writes `sync-state.json` and `reconciliation-result.json` beside its bundle. State includes last attempt, last successful check, result counts, publication count and current error. Each local board exposes the limited status fields at **/sync-status** and shows a recent check, pending retry, stale state or post-limit pause. A last successful check is not a promise that a just-created post has already been copied. The browser refreshes this status every 30 seconds.

For maintenance, stop the appropriate Windows task before replacing its bundle and verify no matching lab worker process remains. A manual one-shot run remains available through the separately built `artifacts/mesh-lab/nostr/reconcile.mjs`; avoid running it against a watch worker's state directory. Both hosts still require Windows login for scheduled startup; offline cold startup of these newly added tasks remains untested.

## Verification

Baseline: both worker states report synced with ten existing posts. The verification then pauses Primary's worker and confirms its process is gone, stops only the Primary relay container, observes HP retry status, publishes a disposable signed post to HP, and restores the Primary relay. Only the HP worker can perform the catch-up during this window. The test does not invoke one-shot reconciliation. It queries Primary for the original event ID/signature, waits for HP's verified synced result, then restores the Primary worker in a finally block. UniFi, routers and both computers remain running.

Verification passes. HP detects the outage (`retrying`), accepts the new signed test post locally, then automatically copies it to Primary after its relay returns, while the Primary worker is confirmed absent. HP completes its independent verification and changes status to `synced`. The new event ID is **c9e50d6efb1d13ec090b73f5f8ef7f411023dbdb33bb7bc959418a7ea2612baf**. Both relays now contain **12 verified tagged posts**. No manual reconciliation command was invoked during the successful test. The Primary worker is restored afterwards; exactly one worker is observed per host. Both board pages show a recent stored-copy check with no browser errors, and UniFi remains healthy.

Evidence: ignored `artifacts/mesh-lab/nostr/automatic-sync-verification.json`. An initial test caught a stopped wrapper leaving its Node child alive, and a status check running before post-copy verification completed. Those observations led to direct task ownership, explicit process absence checks and waiting for the final status before claiming success. No additional computer reboot or power-off test was used.
