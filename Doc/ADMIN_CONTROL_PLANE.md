# Afribit Admin Control Plane and Router Onboarding

## Decision

Afribit needs both:

- an operator interface under `/admin`; and
- a versioned, passkey-authenticated JSON control API under `/api/admin/v1`.

The current `/admin` pages are useful views and server actions, but they are not a coherent API for router inventory, onboarding, readiness checks, automated test setup or external operations tooling. The control API should become the single application boundary used by the admin UI and test tooling.

An admin API helps testing, but it is not a substitute for test isolation. Automated tests should seed an isolated database directly or through dedicated test fixtures. Production-only admin credentials must never be embedded in CI.

## First control-plane slice

Build these capabilities before Bitika:

| Capability | Purpose |
| --- | --- |
| Readiness | Show which required systems are configured and reachable without exposing values |
| Sites | Give routers and APs an ownership/location boundary |
| Router inventory | Store identity, model, RouterOS version, management address and lifecycle state |
| Agent enrollment | Exchange a one-time code for a per-agent credential |
| Heartbeat | Report agent/router status and capabilities |
| Connectivity test | Run read-only RouterOS checks before mutation access is enabled |
| Job leases | Prevent a crashed agent from permanently claiming work |
| Reconciliation | Compare desired grants with actual managed bindings/queues/sessions |
| Audit events | Record every enrollment, rotation, activation and test action |

## API surface

### Human-admin endpoints

All endpoints require a valid passkey-created admin session, same-origin enforcement for mutations, JSON content type, and audit logging.

| Method and path | Purpose |
| --- | --- |
| `GET /api/admin/v1/readiness` | Configuration and dependency readiness, with booleans/status only |
| `GET /api/admin/v1/sites` | List sites and router/agent summary |
| `POST /api/admin/v1/sites` | Create a site |
| `GET /api/admin/v1/routers` | List routers, lifecycle state, last heartbeat and drift |
| `POST /api/admin/v1/routers` | Register expected router metadata and generate one-time enrollment code |
| `GET /api/admin/v1/routers/{routerId}` | Router, agent, capabilities, jobs, tests and observed state |
| `POST /api/admin/v1/routers/{routerId}/rotate-enrollment` | Invalidate unused code and issue another one-time code |
| `POST /api/admin/v1/routers/{routerId}/activate` | Allow mutation jobs after tests pass |
| `POST /api/admin/v1/routers/{routerId}/suspend` | Stop new grants and flag current desired state |
| `POST /api/admin/v1/routers/{routerId}/credentials/rotate` | Rotate the enrolled agent secret |
| `POST /api/admin/v1/routers/{routerId}/tests` | Queue an approved read-only or bounded mutation test |
| `GET /api/admin/v1/test-runs/{testRunId}` | Return step-by-step result and evidence |
| `POST /api/admin/v1/router-jobs/{jobId}/retry` | Retry a dead-letter job after operator review |
| `POST /api/admin/v1/reconciliation-runs` | Compare desired and observed router state |

`GET /readiness` should report information such as:

```json
{
  "status": "not_ready",
  "database": { "status": "ok" },
  "btcpay": { "configured": true, "walletReady": false },
  "bitika": { "configured": false, "mode": null },
  "network": {
    "registeredRouters": 1,
    "activeRouters": 0,
    "healthyAgents": 0,
    "failedJobs": 0
  },
  "checks": [
    { "code": "router_agent_offline", "severity": "blocker" }
  ]
}
```

It must never return database URLs, tokens, keys, wallet secrets, RouterOS credentials or environment-variable values.

### Machine-agent endpoints

These are not admin-session endpoints. They use one-time enrollment credentials initially and a per-agent credential after enrollment.

| Method and path | Purpose |
| --- | --- |
| `POST /api/gateway/v1/enroll` | Exchange router ID plus one-time code for agent identity and secret |
| `POST /api/gateway/v1/heartbeat` | Report agent/router version, reachability, capabilities and config fingerprint |
| `POST /api/gateway/v1/jobs/claim` | Lease the next job assigned to this router |
| `POST /api/gateway/v1/jobs/{jobId}/renew` | Extend lease for a long-running job |
| `POST /api/gateway/v1/jobs/{jobId}/complete` | Submit idempotent success/failure result |
| `POST /api/gateway/v1/observations` | Upload bounded session and managed-artifact observations |

The existing `/api/gateway/jobs/*` routes can remain temporarily as v0 compatibility endpoints, then be removed after the enrolled-agent flow is commissioned.

## Required data model

### `sites`

- `id`
- `name`
- `slug`
- `timezone`
- `status`
- `created_at`, `updated_at`

### `routers`

- `id`
- `site_id`
- `name`
- `expected_identity`
- `management_host` — metadata for operator/agent configuration, never publicly returned
- `model`, `serial_number`, `routeros_version`
- `enforcement_mode` — initially `hotspot_ip_binding`, later `radius_hotspot` or `radius_pppoe`
- `status` — `pending`, `enrolled`, `testing`, `active`, `suspended`, `retired`
- `last_seen_at`, `last_config_fingerprint`
- timestamps

### `gateway_agents`

- `id`
- `router_id`
- `name`
- `credential_hash` — plaintext token is returned only once
- `status`
- `software_version`
- `capabilities`
- `last_heartbeat_at`
- `last_ip`
- `revoked_at`
- timestamps

### `router_enrollment_codes`

- `id`
- `router_id`
- `code_hash`
- `expires_at`
- `used_at`
- `created_by`
- `revoked_at`

### Changes to `router_jobs`

- add `router_id`
- add `claimed_by_agent_id`
- add `idempotency_key`
- add `lease_expires_at`
- add `cancelled_at`
- add `result`
- add dead-letter state
- unique constraint on `(router_id, idempotency_key)`

