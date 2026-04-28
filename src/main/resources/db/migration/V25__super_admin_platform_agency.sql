-- Super_admin users must have a dedicated agency so their content is isolated from
-- agency_admin content. V24 incorrectly assigned them to the first existing agency
-- (which is also shared by agency_admin users).
-- This migration creates a 'Platform' agency and moves ALL super_admin users to it.
DO $$
DECLARE
    platform_id BIGINT;
BEGIN
    -- Create a dedicated Platform agency for super_admin
    SELECT id INTO platform_id FROM agencies WHERE name = 'Platform' LIMIT 1;

    IF platform_id IS NULL THEN
        INSERT INTO agencies (name, slug, active, created_at, updated_at)
        VALUES ('Platform', 'platform', true, NOW(), NOW())
        RETURNING id INTO platform_id;
    END IF;

    -- Move all super_admin users to the Platform agency
    UPDATE users
    SET agency_id = platform_id
    WHERE id IN (
        SELECT ur.user_id
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE r.name = 'super_admin'
    );
END $$;
