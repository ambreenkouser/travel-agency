-- Extend ledger entries to support per-user tracking and manual adjustments.

-- 1. Add user_id so each entry belongs to a specific user (agent or admin)
ALTER TABLE ledger_entries
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 2. Make booking_id nullable — adjustment entries have no associated booking
ALTER TABLE ledger_entries
    ALTER COLUMN booking_id DROP NOT NULL;

-- 3. Backfill user_id for existing booking-based entries (only where user still exists)
UPDATE ledger_entries le
SET user_id = b.booked_by_user_id
FROM bookings b
JOIN users u ON u.id = b.booked_by_user_id
WHERE le.booking_id = b.id
  AND le.user_id IS NULL;

GRANT ALL ON TABLE ledger_entries TO travel_user;
