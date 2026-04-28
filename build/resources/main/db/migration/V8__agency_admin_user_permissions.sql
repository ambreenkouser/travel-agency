-- V8: Grant agency_admin the ability to create and edit users within their agency

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'agency_admin'
  AND p.name IN ('agencies:create', 'agencies:edit')
ON CONFLICT DO NOTHING;
