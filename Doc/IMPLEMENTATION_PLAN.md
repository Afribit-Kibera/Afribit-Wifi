# Bitcoin Valley WiFi Backend Implementation Plan

## Delivery Status - 24 August 2026

- Completed: Next.js application, Vercel project, Neon PostgreSQL, schema, seed data, passkey-only admin authentication, mobile-first portal, package management, payment ledger, voucher batches and export, free-site policy, manual access controls, BTCPay integration code, short payment connectivity grants, gateway job API, and local MikroTik agent.
- Verified: lint, TypeScript, production build, database health, authenticated admin flow, desktop portal, mobile portal, and voucher admin controls.
- Activated: production DNS/TLS, current BTCPay API key, signed BTCPay webhook, Neon security schema, and three operator-provisioned admin device slots.
- Pending external activation: connect the receiving wallet and Lightning source to the BTCPay store, enroll the approved devices, provide MikroTik credentials, install the gateway agent on the LAN, and import the router configuration.
- Deferred by product decision: M-Pesa/Bitika and L402 remain later phases.

## 1. Recommended Technical Direction

Build a single Next.js application for the portal, admin dashboard, and backend API, deployed on Vercel under `wifi.afribit.africa`. Use PostgreSQL for persistent state and a small local gateway agent inside the Wi-Fi network to apply MikroTik authorization commands.

This gives the project a clean production path:

- Vercel hosts the user portal and admin backend.
- BTCPay Server sends payment webhooks to the Vercel API.
- PostgreSQL stores packages, sessions, payments, and authorization jobs.
- A local gateway agent securely polls the backend and talks to MikroTik from inside the LAN.
- MikroTik does not need to expose its API directly to the public internet.

## 2. Repository Setup

Target GitHub repository:

- `https://github.com/novyrix/Afribit-Wifi.git`

Do not commit secrets. Credentials should be configured only as local environment variables, Vercel project environment variables, or gateway agent environment variables.

Initial repository structure:

```text
/
  app/                         # Next.js app router pages and layouts
  app/api/                     # Backend API routes
  components/                  # Shared UI components
  lib/                         # Server utilities and integrations
  prisma/                      # Database schema and migrations
  gateway-agent/               # Local MikroTik executor service
  Doc/                         # Product and implementation docs
  README.md
  .env.example
```

## 3. Secrets And Environment Variables

Create `.env.example` with names only, never real values:

```bash
DATABASE_URL=
BTCPAY_SERVER_URL=
BTCPAY_STORE_ID=
BTCPAY_API_KEY=
BTCPAY_WEBHOOK_SECRET=
AUTH_SECRET=
WEBAUTHN_RP_ID=wifi.afribit.africa
WEBAUTHN_ORIGINS=https://wifi.afribit.africa
GATEWAY_AGENT_TOKEN=
MIKROTIK_HOST=
MIKROTIK_USERNAME=
MIKROTIK_PASSWORD=
MIKROTIK_USE_TLS=true
```

Production values should be added through:

```bash
vercel env add DATABASE_URL production
vercel env add BTCPAY_SERVER_URL production
vercel env add BTCPAY_STORE_ID production
vercel env add BTCPAY_API_KEY production
vercel env add BTCPAY_WEBHOOK_SECRET production
vercel env add AUTH_SECRET production
vercel env add GATEWAY_AGENT_TOKEN production
```

Gateway agent secrets should live only on the local machine that runs the agent.

## 4. Phase 0: Project Creation

Objective: create the application skeleton and deployment target.

Tasks:

- Initialize or clone the GitHub repository.
- Create a Next.js TypeScript application.
- Add linting, formatting, and basic CI checks.
- Create a new Vercel project.
- Configure `wifi.afribit.africa` in Vercel.
- Add `.env.example`.
- Add production environment variables in Vercel.
- Add a health endpoint at `/api/health`.

Exit criteria:

- App deploys successfully to Vercel.
- `https://wifi.afribit.africa/api/health` returns healthy status.
- No secrets exist in committed files.

