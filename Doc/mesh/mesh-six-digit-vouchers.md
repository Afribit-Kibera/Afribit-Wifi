# Six-digit Mesh vouchers

New batches issue six numeric characters, including leading zeroes. A voucher is
one code entered in the welcome page, not a customer username/password pair.
Existing prefixed codes remain valid and retain their original CSV format.

Codes use Node's cryptographic `randomInt` with uniform sampling. Stored codes
remain encrypted for administrator export and hashed for lookup. Batch creation
inserts the batch, all codes and its audit record in one Neon transaction. Existing
hashes are skipped; a concurrent unique-index collision retries the complete
transaction. Codes are never recycled from old batches.

Short codes require shared attempt limits. The additive
`scripts/mesh/voucher-redemption-schema.sql` was applied to production during
automatic-access commissioning on 5 October 2026. The
database persists fifteen-minute windows across processes and cold starts:

| Setting | Default attempts per window |
| --- | ---: |
| `VOUCHER_DEVICE_ATTEMPTS_PER_WINDOW` | 5 |
| `VOUCHER_SOURCE_ATTEMPTS_PER_WINDOW` | 30 |
| `VOUCHER_GLOBAL_ATTEMPTS_PER_WINDOW` | 100 |

The source limit uses Vercel's platform-provided forwarding header only on Vercel.
Untrusted proxy headers are ignored. The global pilot limit also limits callers
who invent new MAC addresses; adjust it deliberately as the network grows. Each
limit accepts 1–10,000 attempts. A denied request receives HTTP 429 and
`Retry-After`; both valid and invalid attempts count.

When automatic Mesh access is enabled, voucher redemption requires the trusted
HTTP-only Mesh session established by the enrolled router. Browser-supplied
MAC, router, IP and login URL cannot override that session. Native access queueing
consumes the voucher and creates its grant together. New six-digit codes return
503 while automatic Mesh access is unavailable, rather than reaching the legacy
IP-bypass gateway. Existing longer codes retain their legacy route when Mesh is
disabled.

Validation: `npx tsx --test tests/six-digit-vouchers.test.ts` passes five tests using
disposable PGlite databases, including unique-index rollback/retry, existing-code
replacement, concurrent throttling, cooldown reset and global anti-spoof limiting.
Production automatic redemption is enabled on Primary. At 20:46:53 EAT on
5 October, a no-sale six-digit voucher creates one grant and activates the real
iPhone automatically through the cloud queue and daemon. Repeating redemption
returns the same grant and allowance. Router/cloud both confirm activation.
Evidence: ignored `artifacts/mesh-lab/private/automatic-setup/cloud-verification.json`.
