-- Add ledger:view permission and grant it to all existing roles/users
-- so nobody loses access to the Ledger tab that was previously ungated.

INSERT INTO permissions (name) VALUES ('ledger:view') ON CONFLICT DO NOTHING;

-- Grant to all roles (super_admin, master_agent, agency_admin, sub_agent)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.name = 'ledger:view'
ON CONFLICT DO NOTHING;

-- Backfill into user_permissions for existing non-super-admin users
-- (AuthUserDetails uses customPermissions, not role permissions, for non-super-admins)
INSERT INTO user_permissions (user_id, permission_id)
SELECT DISTINCT u.id, p.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
JOIN permissions p ON p.name = 'ledger:view'
WHERE r.name != 'super_admin'
ON CONFLICT DO NOTHING;
