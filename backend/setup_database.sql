-- Create database if not exists
CREATE DATABASE IF NOT EXISTS pf_allocation;
USE pf_allocation;

-- Create security table
CREATE TABLE IF NOT EXISTS security (
    id INT AUTO_INCREMENT PRIMARY KEY,
    security_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    is_active BOOLEAN DEFAULT 1
);

-- Create portfolio_table
CREATE TABLE IF NOT EXISTS portfolio_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    notes TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (stock_id) REFERENCES security(id)
);

-- Create indexes table
CREATE TABLE IF NOT EXISTS indexes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    security_id INT,
    security_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (security_id) REFERENCES security(id)
);

-- Create modify_history table
CREATE TABLE IF NOT EXISTS modify_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    security_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    current_price DECIMAL(10,2),
    index_weight DECIMAL(10,2),
    index_shares INT,
    index_price_per_share DECIMAL(10,2),
    index_price DECIMAL(10,2),
    analyst_weight DECIMAL(10,2),
    analyst_shares INT,
    analyst_price_per_share DECIMAL(10,2),
    analyst_price DECIMAL(10,2),
    analyst_stance VARCHAR(50),
    notes TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create old_prices table
CREATE TABLE IF NOT EXISTS old_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    security_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (security_id) REFERENCES security(id)
); 