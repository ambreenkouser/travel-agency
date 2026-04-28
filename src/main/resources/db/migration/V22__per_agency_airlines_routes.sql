-- V22: Make airlines and routes per-agency (add agency_id)

-- ── Airlines ────────────────────────────────────────────────────────────────
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS agency_id BIGINT;

-- Assign existing airlines to super_admin's agency; fall back to first agency if none found
UPDATE airlines
SET agency_id = COALESCE(
    (
        SELECT u.agency_id
        FROM users u
        JOIN user_types ut ON ut.id = u.user_type_id
        WHERE ut.name = 'super_admin'
          AND u.agency_id IS NOT NULL
        ORDER BY u.id
        LIMIT 1
    ),
    (SELECT id FROM agencies ORDER BY id LIMIT 1)
)
WHERE agency_id IS NULL;

ALTER TABLE airlines ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE airlines ADD CONSTRAINT fk_airlines_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;

-- Drop global UNIQUE on code; replace with per-agency uniqueness
ALTER TABLE airlines DROP CONSTRAINT IF EXISTS airlines_code_key;
ALTER TABLE airlines ADD CONSTRAINT uq_airlines_agency_code UNIQUE (agency_id, code);

CREATE INDEX IF NOT EXISTS idx_airlines_agency ON airlines(agency_id);

-- ── Routes ───────────────────────────────────────────────────────────────────
ALTER TABLE routes ADD COLUMN IF NOT EXISTS agency_id BIGINT;

-- Assign existing routes to super_admin's agency; fall back to first agency if none found
UPDATE routes
SET agency_id = COALESCE(
    (
        SELECT u.agency_id
        FROM users u
        JOIN user_types ut ON ut.id = u.user_type_id
        WHERE ut.name = 'super_admin'
          AND u.agency_id IS NOT NULL
        ORDER BY u.id
        LIMIT 1
    ),
    (SELECT id FROM agencies ORDER BY id LIMIT 1)
)
WHERE agency_id IS NULL;

ALTER TABLE routes ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE routes ADD CONSTRAINT fk_routes_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_routes_agency ON routes(agency_id);

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE airlines TO travel_user;
GRANT ALL ON TABLE routes TO travel_user;
