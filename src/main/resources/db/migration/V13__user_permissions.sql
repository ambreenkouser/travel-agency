-- Per-user custom permissions (replaces fixed role permissions for non-super_admin users)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

GRANT ALL ON TABLE user_permissions TO travel_user;
