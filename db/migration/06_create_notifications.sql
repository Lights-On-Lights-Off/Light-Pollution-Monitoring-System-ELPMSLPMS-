CREATE TABLE notifications (
  id          INT UNSIGNED                     NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED                     NOT NULL                  ,
  request_id  INT UNSIGNED                     NOT NULL                  ,
  title       VARCHAR(150)                     NOT NULL,
  message     TEXT                             NOT NULL,
  type        ENUM('approved','denied','info') NOT NULL DEFAULT 'info',
  is_read     TINYINT(1)                       NOT NULL DEFAULT 0,
  created_at  DATETIME                         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notif_user_id    (user_id),
  KEY idx_notif_request_id (request_id),
  KEY idx_notif_is_read    (is_read),
  KEY idx_notif_created_at (created_at),

  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_notif_request
    FOREIGN KEY (request_id) REFERENCES data_requests (id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
