-- V31: Backfill custom:view and custom:manage into user_permissions
-- for all existing users whose role grants those permissions.
-- (AuthUserDetails uses customPermissions, not role permissions, for non-super-admins.)

INSERT INTO user_permissions (user_id, permission_id)
SELECT DISTINCT ur.user_id, p.id
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN permissions p ON p.name IN ('custom:view', 'custom:manage')
JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
WHERE r.name != 'super_admin'
ON CONFLICT DO NOTHING;
