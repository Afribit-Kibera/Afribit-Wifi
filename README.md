# 3 West Satenet WiFi

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

1. In BTCPay store settings, connect the Bitcoin wallet and Lightning payment source that will receive customer funds. Invoice creation cannot work until the store has a wallet.
2. Retrieve one of the three operator-only codes from `.env.admin-pairing-codes.local` and use it once at `/admin/login` on its assigned device.
3. Review and import `mikrotik/bitcoin-valley-hotspot.rsc`, then upload `mikrotik/hotspot-bv` to the router.
4. Copy `.env.gateway.example` to `.env.gateway` on the LAN machine and fill the gateway and RouterOS credentials.
5. Run `npm run gateway:dev` under a process manager or system service.

Admin codes are created out of band with `npm run admin:provision-devices`; there is no admin self-registration or in-app code generator. After revoking a lost device, a database operator can provision only that slot with `npm run admin:provision-devices -- --slot 2 --name "Replacement laptop"`. This application uses BTCPay invoice create/view and webhook modification permissions. Never expose the MikroTik API publicly.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
node tests/visual-check.mjs
```
