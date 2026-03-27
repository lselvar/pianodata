-- Add ROLE_ADMIN to roles table
INSERT IGNORE INTO roles (name) VALUES ('ROLE_ADMIN');

-- Assign admin role to the designated admin user (if they already exist)
INSERT IGNORE INTO user_roles (user_id, role_id)
  SELECT u.id, r.id
  FROM users u, roles r
  WHERE u.email = 'raj.selvaraj.arch@gmail.com'
    AND r.name = 'ROLE_ADMIN';
