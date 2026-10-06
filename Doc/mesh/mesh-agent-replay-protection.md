# Signed controller requests: replay protection and release order

Prepared 6 October 2026. The implementation and isolated tests are complete;
the additive table, dual-header controller and strict API are deployed. The
21:35 EAT read-only live check accepted a fresh request, rejected its exact
replay, accepted another fresh nonce and rejected nonce-less legacy traffic.
Release evidence is recorded in the
[security release](mesh-security-release-2026-10-06.md). This document does not
claim that a new customer purchase or field migration has passed.

## What changed

The previous gateway HMAC authenticated the exact POST path, body and timestamp,
but accepted the same signed request again within its 60-second clock window.
Repeated context requests could mint additional browser capabilities. This was
a replay boundary in authenticated controller traffic, not a demonstrated
anonymous payment or router bypass.

The controller now generates a fresh 32-byte nonce for each request. A second
signature binds the router ID, timestamp, method, path, nonce and exact body.
It retains the original signature so the updated controller can communicate
with the earlier API during rollout. A request presenting a partial or invalid
second signature cannot fall back to legacy authentication.

After signature verification, the API atomically claims a hashed request key
in PostgreSQL before doing route work. The primary key admits one request even
across concurrent serverless workers. Replays return 403. A legitimate retry
needs a fresh nonce; payment/order idempotency remains independently required.
The table stores only the hashed key, router ID and expiry, not the nonce,
signature, customer body or payment details.

Claims remain for five minutes, longer than the timestamp acceptance range.
Each claim deletes at most 500 expired rows using a locked, bounded cleanup.
A missing/unavailable replay table fails authentication closed; there is no
in-memory fallback. Database availability is consequently part of controller
availability and must be monitored.

## Deploy without breaking the controller

1. Keep the existing TLS entry and access ledger. Retain the current controller
   bundle, environment, API deployment ID and reviewed rollback files privately.
   Pause new purchases if the rollout interrupts gateway connectivity.
2. Deploy the controller that sends both signature versions **before** the
   strict API. Confirm it still reaches the existing API and the pinned router,
   with one worker and unchanged TLS/loopback and router-enrollment settings.
3. Install only the additive schema in
   [agent-replay-schema.sql](../../scripts/mesh/agent-replay-schema.sql):
   `mesh_agent_requests` and its expiry index. Verify them without altering
   customer orders, payment receipts, voucher stock or access deadlines.
4. Deploy the strict API. Keep `MESH_AGENT_LEGACY_AUTH_UNTIL` unset for the
   normal rollout. Verify the controller heartbeat and a read-only signed
   readiness request. Reusing the identical request must return 403; a fresh
   nonce must succeed. Do not use a financial route for this check.
5. Recheck TLS guest attestation and public forged-header denial before
   publishing billing readiness. An unpaid physical phone's catalogue check
   and a subsequent approved payment are separate acceptance gates.

New-controller/old-API compatibility does not mean the old API itself rejects
replays. The protection is complete only when the strict API and durable table
are active together.

## Rollback and temporary compatibility

The new controller can remain in place during a rollback to the earlier API.
Rolling back **only the controller** to one that sends no nonce will cause the
strict API to reject it. Either use a reviewed paired API rollback, or explicitly
configure a brief `MESH_AGENT_LEGACY_AUTH_UNTIL` transition while restoring the
new client. It accepts only an exact UTC ISO timestamp with milliseconds and a
future deadline no more than 24 hours away. An absent, invalid or expired value
disables legacy authentication. Even during that window, legacy signatures
still receive durable replay claims; identical signed requests cannot be reused.

Do not set an indefinite compatibility switch, remove the replay table during
an API rollback, or restore the plaintext guest capability path. Keep billing
paused and the controller in standby if pinned router access, database claims
or TLS attestation cannot be verified. Voucher HMAC migration has its own
[rollback constraint](mesh-voucher-lookup-hardening.md); an older SHA-only
application cannot safely replace the current lookup implementation by itself.

## Evidence and remaining abuse work

[Replay tests](../../tests/mesh-agent-replay-security.test.ts) exercise twelve
concurrent real context handlers against an isolated PostgreSQL-compatible
database: one capability is minted and eleven repeats are denied. They also
cover same-second fresh requests, signature tampering, forbidden downgrade,
dated legacy expiry, bounded cleanup and a missing replay table. No real
payment, access grant or provider request is part of those tests.

The related [voucher limit tests](../../tests/voucher-rate-limit.test.ts)
exercise atomic device, trusted-source and global gates. A blocked device can
no longer spend downstream budgets; an exhausted trusted source cannot spend
the global budget by rotating device addresses. Independent clients still hit
the unchanged global ceiling. This fixes the single blocked-client denial of
service; it does not eliminate distributed guessing, shared-source contention
or MAC spoofing. Inventory-aware voucher issuance and field capacity remain
separate work.
