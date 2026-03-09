CREATE TABLE sessions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(255) NOT NULL                 ,
  ip_address  VARCHAR(45)      NULL DEFAULT NULL    ,
  user_agent  VARCHAR(255)     NULL DEFAULT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token    (token),
  KEY        idx_sessions_user_id (user_id),
  KEY        idx_sessions_expires (expires_at),

  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
