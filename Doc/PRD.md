# Bitcoin Valley WiFi Captive Portal PRD

## 1. Summary

Afribit Wi-Fi will provide paid public Wi-Fi access through a captive portal at `wifi.afribit.africa`. Users connect to the Wi-Fi network, land on a portal, choose an access package, pay with Bitcoin Lightning through BTCPay Server, and receive internet access automatically once payment is confirmed.

The first production version should focus on a reliable end-to-end payment-to-access flow: detect the user device, collect payment, confirm the invoice through a webhook, authorize the device on MikroTik, and track the session until it expires.

## 2. Problem Statement

Public Wi-Fi users need a simple way to buy internet access without staff intervention. Afribit needs a backend that can reliably sell time-based Wi-Fi packages, verify payments, grant access, and maintain an auditable record of users, payments, and active sessions.

If this is not solved, staff must manually manage access, payments can be difficult to reconcile, and users may abandon the service when the connection process is slow or unclear.

## 3. Goals

- Launch a production captive portal at `wifi.afribit.africa`.
- Allow users to purchase Wi-Fi packages using Bitcoin Lightning through BTCPay Server.
- Automatically grant access to a device after a confirmed payment.
- Track active sessions, expired sessions, payment status, and device identifiers.
- Provide an admin backend for managing packages, viewing payments, and troubleshooting user access.
- Keep all credentials out of source control and manage them through production environment variables.

## 4. Non-Goals For Version 1

- M-Pesa automation is not required for the first backend release unless Bitika credentials and API behavior are confirmed.
- Native mobile apps are out of scope; the portal should work in mobile browsers and captive portal browsers.
- Full RADIUS billing is out of scope for v1; MikroTik Hotspot/API authorization is enough for the first release.
- Multi-location/franchise management is out of scope for v1, but the database should not prevent adding it later.
- L402/LSAT authentication is out of scope for v1. It can be revisited after the basic paid Wi-Fi workflow is stable.

## 5. Users And Personas

### Wi-Fi Customer

A person physically near the hotspot who wants quick internet access on a phone, laptop, or tablet.

### Network Operator

The person responsible for MikroTik, access points, uptime, troubleshooting, and local network configuration.

### Business/Admin User

The person responsible for prices, packages, revenue tracking, payment reconciliation, vouchers, and customer support.

## 6. User Stories

### Customer

- As a Wi-Fi customer, I want to connect to the network and see a payment portal automatically so that I can buy access without asking staff.
- As a Wi-Fi customer, I want to choose a clear package so that I know how long or how much access I am buying.
- As a Wi-Fi customer, I want to pay with Bitcoin Lightning so that access can be granted quickly.
- As a Wi-Fi customer, I want the portal to update after payment so that I know whether I can start browsing.
- As a Wi-Fi customer, I want a useful error message if payment or activation fails so that I know what to do next.

### Admin

- As an admin, I want to create and edit packages so that pricing can change without code changes.
- As an admin, I want to see invoices and access sessions so that I can reconcile revenue and diagnose issues.
- As an admin, I want to manually grant, extend, or revoke access so that support cases can be resolved.
- As an admin, I want sensitive credentials managed outside the repository so that production secrets stay safe.

### Network Operator

- As a network operator, I want the backend to authorize devices on MikroTik so that paid users get internet access automatically.
- As a network operator, I want expired sessions to be removed or disabled so that unpaid access does not continue indefinitely.
- As a network operator, I want a clear walled garden list so that unauthenticated users can reach only the portal and payment services.

## 7. Functional Requirements

### P0: Production Portal

- The portal must be available at `https://wifi.afribit.africa`.
- The portal must receive or infer MikroTik redirect parameters such as MAC address, IP address, router identity, and original destination where available.
- The portal must show available Wi-Fi packages.
- The portal must work on common mobile captive portal browsers.

Acceptance criteria:

- Given an unauthenticated user connects to Wi-Fi, when the captive portal opens, then the user can view available packages.
- Given MikroTik redirect parameters are present, when the portal loads, then the backend stores a pending device session.
- Given the user refreshes the payment page, when the invoice is still pending, then the user sees the current invoice state without creating duplicate access.

### P0: Package Management

- Admins must be able to define packages with name, price, currency, duration, speed limit profile, and active/inactive status.
- The backend must use package records when creating payment invoices and access sessions.

