-- V30: Package type definitions + agency grants + per-package sub-agent access

-- 1. Super-admin defines reusable package types (UAE Package, UK Visa, etc.)
CREATE TABLE package_type_defs (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50)  NOT NULL DEFAULT '📦',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

GRANT ALL ON TABLE package_type_defs TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE package_type_defs_id_seq TO travel_user;

-- 2. Super-admin grants a package type to an agency
CREATE TABLE agency_package_grants (
    agency_id   BIGINT NOT NULL REFERENCES agencies(id)          ON DELETE CASCADE,
    type_def_id BIGINT NOT NULL REFERENCES package_type_defs(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, type_def_id)
);

GRANT ALL ON TABLE agency_package_grants TO travel_user;

-- 3. Link existing custom_packages rows to a type def (nullable for backward compat)
ALTER TABLE custom_packages ADD COLUMN type_def_id BIGINT REFERENCES package_type_defs(id);

-- 4. Package-level visibility: true = all sub-agents of the agency, false = only listed users
ALTER TABLE custom_packages ADD COLUMN visible_to_all BOOLEAN NOT NULL DEFAULT TRUE;

-- 5. Explicit sub-agent grants when visible_to_all = false
CREATE TABLE custom_package_user_grants (
    package_id BIGINT NOT NULL REFERENCES custom_packages(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL,
    PRIMARY KEY (package_id, user_id)
);

GRANT ALL ON TABLE custom_package_user_grants TO travel_user;
