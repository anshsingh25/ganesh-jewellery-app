-- Ganesh Jewellers - MySQL schema for multi-device sync
-- Run once: mysql -u user -p database < schema.sql
-- Schema matches app's Customer/Installment/Scheme model

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role ENUM('owner','staff') NOT NULL,
  pin_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  address TEXT,
  id_proof_url TEXT,
  customer_pin VARCHAR(20),
  scheme_type INT NOT NULL,
  monthly_emi_amount INT NOT NULL,
  start_date DATE NOT NULL,
  status ENUM('active','completed','closed') DEFAULT 'active',
  completed_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  document_status ENUM('pending','verified','rejected') DEFAULT 'pending',
  document_verified_at DATE,
  document_verified_by VARCHAR(255),
  auto_pay_enabled TINYINT(1) DEFAULT 0,
  scheme_id VARCHAR(36),
  UNIQUE KEY uk_mobile (mobile)
);

CREATE TABLE IF NOT EXISTS installments (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  month_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount INT NOT NULL,
  status ENUM('pending','paid','overdue') DEFAULT 'pending',
  paid_date DATE,
  paid_amount INT,
  note TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schemes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  months INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS key_value (
  key_name VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default schemes
INSERT IGNORE INTO schemes (id, name, months, is_active) VALUES
('scheme-5', '5 Months', 5, 1),
('scheme-11', '11 Months', 11, 1);
