# MikroTik Gateway Runbook

## Router Preparation

1. Enable RouterOS REST access on the LAN interface only.
2. Create a dedicated `bitcoin-valley-agent` RouterOS user with permissions limited to Hotspot IP binding and walled-garden changes.
3. Restrict that user and the REST service to the gateway agent's static LAN address.
4. Use a trusted TLS certificate when possible. If the LAN uses HTTP, keep it isolated and set `MIKROTIK_USE_TLS=false`.

## Agent Installation

```powershell
npm install
Copy-Item .env.gateway.example .env.gateway
npm run gateway:dev
```

Set `GATEWAY_API_URL=https://wifi.afribit.africa`. Retrieve the production `GATEWAY_AGENT_TOKEN` securely from Vercel and place it only on the LAN machine.

## Walled Garden

The database is seeded with the portal and BTCPay domains. Add any payment asset hosts observed during a real unpaid-device checkout through Admin > Free sites. Each change queues a full synchronization containing only enabled domains.

## Acceptance Test

1. Connect an unpaid device and confirm only free sites are reachable.
2. Create a short manual grant from Admin > Network and confirm the device receives internet access.
3. Revoke it and confirm access stops.
4. Complete a low-value Lightning invoice and confirm the grant appears automatically.
5. Wait for expiry and confirm the binding is removed.
