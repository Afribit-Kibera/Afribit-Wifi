-- Device passes: one purchase becomes a pass with a code and N device slots.
-- Additive only. Existing payments, grants and orders are kept; each live
-- legacy order becomes slot 1 of a pass the next time the controller polls.
ALTER TABLE packages ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'personal';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS device_limit integer NOT NULL DEFAULT 1;
ALTER TABLE mesh_access_contexts ADD COLUMN IF NOT EXISTS device_key_hash text;
CREATE INDEX IF NOT EXISTS mesh_context_device_key_idx ON mesh_access_contexts(device_key_hash);

CREATE TABLE IF NOT EXISTS mesh_passes (
 id uuid PRIMARY KEY, router_id text NOT NULL, kind text NOT NULL DEFAULT 'personal',
 device_limit integer NOT NULL DEFAULT 1 CHECK (device_limit BETWEEN 1 AND 10),
 origin_order_id uuid NOT NULL UNIQUE REFERENCES mesh_access_orders(id),
 payment_id uuid UNIQUE REFERENCES payments(id), voucher_id uuid REFERENCES vouchers(id),
 code_hash text NOT NULL UNIQUE, code_ciphertext text NOT NULL,
 payer_device_key_hash text,
 expires_at timestamptz NOT NULL, data_limit_mb integer, speed_limit_kbps integer NOT NULL,
 moves_window_started_at timestamptz NOT NULL DEFAULT now(), moves_in_window integer NOT NULL DEFAULT 0,
 revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mesh_pass_payer_idx ON mesh_passes(payer_device_key_hash);

CREATE TABLE IF NOT EXISTS mesh_pass_devices (
 id uuid PRIMARY KEY, pass_id uuid NOT NULL REFERENCES mesh_passes(id), slot integer NOT NULL,
 device_key_hash text, label text NOT NULL, mac_address text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), last_bound_at timestamptz NOT NULL DEFAULT now(),
 removed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS mesh_pass_device_slot_uidx ON mesh_pass_devices(pass_id,slot) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS mesh_pass_device_key_idx ON mesh_pass_devices(device_key_hash);

-- An order now belongs to one device slot. Revoked orders are disabled on the
-- router before a replacement for the same slot is handed to the controller.
ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS pass_device_id uuid REFERENCES mesh_pass_devices(id);
ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS revoke_claim_token_hash text;
ALTER TABLE mesh_access_orders ADD COLUMN IF NOT EXISTS revoke_claimed_at timestamptz;
DROP INDEX IF EXISTS mesh_order_payment_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS mesh_order_payment_origin_uidx ON mesh_access_orders(payment_id) WHERE pass_device_id IS NULL;
DROP INDEX IF EXISTS mesh_order_voucher_context_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS mesh_order_voucher_origin_uidx ON mesh_access_orders(voucher_id,context_id) WHERE pass_device_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mesh_order_device_live_uidx ON mesh_access_orders(pass_device_id) WHERE status IN ('queued','claimed','active');

-- Short-lived code an unpaid device shows so another phone can pay for it or
-- add it to a household pass (TVs, children's phones, laptops).
CREATE TABLE IF NOT EXISTS mesh_device_codes (
 code_hash text PRIMARY KEY, context_id uuid NOT NULL REFERENCES mesh_access_contexts(id),
 expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mesh_device_code_context_idx ON mesh_device_codes(context_id);

-- Latest read-only gateway health reported by the controller.
CREATE TABLE IF NOT EXISTS mesh_router_telemetry (
 router_id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
