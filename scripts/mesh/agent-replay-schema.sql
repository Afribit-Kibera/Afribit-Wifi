-- Additive durable request replay protection. No customer or payment changes.
CREATE TABLE IF NOT EXISTS mesh_agent_requests (
 replay_key text PRIMARY KEY CHECK (replay_key ~ '^[a-f0-9]{64}$'),
 router_id text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS mesh_agent_requests_expiry_idx ON mesh_agent_requests(expires_at);
