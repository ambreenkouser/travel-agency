-- Optional per-user branding overrides. When set, these take precedence over the
-- shared agency's branding on that user's sidebar and on tickets/receipts for
-- bookings they made. Nullable — falls back to agency branding when unset.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS business_name     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_no        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address           VARCHAR(500),
    ADD COLUMN IF NOT EXISTS logo_data         BYTEA,
    ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR(100);
