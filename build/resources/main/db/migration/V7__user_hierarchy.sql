-- V7: User types table + hierarchy parent_id on users

CREATE TABLE IF NOT EXISTS user_types (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    level        INT          NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
    updated_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

INSERT INTO user_types (name, display_name, level, description) VALUES
  ('super_admin',  'Super Admin',  1, 'Platform owner — full access'),
  ('master_admin', 'Master Admin', 2, 'Manages multiple agencies'),
  ('agency_admin', 'Agency Admin', 3, 'Manages one agency'),
  ('agency_agent', 'Agency Agent', 4, 'Booking agent within an agency');

-- Add hierarchy columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type_id BIGINT REFERENCES user_types(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id    BIGINT REFERENCES users(id);

-- Backfill user_type_id from existing roles
UPDATE users u SET user_type_id = (
    SELECT ut.id FROM user_types ut WHERE ut.name =
        CASE
            WHEN EXISTS (SELECT 1 FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.name = 'super_admin')  THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.name = 'master_agent') THEN 'master_admin'
            WHEN EXISTS (SELECT 1 FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.name = 'agency_admin') THEN 'agency_admin'
            ELSE 'agency_agent'
        END
);

GRANT ALL ON TABLE user_types TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE user_types_id_seq TO travel_user;
GRANT ALL ON TABLE users TO travel_user;
