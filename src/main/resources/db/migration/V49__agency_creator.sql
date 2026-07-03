ALTER TABLE agencies ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

-- Backfill existing agencies (created before this column existed) to the founding
-- super_admin account, so they don't disappear from every non-super-admin's view.
UPDATE agencies
SET created_by_user_id = (
    SELECT ur.user_id
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'super_admin'
    ORDER BY ur.user_id ASC
    LIMIT 1
)
WHERE created_by_user_id IS NULL;
