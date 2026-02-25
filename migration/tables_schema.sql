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

-- TABLE: admin
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABLE for locations
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    pollution_level_id INT NOT NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 

    CONSTRAINT fk_location_pollution
        FOREIGN KEY (pollution_level_id)
        REFERENCES pollution_levels(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_location_admin
        FOREIGN KEY (created_by)
        REFERENCES admins(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;

-- TABLE: feedback

CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    message TEXT NOT NULL,
    status ENUM('Pending', 'Reviewed', 'Resolved') 
        NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_location
        FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;
