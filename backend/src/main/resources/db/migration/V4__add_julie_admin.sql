-- Assign ROLE_ADMIN to julieknerrpiano@gmail.com if they already exist
INSERT IGNORE INTO user_roles (user_id, role_id)
  SELECT u.id, r.id
  FROM users u, roles r
  WHERE u.email = 'julieknerrpiano@gmail.com'
    AND r.name = 'ROLE_ADMIN';