Acceptance criteria:

- Given an active package exists, when a user opens the portal, then the package appears.
- Given a package is inactive, when a user opens the portal, then the package does not appear.
- Given an admin edits a package price, when new invoices are created, then the new price is used.

### P0: BTCPay Lightning Payments

- The backend must create BTCPay invoices for selected packages.
- The backend must store invoice IDs and associate them with pending device sessions.
- The backend must receive BTCPay webhook events.
- Only settled or confirmed payment states should grant Wi-Fi access.

Acceptance criteria:

- Given a user selects a package, when the backend calls BTCPay, then a payable invoice is created.
- Given BTCPay sends a valid settled invoice webhook, when the webhook is processed, then the associated device is authorized.
- Given BTCPay sends an invalid webhook signature or unknown invoice ID, when the webhook is processed, then no access is granted.
- Given an invoice expires unpaid, when the user returns to the portal, then the user can create a new invoice.

### P0: MikroTik Authorization

- The backend must authorize paid devices on MikroTik for the purchased duration.
- Authorization should be based on the device MAC address when available.
- Expired sessions must be disabled, removed, or allowed to expire through MikroTik session limits.
- The system must log authorization success and failure.

Recommended implementation:

- Run a small local gateway agent inside the Wi-Fi network.
- The cloud backend stores authorization jobs.
- The local agent securely polls the backend for jobs and applies them to MikroTik.
- This avoids exposing the MikroTik API directly to the public internet.

Acceptance criteria:

- Given a payment is settled, when an authorization job is created, then the gateway agent applies the correct MikroTik access profile.
- Given the authorization succeeds, when the user retries browsing, then internet access is available.
- Given the authorization fails, when the admin opens the session record, then the failure reason is visible.

### P0: Admin Dashboard

- Admins must be able to log in.
- Admins must see packages, invoices, active sessions, failed authorizations, and recent activity.
- Admins must be able to manually grant, revoke, or extend access.
- Admins must create voucher batches with quantity, sale amount in sats, access duration, optional speed/data caps, validity window, code prefix, and per-code redemption limit.
- Admins must export voucher batches as CSV and inspect masked redemption status.
- Admins must add, disable, and categorize free-site domains, including optional subdomain coverage.
- Every free-site change must queue a MikroTik walled-garden synchronization job.

Acceptance criteria:

- Given an admin is authenticated, when they open the dashboard, then they can see the current operational state.
- Given an admin revokes a session, when the action is applied, then the device loses access.
- Given a non-admin visits the dashboard URL, when they are not authenticated, then they cannot access admin data.

### P0: Physical Vouchers

- Admins can generate voucher codes in batches with explicit quantity, amount, time range, validity, limits, and redemption policy.
- Each voucher code maps to a package or custom access policy.
- Voucher codes are hashed for lookup and encrypted for authenticated export.
- Customers can redeem a voucher code instead of paying online.

Acceptance criteria:

- Given an unused voucher exists, when a customer redeems it, then access is granted and the voucher is marked used.
- Given a used or invalid voucher is submitted, when validation runs, then access is not granted.

### P1: M-Pesa Through Bitika

- Users can enter a phone number and initiate M-Pesa STK push.
- The system can map the M-Pesa payment to a Wi-Fi package and grant access after settlement.
- Bitika API credentials, webhook behavior, and settlement flow must be confirmed before implementation.

Acceptance criteria:

- Given Bitika credentials are configured, when a user starts M-Pesa payment, then an STK push is sent.
- Given Bitika confirms payment settlement, when the backend receives confirmation, then the device is authorized.

### P2: Advanced Network Controls

- Per-package bandwidth profiles.
- Data caps.
- Multi-router support.
- Customer receipts.
- SMS or WhatsApp support messages.
- L402/LSAT access tokens.
- Analytics dashboards for revenue, repeat usage, and peak hours.

## 8. System Architecture

### Production Components

- Domain: `wifi.afribit.africa`
- Web app and API: Next.js deployed on Vercel
- Database: Neon PostgreSQL provisioned and connected through Vercel
- Payment processor: BTCPay Server at `pay.insats.org`
- Router gateway: MikroTik Hotspot
- Local network executor: gateway agent running on a small LAN machine or server
- Optional later payment path: Bitika for M-Pesa

