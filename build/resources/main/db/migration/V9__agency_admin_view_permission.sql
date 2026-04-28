-- V9: Grant agency_admin the agencies:view permission (needed to load the Users screen)

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'agency_admin'
  AND p.name = 'agencies:view'
ON CONFLICT DO NOTHING;
