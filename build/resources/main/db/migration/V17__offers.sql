-- Discount offers sent by a parent to specific child agents

CREATE TABLE IF NOT EXISTS offers (
    id                  BIGSERIAL PRIMARY KEY,
    agency_id           BIGINT NOT NULL REFERENCES agencies(id)  ON DELETE CASCADE,
    created_by_user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    target_user_id      BIGINT NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    discount_type       VARCHAR(20)  NOT NULL DEFAULT 'FIXED',   -- FIXED | PERCENTAGE
    discount_value      NUMERIC(12,2) NOT NULL,
    valid_from          DATE,
    valid_until         DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON TABLE offers TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE offers_id_seq TO travel_user;
