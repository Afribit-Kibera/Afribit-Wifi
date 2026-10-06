# Mesh by Afribit

Captive welcome, internet passes, free app access and network operations for
**https://wifi.afribit.africa**. The current release supports the supervised
single-device home pilot. It is not clearance to replace the live 3WEST gateway.

Start with the [developer handoff](Doc/mesh/mesh-developer-handoff.md),
[Mesh documentation](Doc/mesh/README.md) and
[pilot/security/device decision](Doc/mesh/mesh-pilot-readiness-and-device-plans.md).

## Architecture

- Next.js 16 App Router on Vercel; Neon PostgreSQL with Drizzle ORM.
- Router-hosted welcome assets link to the HTTPS catalogue. Checkout uses
  router-attested device context, not trusted browser MAC addresses.
- Bitika is the preferred M-Pesa provider and settles Bitcoin directly to the
  configured Lightning address. Paystack is a backend fallback with separate
  Insats conversion/Bitcoin settlement. Readiness checks gate checkout.
- The always-on LunaNode controller at `mesh-core.afribit.africa` manages the
  enrolled spare MikroTik through WireGuard and pinned SSH. Durable orders,
  acknowledgements and router deadlines provide automatic paid access.
- Administration uses provisioned passkeys. Vouchers use encrypted storage,
  keyed lookups and durable redemption limits.

The cloud controller replaces the laptop worker for paid internet. Offline
communications still need a local network and suitable apps; cloud hosting
does not make those services available during a WAN outage.

## Local development

Use Node.js 24 and the committed lockfile:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Fill `.env.local` with a **disposable development database** and development
secrets. Provider and automatic-access flags default off. Obtain production
access privately from the operator. The portal runs at `http://localhost:3000`;
administration is at `/admin`.

For a new disposable database only, review the schema and seed before running
`npm run db:push` and `npm run db:seed`. Do not run either against production.
The existing production database already has additive Mesh migrations installed.

Read `AGENTS.md` and the relevant installed guide under
`node_modules/next/dist/docs/` before changing framework code.

## Verification

```powershell
npm run test:payments
npm run test:mesh-access
npm run test:production-guards
npm run test:security
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

These suites use fixtures and isolated databases without collecting money.
Live payment, settlement and router scripts are operational tools with real
effects. Read their runbooks before using them.

## Deployments

The Vercel project is `novyrix-teams/bitcoin-valley-wifi`:

```powershell
npx vercel link --scope novyrix-teams --project bitcoin-valley-wifi
npx vercel project inspect --non-interactive
npx vercel --prod --yes
```

Check the project before deploying. `.vercelignore` excludes documentation,
router tooling, tests, lab evidence and private environment files from the app
upload. Git excludes secrets and all `artifacts/`; clones contain no production
database URL, VM private key or payment credentials.

Controller, database and router upgrades have separate ordered procedures. Use
the [handoff](Doc/mesh/mesh-developer-handoff.md) and
[operations runbook](Doc/mesh/mesh-production-operations.md).
Do not import lab `.rsc` files into a serving router without a reviewed site
configuration and backup. `gateway:dev` and `mikrotik/bitcoin-valley-hotspot.rsc`
are legacy paths, not the commissioned Mesh controller deployment.

## Scope before field rollout

TV sponsorship, family device slots, customer migration and production plan
parity remain implementation work. Multi-client radio/forwarding stress tests,
restore drills, management isolation and credential rotation remain rollout
gates. See [3WEST readiness](Doc/mesh/3west-production-readiness.md) and the
[roadmap](Doc/mesh/mesh-status-and-roadmap-2026-10-06.md).
