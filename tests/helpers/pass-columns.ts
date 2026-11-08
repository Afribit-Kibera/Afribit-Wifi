// Columns the device-pass release adds to tables these older fixtures build by
// hand. The full migration is exercised in tests/mesh-passes.test.ts.
export const passColumnsSql = `
  ALTER TABLE mesh_access_contexts ADD COLUMN IF NOT EXISTS device_key_hash text;
  ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS pass_device_id uuid;
  ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS revoke_claim_token_hash text;
  ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS revoke_claimed_at timestamptz;`;
export const packagePassColumnsSql = `
  ALTER TABLE packages ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'personal';
  ALTER TABLE packages ADD COLUMN IF NOT EXISTS device_limit integer NOT NULL DEFAULT 1;`;
