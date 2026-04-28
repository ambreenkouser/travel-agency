-- Create flight_legs table
CREATE TABLE flight_legs (
    id          BIGSERIAL PRIMARY KEY,
    flight_id   BIGINT NOT NULL REFERENCES flights(id),
    leg_order   INTEGER NOT NULL,
    origin      VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    depart_at   TIMESTAMPTZ,
    arrive_at   TIMESTAMPTZ,
    UNIQUE (flight_id, leg_order)
);

-- Migrate existing flights -> one leg each
INSERT INTO flight_legs (flight_id, leg_order, origin, destination, depart_at, arrive_at)
SELECT f.id, 1,
       COALESCE(r.origin, '?'),
       COALESCE(r.destination, '?'),
       f.depart_at,
       f.arrive_at
FROM flights f
LEFT JOIN routes r ON f.route_id = r.id
WHERE f.deleted = false;

-- Remove old columns from flights
ALTER TABLE flights DROP COLUMN IF EXISTS route_id;
ALTER TABLE flights DROP COLUMN IF EXISTS depart_at;
ALTER TABLE flights DROP COLUMN IF EXISTS arrive_at;

-- Simplify routes (sectors) — drop unused columns
ALTER TABLE routes DROP COLUMN IF EXISTS duration_mins;
ALTER TABLE routes DROP COLUMN IF EXISTS distance_km;
ALTER TABLE routes DROP COLUMN IF EXISTS route_type;
