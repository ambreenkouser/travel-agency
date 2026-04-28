-- Announcements: replace file-path column with binary columns
ALTER TABLE announcements
  DROP COLUMN IF EXISTS image_path,
  ADD COLUMN  image_data         BYTEA,
  ADD COLUMN  image_content_type VARCHAR(100);

-- Booking payments: replace file-path column with binary columns
ALTER TABLE booking_payments
  DROP COLUMN IF EXISTS slip_image_path,
  ADD COLUMN  slip_image_data    BYTEA,
  ADD COLUMN  slip_content_type  VARCHAR(100);

-- Agencies: add binary logo columns (replaces plain text logo_path for uploads)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS logo_data         BYTEA,
  ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR(100);

-- Grant travel_user access
GRANT ALL ON TABLE announcements    TO travel_user;
GRANT ALL ON TABLE booking_payments TO travel_user;
GRANT ALL ON TABLE agencies         TO travel_user;
