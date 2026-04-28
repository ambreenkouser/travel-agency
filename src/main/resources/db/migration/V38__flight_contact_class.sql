ALTER TABLE flights ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR(100);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_class         VARCHAR(20) DEFAULT 'economy';
