-- V28: Generic configurable custom packages

-- 1. custom_packages table
CREATE TABLE custom_packages (
    id             BIGSERIAL    PRIMARY KEY,
    agency_id      BIGINT       NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    package_type   VARCHAR(100) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    base_price     NUMERIC(15,2),
    price_child    NUMERIC(15,2),
    price_infant   NUMERIC(15,2),
    quota_total    INT,
    quota_reserved INT          NOT NULL DEFAULT 0,
    attributes     JSONB,
    status         VARCHAR(20)  NOT NULL DEFAULT 'draft',
    deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_packages_agency ON custom_packages(agency_id);

GRANT ALL ON TABLE custom_packages TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE custom_packages_id_seq TO travel_user;

-- 2. Extend content_shares to allow 'custom' content type
ALTER TABLE content_shares
    DROP CONSTRAINT IF EXISTS content_shares_content_type_check;

ALTER TABLE content_shares
    ADD CONSTRAINT content_shares_content_type_check
    CHECK (content_type IN ('flight', 'umrah', 'hajj', 'custom'));

-- 3. Add custom:view and custom:manage permissions
INSERT INTO permissions (name) VALUES ('custom:view')   ON CONFLICT DO NOTHING;
INSERT INTO permissions (name) VALUES ('custom:manage') ON CONFLICT DO NOTHING;

-- 4. Grant custom:view to master_agent, agency_admin, sub_agent roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('master_agent', 'agency_admin', 'sub_agent') AND p.name = 'custom:view'
ON CONFLICT DO NOTHING;

-- 5. Grant custom:manage to master_agent and agency_admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('master_agent', 'agency_admin') AND p.name = 'custom:manage'
ON CONFLICT DO NOTHING;
