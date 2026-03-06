CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain ENUM('telco','retail') NOT NULL,
  version VARCHAR(50) NOT NULL,
  metrics_json JSON NULL,
  status ENUM('staging','production','archived') NOT NULL DEFAULT 'staging',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictions_telco (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_key VARCHAR(64) NOT NULL,
  churn_proba DOUBLE NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(customer_key)
);