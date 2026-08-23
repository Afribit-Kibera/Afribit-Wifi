# Bitcoin Valley WiFi

Paid captive-portal and network operations backend for `wifi.afribit.africa`.

## Stack

- Next.js 16 App Router on Vercel
- Neon PostgreSQL with Drizzle ORM
- BTCPay Server Greenfield API and signed webhooks
- Local outbound-only MikroTik RouterOS gateway agent
- Tailwind CSS, Lucide, shadcn-compatible registries, and Anime.js

## Local Setup

```powershell
npm install
vercel link --scope novyrix-teams --project bitcoin-valley-wifi
vercel env pull .env.local --yes --environment development
npm run db:push
npm run db:seed
npm run dev
```

The portal runs at `http://localhost:3000`; passkey admin is at `/admin`; health is at `/api/health`.

## Required Production Activation

1. Rotate the previously shared BTCPay API key.
2. Create a BTCPay webhook for `https://wifi.afribit.africa/api/webhooks/btcpay` and copy its new signing secret.
3. Use `ADMIN_ENROLLMENT_SECRET` from the ignored `.env.production.enrollment.local` file once at `/admin/login` to register the first passkey. Generate short-lived codes under Admin > Security for later devices.
4. Review and import `mikrotik/bitcoin-valley-hotspot.rsc`, then upload `mikrotik/hotspot-bv` to the router.
5. Copy `.env.gateway.example` to `.env.gateway` on the LAN machine and fill the gateway and RouterOS credentials.
6. Run `npm run gateway:dev` under a process manager or system service.

The BTCPay API key needs only invoice create/view permissions. Never expose the MikroTik API publicly.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
node tests/visual-check.mjs
```
