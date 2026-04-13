-- V5: Extras (meal, medical, hotel, ziyarat) + Umrah child/infant pricing
ALTER TABLE flights        ADD COLUMN IF NOT EXISTS extras JSONB;
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS extras JSONB;
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS price_child  NUMERIC(12,2);
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS price_infant NUMERIC(12,2);

-- Grant to app user
GRANT ALL ON TABLE flights        TO travel_user;
GRANT ALL ON TABLE umrah_packages TO travel_user;
