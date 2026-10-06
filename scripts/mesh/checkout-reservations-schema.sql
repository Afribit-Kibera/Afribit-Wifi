-- One unresolved purchase per enrolled router/device. No timeout can silently
-- release an ambiguous collection. Preserve real payment and settlement rows.
CREATE TABLE IF NOT EXISTS mesh_checkout_reservations (
 router_id text NOT NULL,
 mac_address text NOT NULL,
 payment_id uuid NOT NULL REFERENCES payments(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT mesh_checkout_device_pk PRIMARY KEY(router_id,mac_address),
 CONSTRAINT mesh_checkout_payment_unique UNIQUE(payment_id)
);
