-- Fix FK constraints that block user deletion.
-- Change RESTRICT (default) to SET NULL so deleting a user
-- orphans child rows rather than raising a constraint error.

-- bookings.approved_by_user_id (added in V10 without ON DELETE)
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS bookings_approved_by_user_id_fkey;
ALTER TABLE bookings
    ADD CONSTRAINT bookings_approved_by_user_id_fkey
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- booking_payments.submitted_by_user_id (added in V11 without ON DELETE)
ALTER TABLE booking_payments
    DROP CONSTRAINT IF EXISTS booking_payments_submitted_by_user_id_fkey;
ALTER TABLE booking_payments
    ADD CONSTRAINT booking_payments_submitted_by_user_id_fkey
    FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- users.parent_id (self-reference added in V7 without ON DELETE)
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_parent_id_fkey;
ALTER TABLE users
    ADD CONSTRAINT users_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;
