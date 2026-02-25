-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS environmental_light_pollution_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE environmental_light_pollution_db;

-- Creating TABLE pollution_levels
CREATE TABLE pollution_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL UNIQUE,
    color_code VARCHAR(20) NOT NULL,
    description TEXT
) ENGINE=InnoDB;