CREATE TABLE building_readings (
  id              BIGINT UNSIGNED               NOT NULL AUTO_INCREMENT,
  building_id     INT UNSIGNED                  NOT NULL,
  hour_start      DATETIME                      NOT NULL                  ,
  avg_lux         DECIMAL(6,2)                  NOT NULL                  ,
  min_lux         DECIMAL(6,2)                      NULL DEFAULT NULL     ,
  max_lux         DECIMAL(6,2)                      NULL DEFAULT NULL     ,
  sample_count    SMALLINT UNSIGNED             NOT NULL DEFAULT 1        ,
  pollution_level ENUM('low','moderate','high') NOT NULL                  ,
  recorded_at     DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_readings_building_hour (building_id, hour_start),
  KEY        idx_readings_hour_start   (hour_start),
  KEY        idx_readings_pollution    (pollution_level),

  CONSTRAINT fk_readings_building
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
