ALTER TABLE airlines ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;
ALTER TABLE routes   ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;
