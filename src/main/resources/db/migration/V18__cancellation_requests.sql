CREATE TABLE IF NOT EXISTS booking_cancellation_requests (
    id               BIGSERIAL PRIMARY KEY,
    agency_id        BIGINT        NOT NULL REFERENCES agencies(id),
    booking_id       BIGINT        NOT NULL REFERENCES bookings(id),
    requested_by_user_id BIGINT    REFERENCES users(id) ON DELETE SET NULL,
    status           VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    reason           TEXT,
    parent_comment   TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
