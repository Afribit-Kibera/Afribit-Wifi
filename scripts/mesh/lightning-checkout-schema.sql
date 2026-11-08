-- Settings the admin can change without a deploy, starting with Bitcoin
-- checkout. Lightning payments use the existing payments table
-- (provider 'lightning', provider_invoice_id = invoice payment hash).
BEGIN;

CREATE TABLE IF NOT EXISTS app_settings (
 key text PRIMARY KEY,
 value jsonb NOT NULL,
 updated_by text,
 updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings(key, value, updated_by)
VALUES ('payments', '{"bitcoinEnabled":true,"bitcoinDiscountPercent":5}'::jsonb, 'migration')
ON CONFLICT (key) DO NOTHING;

COMMIT;
