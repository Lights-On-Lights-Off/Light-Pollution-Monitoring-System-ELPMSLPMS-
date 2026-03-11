CREATE TABLE activity_log (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id     INT UNSIGNED     NULL DEFAULT NULL     ,
  action       ENUM(
                 'approved_request',
                 'denied_request',
                 'deleted',
                 'restored',
                 'role_changed',
                 'added_building',
                 'edited_building',
                 'deleted_building',
                 'user_deleted'
               )            NOT NULL,
  target_type  ENUM(
                 'request',
                 'building',
                 'user'
               )            NOT NULL                 ,
  target_id    INT UNSIGNED     NULL DEFAULT NULL     ,
  detail       TEXT             NULL DEFAULT NULL     ,
  meta         JSON             NULL DEFAULT NULL     ,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_log_actor_id   (actor_id),
  KEY idx_log_action     (action),
  KEY idx_log_target     (target_type, target_id),
  KEY idx_log_created_at (created_at),

  CONSTRAINT fk_log_actor
    FOREIGN KEY (actor_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