## 5. Phase 1: Database And Core Models

Objective: establish persistent state for packages, sessions, payments, and router jobs.

Tasks:

- Choose PostgreSQL provider.
- Add Prisma or Drizzle ORM.
- Create schema for:
  - admin users
  - packages
  - portal sessions
  - payments
  - access grants
  - router jobs
  - audit logs
  - vouchers
- Add migrations.
- Add seed script for initial packages.
- Add database connection health checks.

Exit criteria:

- Migrations run locally and in production.
- Initial packages can be seeded.
- Application can read active packages from the database.

## 6. Phase 2: Captive Portal

Objective: users can land on the portal, select a package, and begin payment.

Tasks:

- Build public landing route for captive portal.
- Build the customer flow mobile-first and keep plan selection close to the first viewport.
- Capture MikroTik redirect parameters:
  - MAC address
  - IP address
  - router identity
  - original destination URL
- Create or resume a pending portal session.
- Show active packages.
- Add package selection and invoice creation call.
- Add payment status page.
- Issue a short, low-speed payment bootstrap grant with a per-MAC cooldown after invoice creation.

Exit criteria:

- User can open portal from Wi-Fi.
- Portal creates a pending session.
- User can select a package.
- Payment status can be refreshed or polled without duplicate sessions.

## 7. Phase 3: BTCPay Integration

Objective: create and verify Lightning payments.

Tasks:

- Add BTCPay API client.
- Create invoice endpoint.
- Store invoice ID, amount, package, and session.
- Add BTCPay webhook endpoint.
- Verify webhook authenticity.
- Handle relevant invoice states:
  - new
  - processing
  - settled
  - expired
  - invalid
- Make invoice handling idempotent.
- Create router authorization job after settlement.

Exit criteria:

- Backend creates a BTCPay invoice for a package.
- Settled invoice webhook updates payment status.
- Duplicate webhooks do not create duplicate access grants.
- Invalid webhooks do not grant access.

## 8. Phase 4: MikroTik Gateway Agent

Objective: safely authorize devices on the local router.

Recommended design:

- The cloud backend exposes an authenticated endpoint for pending router jobs.
- The gateway agent runs on a local machine inside the Wi-Fi network.
- The agent polls for jobs, applies them to MikroTik, and reports results.
- The agent sends heartbeat status to the backend.

Tasks:

- Create `gateway-agent` service.
- Add agent configuration through environment variables.
- Add backend endpoint for job polling.
- Add backend endpoint for job result reporting.
- Implement MikroTik command adapter.
- Support access grant.
- Support access revoke.
- Support session expiration cleanup.
- Add retry behavior and failure logging.

MikroTik implementation options to validate:

- Hotspot user creation with uptime/session limit.
- IP binding for paid device MAC.
- Active session login through RouterOS API.
- User profile mapping for speed limits.

Exit criteria:

- Agent can connect to MikroTik from LAN.
- Paid session creates working internet access.
- Expired or revoked session removes access.
- Admin can see agent heartbeat and failed jobs.

## 9. Phase 5: Admin Dashboard

Objective: support operational management.

Tasks:

- Add admin authentication.
- Use platform WebAuthn passkeys with required local user verification and exactly three database-provisioned, single-use device pairing codes. Do not expose self-registration or pairing-code creation in the portal.
- Build dashboard overview:
  - active sessions
  - paid invoices
  - failed authorization jobs
  - gateway agent heartbeat
- Build package management.
- Build session management:
  - grant
  - extend
  - revoke
- Build payment detail pages.
- Add audit logs for admin actions.

Exit criteria:

- Admin can manage packages without code changes.
- Admin can troubleshoot user sessions.
- Admin actions are logged.
- Non-admin users cannot access admin routes.

## 10. Phase 6: Walled Garden And Production Network Test

Objective: validate the real captive portal flow.

Tasks:

- Configure MikroTik Hotspot redirect to `https://wifi.afribit.africa`.
- Add walled garden entries for:
  - `wifi.afribit.africa`
  - `pay.insats.org`
  - required DNS
  - required static/payment endpoints
