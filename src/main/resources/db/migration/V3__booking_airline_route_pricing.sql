-- V3: selected_airline_id on bookings (for Umrah multi-airline tracking)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_airline_id BIGINT REFERENCES airlines(id);
