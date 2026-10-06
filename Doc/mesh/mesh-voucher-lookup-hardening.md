# Voucher lookup hardening and old-stock migration

6 October 2026. Implementation and isolated tests are ready; this document does not claim that live stock has been migrated or these changes deployed.

## What changes

New vouchers still contain exactly six numeric digits, including leading zeroes. They now store `hmac-sha256-v1:<digest>` instead of a plain SHA-256 digest. A database-only reader cannot test a dictionary of all six-digit values against that keyed digest without obtaining the server secret as well.

By default the lookup key is derived from the existing 32-byte `VOUCHER_ENCRYPTION_KEY` using HKDF-SHA256 with a versioned Mesh lookup salt and a lookup-only context. The derived HMAC key is distinct from the AES-GCM export key. No new production environment variable is required when the existing encryption key is valid. An optional independent `VOUCHER_LOOKUP_KEY` must be a 32-byte base64 key; explicitly invalid/empty configuration fails closed and never falls back to SHA-256.

New numeric stock no longer stores four of its six digits in plaintext `codeLastFour`; that would leave only 100 online guesses after a database leak. Administrators can still export full codes through the existing authenticated/decrypted export. Migration clears the numeric tail while preserving non-numeric legacy display tails. Physical ticket codes, values, expiry dates, redemption counts and disabled flags do not change.

Keep the configured lookup key source stable for all outstanding stock. Adding a dedicated key later or rotating the encryption key changes the derived lookup hashes and needs a planned rehash/re-encryption migration. Do not rotate either key independently and expect previously issued tickets to remain discoverable.

## Deployment order

1. Read the audit, pause voucher issuance for the short migration window and inspect aggregate stock with the production-equivalent keys/database. Never print codes, encrypted values or keys.
2. If legacy stock exists, review the count, encrypted-value consistency and backup/rollback approach before application. The utility intentionally refuses application when there are unknown hash formats or more than 1,000 legacy rows; larger inventories need a bounded migration plan.
3. Migrate old hashes and numeric suffixes using authenticated AES-GCM decryption and verified old-hash matching. The updates and audit entry run in one Neon HTTP database batch transaction. A uniqueness violation or other statement failure rolls back the batch. Existing HMAC rows are not overwritten. Keep the old deployment out of voucher issuance/redemption while migration and the new release are coordinated.
4. Inspect again. When no legacy hashes remain, deploy without legacy-compatibility environment variables and test a known valid ticket using the owning Mesh session. Inspect disabled/exhausted fixtures with isolated tests; do not redeem customer stock just to test.

Commands for the root/operator (not run against the live database by this audit agent):

```powershell
# Read-only aggregate counts. No arguments also means inspect.
npx tsx --env-file=.env.local scripts/mesh/migrate-voucher-lookup.ts --inspect

# Explicit reviewed database mutation: code values/counters remain unchanged.
npx tsx --env-file=.env.local scripts/mesh/migrate-voucher-lookup.ts --apply

# Confirm remaining stock formats after the transaction.
npx tsx --env-file=.env.local scripts/mesh/migrate-voucher-lookup.ts --inspect
```

Select the environment file that actually represents the production database and encryption key; `.env.local` is only the repository's customary operator example. The utility logs aggregate counts/outcome only and sanitizes failures. Store any database backup privately. Rolling back just the application after rehashing stock would make old SHA-only code unable to find migrated tickets, so rollback must account for the paired code/database migration.

## Temporary compatibility, if migration must wait

SHA-256 lookup is **disabled by default**. Both of these explicit UTC dates are required to enable it:

```dotenv
VOUCHER_LEGACY_ISSUED_BEFORE=2026-10-06T12:00:00Z
VOUCHER_LEGACY_LOOKUP_UNTIL=2026-11-07T12:00:00Z
```

These are examples, not applied configuration. Use the actual reviewed old-stock cutoff. The cutoff cannot be in the future, the deadline must follow it and their gap cannot exceed 32 days. Lookup is limited to legacy records created **before** the cutoff and stops at the deadline. Ordinary batch validity/disabled/redemption controls still apply. Malformed or partially configured compatibility fails closed.

The current HMAC record always wins, including when disabled or exhausted. A caller cannot fall through to a second historic ticket with the same code. New issuance checks both current HMAC hashes and historic SHA hashes for collisions, even when old-stock redemption is turned off, so retired physical codes are not recycled into new stock.

Compatibility preserves usability but leaves old SHA stock vulnerable to offline recovery after a database leak until it is migrated or retired. Prefer migration; do not extend the deadline indefinitely.

## What remains

HMAC protects lookup secrecy at rest; it does not enlarge the six-digit online search space or make a voucher an identity credential. Distributed redemption throttles and inventory limits remain necessary. With 1,000 valid uniformly distributed codes, 100 guesses have approximately a 9.5% chance of finding at least one. With 10,000 valid codes that probability is approximately 63%. Field issuance needs small/short-lived single-use stock, stock-aware monitoring and a tested incident/reissue policy. No price, inventory quantity or global throttle was changed in this work.

## Verification

`tests/voucher-lookup-security.test.ts` verifies domain-keyed output, bad-key failure before stock queries, explicit bounded compatibility, authoritative disabled keyed records, expiry retirement and authenticated migration preparation/collision rejection. `tests/six-digit-vouchers.test.ts` checks numeric generation, HMAC issuance, absence of numeric suffix leakage, atomic uniqueness handling and non-recycling of SHA stock. The real redemption handler is exercised with isolated PostgreSQL in `tests/mesh-automatic-access.test.ts`: pre-cutoff old stock works; post-cutoff stock, disabled fallback and expired compatibility fail; current keyed stock remains usable; invalid key configuration returns 503.

Passkey body limits are separately tested in `tests/passkey-body-security.test.ts`; all three POST handlers cancel oversized trusted-origin streams before challenge/database work.
