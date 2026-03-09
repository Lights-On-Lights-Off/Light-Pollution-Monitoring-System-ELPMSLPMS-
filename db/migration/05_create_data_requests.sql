CREATE TABLE data_requests (
  id               INT UNSIGNED                        NOT NULL AUTO_INCREMENT,
  request_code     VARCHAR(30)                         NOT NULL              ,
  user_id          INT UNSIGNED                        NOT NULL,
  building_id      INT UNSIGNED                        NOT NULL,
  data_type        VARCHAR(100)                        NOT NULL              ,
  purpose          TEXT                                    NULL DEFAULT NULL,
  additional_notes TEXT                                    NULL DEFAULT NULL,
  start_date       DATE                                    NULL DEFAULT NULL  ,
  end_date         DATE                                    NULL DEFAULT NULL  ,
  status           ENUM('pending','approved','denied') NOT NULL DEFAULT 'pending',
  reviewed_by      INT UNSIGNED                            NULL DEFAULT NULL  ,
  reviewed_at      DATETIME                                NULL DEFAULT NULL  ,
  is_deleted       TINYINT(1)                          NOT NULL DEFAULT 0    ,
  deleted_at       DATETIME                                NULL DEFAULT NULL,
  submitted_at     DATETIME                            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_requests_code          (request_code),
  KEY        idx_requests_user_id      (user_id),
  KEY        idx_requests_building_id  (building_id),
  KEY        idx_requests_status       (status),
  KEY        idx_requests_is_deleted   (is_deleted),
  KEY        idx_requests_submitted_at (submitted_at),
  KEY        idx_requests_reviewed_by  (reviewed_by),

  CONSTRAINT fk_requests_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_requests_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_requests_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
