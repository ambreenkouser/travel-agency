-- Ensure all super_admin users have an agency_id.
-- If a super_admin has no agency, assign them to the first existing agency.
-- This is required because Flight/Umrah/Hajj now store agency_id as NOT NULL.
DO $$
DECLARE
    default_agency_id BIGINT;
BEGIN
    SELECT id INTO default_agency_id FROM agencies ORDER BY id LIMIT 1;

    IF default_agency_id IS NOT NULL THEN
        UPDATE users
        SET agency_id = default_agency_id
        WHERE agency_id IS NULL
          AND id IN (
              SELECT ur.user_id
              FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
              WHERE r.name = 'super_admin'
          );
    END IF;
END $$;
