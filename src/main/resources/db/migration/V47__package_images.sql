ALTER TABLE umrah_packages    ADD COLUMN IF NOT EXISTS image_data         BYTEA;
ALTER TABLE umrah_packages    ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100);
ALTER TABLE hajj_packages     ADD COLUMN IF NOT EXISTS image_data         BYTEA;
ALTER TABLE hajj_packages     ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100);
ALTER TABLE custom_packages   ADD COLUMN IF NOT EXISTS image_data         BYTEA;
ALTER TABLE custom_packages   ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100);
ALTER TABLE package_type_defs ADD COLUMN IF NOT EXISTS image_data         BYTEA;
ALTER TABLE package_type_defs ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100);
