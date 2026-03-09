INSERT INTO users (name, email, password_hash, organization, role) VALUES
  (
    'Default User',
    'user@example.com',
    '$2b$12$REPLACE_WITH_BCRYPT_HASH_OF_user1234',
    'NBSC',
    'user'
  ),
  (
    'NBSC Manager',
    'manager@example.com',
    '$2b$12$REPLACE_WITH_BCRYPT_HASH_OF_manager1',
    'NBSC',
    'manager'
  ),
  (
    'NBSC Admin',
    'admin@example.com',
    '$2b$12$REPLACE_WITH_BCRYPT_HASH_OF_admin123',
    'NBSC',
    'admin'
  );
