-- V23: Content sharing — super_admin assigns flights/umrah/hajj packages to specific agencies

CREATE TABLE content_shares (
    id               BIGSERIAL PRIMARY KEY,
    content_type     VARCHAR(10) NOT NULL CHECK (content_type IN ('flight','umrah','hajj')),
    content_id       BIGINT NOT NULL,
    target_agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (content_type, content_id, target_agency_id)
);

CREATE INDEX idx_content_shares_lookup ON content_shares(content_type, target_agency_id);
CREATE INDEX idx_content_shares_content ON content_shares(content_type, content_id);

GRANT ALL ON TABLE content_shares TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE content_shares_id_seq TO travel_user;