### Payment-To-Access Flow

1. User connects to the Wi-Fi SSID.
2. MikroTik redirects unauthenticated traffic to `https://wifi.afribit.africa`.
3. Portal records device/session context.
4. User selects a package.
5. Backend creates a BTCPay invoice.
6. User pays the Lightning invoice.
7. BTCPay sends a webhook to the backend.
8. Backend validates the webhook and marks the invoice paid.
9. Backend creates a MikroTik authorization job.
10. Local gateway agent applies access on MikroTik.
11. User receives internet access until the session expires.

## 9. Data Model

Initial tables:

- `users`: admin users and roles.
- `packages`: Wi-Fi plans, prices, durations, speed profiles, and active status.
- `portal_sessions`: device MAC, IP, router identity, status, selected package, and expiration.
- `payments`: provider, invoice ID, amount, currency, status, raw event references, and settlement time.
- `access_grants`: authorized device, package, start time, end time, MikroTik status, and revocation status.
- `router_jobs`: queued commands for the gateway agent, execution status, attempts, and error messages.
- `vouchers`: code hash, package, status, generated batch, redemption session, and expiration.
- `audit_logs`: admin actions and important automated events.

## 10. Security Requirements

- Never commit GitHub tokens, BTCPay API keys, webhook secrets, database URLs, router passwords, or admin passwords.
- Store production secrets in Vercel environment variables or the gateway agent environment.
- Use a BTCPay webhook secret and verify webhook authenticity.
- Use least-privilege BTCPay permissions for invoice creation and invoice reads.
- Do not expose MikroTik management APIs publicly unless there is no alternative.
- If MikroTik API exposure is required, enforce TLS, strong credentials, firewall allowlists, and no password reuse.
- Hash voucher codes in the database.
- Protect admin routes with authentication and role checks.
- Log security-sensitive events without logging secret values.

Required environment variables should include:

- `BTCPAY_SERVER_URL`
- `BTCPAY_STORE_ID`
- `BTCPAY_API_KEY`
- `BTCPAY_WEBHOOK_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_SECRET` or equivalent auth secret
- `GATEWAY_AGENT_TOKEN`
- `MIKROTIK_HOST`
- `MIKROTIK_USERNAME`
- `MIKROTIK_PASSWORD`
- `MIKROTIK_USE_TLS`

## 11. Walled Garden Requirements

Unauthenticated users must be able to reach only what is required to pay and activate service:

- `wifi.afribit.africa`
- BTCPay host: `pay.insats.org`
- Required BTCPay static assets and invoice endpoints
- DNS resolvers needed by the captive portal flow
- Optional later: Bitika API/payment domains once M-Pesa is implemented

The walled garden should be tested on Android, iOS, Windows, and macOS captive portal flows.

## 12. Success Metrics

### Launch Metrics

- 95% or higher successful portal load rate from connected Wi-Fi devices.
- 90% or higher successful access grant rate after settled payment.
- Less than 30 seconds from settled payment webhook to MikroTik authorization under normal conditions.
- Zero committed production secrets.

### Business Metrics

- Daily paid sessions.
- Gross revenue by package.
- Payment completion rate.
- Repeat purchase rate.
- Support cases per 100 purchases.

### Reliability Metrics

- Webhook processing error rate.
- MikroTik authorization job failure rate.
- Gateway agent heartbeat uptime.
- Expired session cleanup success rate.

## 13. Open Questions

- What exact RouterOS version and API mode will be used in production?
- Should the first release use MAC authorization, Hotspot users, cookies, or IP bindings?
- What packages and prices should launch first?
- Should access be time-only, data-capped, speed-limited, or a combination?
- Where will the gateway agent run on the local network?
- Which managed PostgreSQL provider should be used?
- What admin authentication provider should be used?
- Will M-Pesa/Bitika be part of launch or a fast follow?

## 14. Release Criteria

The system can launch when:

- Production domain resolves to the deployed app.
- BTCPay invoice creation works in production.
- BTCPay webhooks are verified and processed.
- Gateway agent can authorize and revoke devices on MikroTik.
- Admin can view packages, payments, sessions, and failed jobs.
- Expired sessions are cleaned up.
- Secrets are stored outside source control.
- The walled garden is validated on real devices.
