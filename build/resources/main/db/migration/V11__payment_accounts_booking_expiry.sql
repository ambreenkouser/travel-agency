-- Agency-wide booking payment expiry (minutes, default 60)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS booking_expiry_minutes INT DEFAULT 60;

-- Expiry timestamp set on each booking at creation time
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Payment accounts owned by admins (bank/fintech accounts to receive payments)
CREATE TABLE IF NOT EXISTS payment_accounts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id       BIGINT REFERENCES agencies(id) ON DELETE SET NULL,
    account_number  VARCHAR(15) NOT NULL UNIQUE,
    account_title   VARCHAR(255) NOT NULL,
    bank_name       VARCHAR(255) NOT NULL,
    account_type    VARCHAR(50) NOT NULL DEFAULT 'bank',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment slip submitted by agent against a booking
CREATE TABLE IF NOT EXISTS booking_payments (
    id                   BIGSERIAL PRIMARY KEY,
    booking_id           BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_account_id   BIGINT NOT NULL REFERENCES payment_accounts(id),
    slip_image_path      VARCHAR(500),
    reference_number     VARCHAR(255),
    submitted_by_user_id BIGINT REFERENCES users(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant app user access to new tables and sequences
GRANT ALL ON TABLE payment_accounts TO travel_user;
GRANT ALL ON TABLE booking_payments TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE payment_accounts_id_seq TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE booking_payments_id_seq TO travel_user;

-- Grant accounts:manage permission to admin roles
INSERT INTO permissions (name) VALUES ('accounts:manage') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.name IN ('super_admin', 'master_agent', 'agency_admin') AND p.name = 'accounts:manage'
  ON CONFLICT DO NOTHING;
