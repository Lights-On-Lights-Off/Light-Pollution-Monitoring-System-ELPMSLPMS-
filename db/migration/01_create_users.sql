CREATE TABLE users (
  id             INT UNSIGNED                   NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100)                   NOT NULL,
  email          VARCHAR(150)                   NOT NULL,
  password_hash  VARCHAR(255)                   NOT NULL                 ,
  organization   VARCHAR(150)                       NULL DEFAULT NULL    ,
  role           ENUM('user','manager','admin') NOT NULL DEFAULT 'user',
  is_active      TINYINT(1)                     NOT NULL DEFAULT 1       ,
  created_at     DATETIME                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME                           NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email      (email),
  KEY        idx_users_role      (role),
  KEY        idx_users_is_active (is_active)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
