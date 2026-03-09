CREATE TABLE buildings (
  id              INT UNSIGNED                  NOT NULL AUTO_INCREMENT,
  code            VARCHAR(10)                       NULL DEFAULT NULL     ,
  name            VARCHAR(100)                  NOT NULL,
  description     TEXT                              NULL DEFAULT NULL,
  latitude        DECIMAL(10,8)                 NOT NULL                  ,
  longitude       DECIMAL(11,8)                 NOT NULL                  ,
  pollution_level ENUM('low','moderate','high') NOT NULL DEFAULT 'moderate',
  lux_baseline    DECIMAL(6,2)                  NOT NULL DEFAULT 0.00     ,
  is_online       TINYINT(1)                    NOT NULL DEFAULT 1        ,
  is_deleted      TINYINT(1)                    NOT NULL DEFAULT 0        ,
  deleted_at      DATETIME                          NULL DEFAULT NULL,
  created_at      DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME                          NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_buildings_code             (code),
  KEY        idx_buildings_pollution_level (pollution_level),
  KEY        idx_buildings_is_deleted      (is_deleted),
  KEY        idx_buildings_is_online       (is_online)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
