-- Additive prerequisite for six-digit voucher redemption. Apply before enabling
-- redemption; the handler fails closed when this table is unavailable.
CREATE TABLE IF NOT EXISTS voucher_redemption_limits (
  scope_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0)
);
