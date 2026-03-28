CREATE DATABASE IF NOT EXISTS analytics_db;
USE analytics_db;

CREATE TABLE IF NOT EXISTS staging_rent_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100),
    province VARCHAR(100),
    year INT,
    month INT,
    avg_rent DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS cities (
    city_id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_city_province (city_name, province)
);

CREATE TABLE IF NOT EXISTS monthly_rent (
    rent_id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    avg_rent DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_monthly_rent_city
      FOREIGN KEY (city_id) REFERENCES cities(city_id)
      ON DELETE CASCADE
);

CREATE INDEX idx_monthly_rent_city_year_month
ON monthly_rent (city_id, year, month);