-- Step 1: Ensure every user with a non-canonical role assignment also has the canonical one.
-- INSERT IGNORE silently skips if the canonical entry already exists (avoids PK duplicate error).
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT ur.user_id, rk.keep_id
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN (SELECT MIN(id) AS keep_id, name FROM roles GROUP BY name) rk ON r.name = rk.name
WHERE ur.role_id != rk.keep_id;

-- Step 2: Delete non-canonical role assignments now that canonical ones are in place.
DELETE ur FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN (SELECT MIN(id) AS keep_id, name FROM roles GROUP BY name) rk ON r.name = rk.name
WHERE ur.role_id != rk.keep_id;

-- Step 3: Delete duplicate role rows (keep only lowest id per name).
DELETE r FROM roles r
JOIN (SELECT MIN(id) AS keep_id, name FROM roles GROUP BY name) rk ON r.name = rk.name
WHERE r.id != rk.keep_id;

-- Step 4: Prevent future duplicates.
ALTER TABLE roles ADD UNIQUE KEY uq_roles_name (name);
