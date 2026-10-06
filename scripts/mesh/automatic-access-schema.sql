-- Additive dedicated lane. Apply explicitly; never drop/reset payments or grants.
CREATE TABLE IF NOT EXISTS mesh_agent_heartbeat(router_id text PRIMARY KEY, last_seen_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS mesh_access_contexts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), router_id text NOT NULL, server text NOT NULL,
 mac_address text NOT NULL, ip_address text NOT NULL, join_token_hash text NOT NULL,
 browser_token_hash text NOT NULL, join_expires_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 joined_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mesh_context_join_uidx ON mesh_access_contexts(join_token_hash);
CREATE TABLE IF NOT EXISTS mesh_access_orders (
 id uuid PRIMARY KEY, context_id uuid NOT NULL REFERENCES mesh_access_contexts(id), router_id text NOT NULL,
 payment_id uuid REFERENCES payments(id), voucher_id uuid REFERENCES vouchers(id),
 grant_id uuid NOT NULL REFERENCES access_grants(id), status text NOT NULL DEFAULT 'queued',
 encrypted_order text NOT NULL, claim_token_hash text, claimed_at timestamptz, expires_at timestamptz NOT NULL,
 last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mesh_order_payment_uidx ON mesh_access_orders(payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS mesh_order_voucher_context_uidx ON mesh_access_orders(voucher_id,context_id);
CREATE INDEX IF NOT EXISTS mesh_order_queue_idx ON mesh_access_orders(router_id,status);
