-- Add role settings table for dashboard access control
CREATE TABLE IF NOT EXISTS role_settings (
  role TEXT PRIMARY KEY,
  dashboard_access BOOLEAN DEFAULT true
);

-- Set defaults for all roles
INSERT INTO role_settings (role, dashboard_access) VALUES
  ('super_admin', true),
  ('admin', true),
  ('instructor', true),
  ('reviewer', true),
  ('student', false),
  ('guest', false)
ON CONFLICT (role) DO NOTHING;
