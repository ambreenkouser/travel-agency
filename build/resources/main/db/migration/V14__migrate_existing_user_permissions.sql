-- Backfill user_permissions for all existing non-super_admin users
-- by copying their current role's permissions into the new per-user table.
INSERT INTO user_permissions (user_id, permission_id)
SELECT DISTINCT ur.user_id, rp.permission_id
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name != 'super_admin'
ON CONFLICT DO NOTHING;
