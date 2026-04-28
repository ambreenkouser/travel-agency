ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR(100);
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS package_class        VARCHAR(20) DEFAULT 'economy';
