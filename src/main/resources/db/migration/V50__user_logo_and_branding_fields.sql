-- Small per-user branding text fields — negligible size, same as first_name/last_name.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_no    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address       VARCHAR(500);

-- Defensive cleanup: the reverted V49 may have added these directly to `users` in prod
-- before being reverted. Drop them if present so nothing can ever reference them again.
ALTER TABLE users
    DROP COLUMN IF EXISTS logo_data,
    DROP COLUMN IF EXISTS logo_content_type;

-- Logo binary lives in a fully separate, unrelated table — no FK-based JPA relationship
-- will ever be mapped back onto User.
CREATE TABLE IF NOT EXISTS user_logos (
    user_id           BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    logo_data         BYTEA NOT NULL,
    logo_content_type VARCHAR(100),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON TABLE user_logos TO travel_user;
