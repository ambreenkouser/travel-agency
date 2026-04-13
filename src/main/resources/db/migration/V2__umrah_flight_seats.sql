-- V2: Airline seat quota, route types, Umrah multi-airline linkage

-- Seat quota per airline
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS seat_quota INT;

-- Route type: ONE_WAY or ROUND_TRIP
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_type VARCHAR(20) NOT NULL DEFAULT 'ONE_WAY';

-- Umrah package ↔ airline  (many-to-many with per-airline seat allocation)
CREATE TABLE IF NOT EXISTS umrah_package_airlines (
    id              BIGSERIAL PRIMARY KEY,
    umrah_package_id BIGINT NOT NULL REFERENCES umrah_packages(id) ON DELETE CASCADE,
    airline_id       BIGINT NOT NULL REFERENCES airlines(id)        ON DELETE CASCADE,
    allocated_seats  INT    NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (umrah_package_id, airline_id)
);

CREATE INDEX IF NOT EXISTS idx_upa_package ON umrah_package_airlines(umrah_package_id);
CREATE INDEX IF NOT EXISTS idx_upa_airline ON umrah_package_airlines(airline_id);
