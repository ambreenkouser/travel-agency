-- V10: Flight seat quota + booking approval workflow

-- Seat quota per flight (configurable by admin)
ALTER TABLE flights ADD COLUMN IF NOT EXISTS seat_quota INT;

-- Payment comment and approver tracking on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_comment TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approved_by_user_id BIGINT REFERENCES users(id);

GRANT ALL ON TABLE flights  TO travel_user;
GRANT ALL ON TABLE bookings TO travel_user;
