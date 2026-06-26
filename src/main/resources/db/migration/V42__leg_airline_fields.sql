-- Add per-leg airline and flight identifier fields
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS airline_id    BIGINT REFERENCES airlines(id);
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS flight_number VARCHAR(20);
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS pnr_code      VARCHAR(20);
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS airline_code  VARCHAR(10);
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS flight_class  VARCHAR(20);
ALTER TABLE flight_legs ADD COLUMN IF NOT EXISTS hand_carry_kg INT;

-- Migrate existing global values into each leg row
UPDATE flight_legs fl
SET
    airline_id    = f.airline_id,
    flight_number = f.flight_number,
    pnr_code      = f.pnr_code,
    flight_class  = f.flight_class
FROM flights f
WHERE fl.flight_id = f.id;

-- Remove migrated columns from flights table
ALTER TABLE flights DROP COLUMN IF EXISTS airline_id;
ALTER TABLE flights DROP COLUMN IF EXISTS flight_number;
ALTER TABLE flights DROP COLUMN IF EXISTS pnr_code;
ALTER TABLE flights DROP COLUMN IF EXISTS flight_class;
