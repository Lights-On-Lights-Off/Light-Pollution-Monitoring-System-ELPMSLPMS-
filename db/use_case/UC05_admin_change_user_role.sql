UPDATE users
SET
  role       = 'manager',
  updated_at = NOW()
WHERE
  id        = 1
  AND role != 'admin';

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, meta)
VALUES
  (
    3,
    'role_changed',
    'user',
    1,
    '{"old_role": "user", "new_role": "manager", "email": "user@example.com"}'
  );

SELECT id, name, email, role, updated_at
FROM   users
WHERE  id = 1;