### `router_observations` and `test_runs`

Store bounded snapshots and test evidence. High-volume accounting data should eventually move to purpose-built session/usage tables rather than unbounded JSON.

## MikroTik onboarding workflow

### Stage 1 — prepare safely

1. Record router model, serial number, RouterOS version, interface names, WAN mode and customer subnet.
2. Export text configuration and create a binary backup.
3. Verify the intended customer subnet does not overlap WAN or management networks.
4. Give the gateway-agent host a reserved/static address.
5. Confirm the UniFi AP is in AP/bridge mode and its guest SSID/VLAN reaches the MikroTik.

No cloud action is performed in this stage.

### Stage 2 — register expected equipment

1. An operator signs into `/admin` with a passkey.
2. Create the site.
3. Create the router record with expected RouterOS identity and management metadata.
4. The system creates a high-entropy enrollment code, stores only its hash and displays the plaintext once.
5. The router remains `pending`; it cannot receive mutation jobs.

### Stage 3 — install and enroll the LAN agent

1. Install the gateway agent on an always-on edge machine.
2. Configure only cloud URL, router ID, one-time enrollment code and local RouterOS connection details.
3. The agent calls `/api/gateway/v1/enroll`.
4. The service validates unused code, expiry and expected router record, then atomically consumes it.
5. The service returns an agent ID and random agent secret once; the agent stores them locally with restricted permissions.
6. The cloud stores only the secret hash.

RouterOS credentials remain on the LAN agent. They are never sent to or stored by Vercel.

### Stage 4 — discover capabilities

The enrolled agent performs read-only requests:

- `/system/resource`
- `/system/package`
- `/system/identity`
- interface, bridge and address inventory
- HotSpot server/profile inventory
- DHCP server/network/pool inventory
- managed walled-garden, IP-binding and queue records
- REST/API service configuration relevant to the agent

The agent sends a normalized capability report and configuration fingerprint. A mismatch with `expected_identity`, unsupported RouterOS version, overlapping subnet or missing interface blocks activation.

### Stage 5 — preview and apply configuration

1. Generate a router-specific configuration preview from stored site/router settings.
2. Show additions and changes in admin; do not silently reset or remove unrelated configuration.
3. Require explicit operator confirmation for the first apply.
4. Use RouterOS dry-run where available, then apply during the test window.
5. Record every command category and sanitized result in the audit log.
6. Preserve the tested rollback steps with the router record.

### Stage 6 — acceptance test

Run a controlled test suite:

1. Agent heartbeat and RouterOS read access.
2. DNS/DHCP on the test SSID.
3. Guest isolation from management and peer clients.
4. Portal redirect with signed context.
5. Walled-garden access and unrelated-site denial.
6. Five-minute test grant for a designated test MAC.
7. Observed internet access during the grant.
8. Explicit revoke and observed loss of access.
9. Natural expiry and artifact cleanup.
10. Agent restart while a test job is leased.
11. Router reboot followed by reconciliation.

Only after all blocking tests pass can the operator move the router to `active`.

## Admin interface additions

Add these navigation areas:

- **Readiness** — blockers before a real customer can pay and connect;
- **Sites & routers** — inventory, enrollment, configuration and lifecycle;
- **Agents** — heartbeat, version, credential rotation and logs;
- **Test runs** — guided feature tests and evidence;
- **Reconciliation** — desired versus observed payments, grants and router state;
- **Community** — later, lessons, sponsor funds, rewards, events and cached content.

The header must not say “System online” based only on successful page rendering. It should derive status from database availability, payment readiness, active-router heartbeat and unresolved blocking failures.

## Test strategy enabled by the control plane

| Layer | Test method | Production access? |
| --- | --- | --- |
| Pure domain logic | Unit tests for prices, status transitions, expiry and reward rules | No |
| Database invariants | Integration tests against disposable/isolated PostgreSQL | No |
| Provider adapters | BTCPay test store/mocks and Bitika sandbox/failure numbers | No real funds |
| Admin API | Passkey/session test fixture in isolated environment | No |
| Gateway protocol | Fake RouterOS server plus job lease/retry tests | No |
| Router acceptance | Designated MikroTik, agent and test client MAC | Yes, test site only |
| Production smoke | Readiness, health and explicitly approved low-value purchase | Minimal and auditable |

Every test run should record environment, application commit, agent version, router identity/version, steps, timestamps, sanitized outputs and pass/fail state. This is how the team learns from mistakes without guessing what changed.

## Security requirements

- Human API access derives from a recently verified passkey session.
- Mutations check origin and use same-site cookies or an explicit CSRF token.
- Enrollment codes and agent secrets are random, short-lived/rotatable and hashed at rest.
- An agent can claim jobs only for its assigned router.
- A pending/testing router cannot receive customer grant jobs.
- Job payloads are typed and validated by job type; arbitrary RouterOS commands are forbidden.
- Readiness and logs redact secrets, authorization headers and customer payment data.
- Credential rotation supports overlap for a short controlled window to avoid bricking an edge agent.
- All lifecycle transitions and manual tests produce audit records.

## First implementation milestone

The first code milestone should implement:

1. isolated test-environment guards;
2. `sites`, `routers`, `gateway_agents` and enrollment-code tables;
3. authenticated `GET /api/admin/v1/readiness`;
4. admin site/router create and list endpoints;
5. one-time `POST /api/gateway/v1/enroll`;
6. authenticated agent heartbeat;
7. a read-only RouterOS connectivity test;
8. admin pages for Readiness and Sites & Routers;
9. unit/integration tests for authorization, code expiry/reuse and router ownership.

This milestone creates the safe platform needed to onboard the existing MikroTik and test every later feature together.
