-- V29: Grant custom:view and custom:manage to super_admin role
-- (V28 only granted them to master_agent/agency_admin/sub_agent)

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.name IN ('custom:view', 'custom:manage')
ON CONFLICT DO NOTHING;
