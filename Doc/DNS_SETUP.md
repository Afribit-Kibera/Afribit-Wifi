# Production DNS Setup

Vercel has added `wifi.afribit.africa` to the `bitcoin-valley-wifi` project, pending DNS verification.

Create these records in the DNS zone for `afribit.africa`:

| Type | Host/Name | Value/Target | TTL |
| --- | --- | --- | --- |
| TXT | `_vercel` | `vc-domain-verify=wifi.afribit.africa,ebecb35344b64a24c6b0` | Auto or 300 |
| CNAME | `wifi` | `b2a4cc78068f783e.vercel-dns-017.com` | Auto or 300 |

Remove any existing `A`, `AAAA`, or `CNAME` record for the `wifi` host before adding the CNAME. Do not change the apex `afribit.africa` record or nameservers.

After DNS propagates, verify and inspect with:

```powershell
vercel api /v9/projects/bitcoin-valley-wifi/domains/wifi.afribit.africa/verify -X POST --scope novyrix-teams
vercel domains inspect wifi.afribit.africa --scope novyrix-teams
```

Vercel will provision TLS automatically after ownership and routing are valid.