- Test with unpaid devices.
- Test with paid devices.
- Test expired sessions.
- Test failed payments.
- Test webhook delay behavior.

Exit criteria:

- Unpaid users can reach the portal and payment page.
- Unpaid users cannot browse the public internet.
- Paid users receive internet access.
- Expired users lose access.

## 11. Phase 7: Vouchers - Completed

Objective: support offline sales through voucher codes.

Tasks:

- Add voucher batch generation.
- Store voucher lookup hashes and encrypted export ciphertext, not plaintext codes.
- Support batch quantity, amount in sats, access minutes, speed/data limits, validity windows, prefixes, and redemption limits.
- Add admin export for generated voucher batches.
- Add portal voucher redemption form.
- Grant access after valid voucher redemption.

Exit criteria:

- Admin can generate voucher batches.
- User can redeem a valid voucher.
- Used vouchers cannot be reused.

## 12. Phase 8: M-Pesa Through Bitika

Objective: add mobile money payment after the Lightning flow is stable.

Prerequisites:

- Confirm Bitika API credentials.
- Confirm webhook/callback format.
- Confirm settlement path to BTCPay or Lightning wallet.
- Confirm error states and reconciliation flow.

Tasks:

- Add M-Pesa payment option.
- Validate Kenyan phone number input.
- Trigger STK push.
- Store Bitika transaction reference.
- Process Bitika callback.
- Grant access after confirmed settlement.
- Add reconciliation view in admin dashboard.

Exit criteria:

- User can pay with M-Pesa.
- Successful M-Pesa payment grants access.
- Failed or abandoned M-Pesa payment does not grant access.

## 13. Suggested Initial Packages

Final pricing should be confirmed by the business owner. Example starter packages:

| Package | Duration | Example Price | Speed Profile |
| --- | ---: | ---: | --- |
| Quick Browse | 1 hour | configurable | basic |
| Half Day | 6 hours | configurable | standard |
| Full Day | 24 hours | configurable | standard |
| Weekly | 7 days | configurable | premium |

Prices should live in the database, not code.

## 14. Deployment Checklist

- GitHub repository initialized.
- Vercel project created.
- Production domain configured.
- Database provisioned.
- Production environment variables configured.
- BTCPay invoice creation tested.
- BTCPay webhook configured and verified.
- Gateway agent installed on LAN machine.
- MikroTik API user created with least required permissions.
- Walled garden configured.
- End-to-end purchase tested on real devices.
- Expiration and revocation tested.
- Admin access secured.
- Backup and recovery process documented.

## 15. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| MikroTik API exposed publicly | Router compromise risk | Use local gateway agent instead |
| Webhook spoofing | Free unauthorized access | Verify webhook secret and invoice state |
| Duplicate webhook processing | Duplicate grants or bad accounting | Make payment handling idempotent |
| Captive browser incompatibility | Users cannot pay | Test on iOS, Android, Windows, macOS |
| Walled garden too restrictive | Payment page fails | Test all BTCPay dependencies from unpaid state |
| Walled garden too open | Users bypass payment | Keep allowlist minimal |
| Secrets committed | Account compromise | Use env vars and rotate leaked keys |
| Router job failure | Paid users blocked | Add retries, admin visibility, manual grant |

## 16. Immediate Next Steps

1. Open `/admin/login` on each of the three approved devices and enroll it with its assigned operator pairing code.
2. Connect the receiving Bitcoin wallet and Lightning source under the BTCPay store settings, then rerun invoice and webhook commissioning.
3. Rotate the production BTCPay key after commissioning.
4. Upgrade the RB951 to stable RouterOS v7, back it up, review and import `mikrotik/bitcoin-valley-hotspot.rsc`.
5. Upload `mikrotik/hotspot-bv` to the router and install the LAN gateway agent.
6. Test unpaid portal, same-phone Lightning payment, voucher, expiry, and revocation on real Android and iOS devices.
