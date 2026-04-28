-- V6: Hotels management (per-agency hotel catalog)
CREATE TABLE IF NOT EXISTS hotels (
    id          BIGSERIAL PRIMARY KEY,
    agency_id   BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    star_rating INT,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hotels_agency ON hotels(agency_id);
CREATE INDEX IF NOT EXISTS idx_hotels_city   ON hotels(city);

GRANT ALL ON TABLE hotels TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE hotels_id_seq TO travel_user;

-- Also add selected_hotel_id to bookings for hotel extra tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_hotel_id BIGINT REFERENCES hotels(id);
GRANT ALL ON TABLE bookings TO travel_user;
