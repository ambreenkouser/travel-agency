CREATE TABLE announcements (
    id                  BIGSERIAL PRIMARY KEY,
    agency_id           BIGINT,
    created_by_user_id  BIGINT NOT NULL,
    target_type         VARCHAR(20) NOT NULL,   -- 'AGENCY_ADMINS' | 'CHILDREN'
    title               VARCHAR(255) NOT NULL,
    message             TEXT,
    image_path          VARCHAR(500),
    valid_from          DATE,
    valid_until         DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_by   ON announcements(created_by_user_id);
CREATE INDEX idx_announcements_target_type  ON announcements(target_type, active);
