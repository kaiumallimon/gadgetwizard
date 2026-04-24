-- Migration 021: Create user_addresses table
-- Stores saved shipping addresses for users. is_default marks the primary address.

CREATE TABLE user_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(100) NULL COMMENT 'e.g. Home, Office',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line1 VARCHAR(500) NOT NULL,
  address_line2 VARCHAR(500) NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_user_addresses_user_id (user_id),

  CONSTRAINT fk_user_addresses_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
