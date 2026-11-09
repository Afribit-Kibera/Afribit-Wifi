-- Connection history for the admin. Additive only: safe to run more than once.
-- The controller reports about once a minute; history older than 180 days is pruned.

-- How many devices were on the Wi-Fi and online at each report.
CREATE TABLE IF NOT EXISTS mesh_connection_samples (
  router_id text NOT NULL,
  sampled_at timestamptz NOT NULL DEFAULT now(),
  on_wifi integer NOT NULL,
  online integer NOT NULL,
  wan_down_bps bigint,
  wan_up_bps bigint,
  PRIMARY KEY (router_id, sampled_at)
);

-- One row per internet session: from when a device came online to when it left.
CREATE TABLE IF NOT EXISTS mesh_device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id text NOT NULL,
  mac_address text NOT NULL,
  hotspot_user text NOT NULL,
  ip_address text,
  started_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  ended_at timestamptz,
  bytes_down bigint NOT NULL DEFAULT 0,
  bytes_up bigint NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS mesh_device_sessions_open ON mesh_device_sessions(router_id, mac_address, hotspot_user) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS mesh_device_sessions_started ON mesh_device_sessions(started_at);
CREATE INDEX IF NOT EXISTS mesh_device_sessions_mac ON mesh_device_sessions(mac_address, started_at DESC);
