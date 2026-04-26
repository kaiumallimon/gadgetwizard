-- Migration 027: Add business account applications and approval workflow.

CREATE TABLE business_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  business_name VARCHAR(255) NOT NULL,
  legal_entity_type VARCHAR(120) NOT NULL,
  registration_number VARCHAR(120) NULL,
  tax_id VARCHAR(120) NULL,
  years_in_operation SMALLINT UNSIGNED NULL,
  website_url VARCHAR(500) NULL,
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_role VARCHAR(120) NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(30) NOT NULL,
  address_line1 VARCHAR(500) NOT NULL,
  address_line2 VARCHAR(500) NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(120) NOT NULL DEFAULT 'Bangladesh',
  monthly_purchase_volume VARCHAR(120) NULL,
  product_categories JSON NULL,
  document_urls JSON NULL,
  additional_notes TEXT NULL,
  review_notes TEXT NULL,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_business_accounts_user_id (user_id),
  KEY idx_business_accounts_status_created (status, created_at),
  KEY idx_business_accounts_primary_contact_email (primary_contact_email),
  KEY idx_business_accounts_business_name (business_name),

  CONSTRAINT fk_business_accounts_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_business_accounts_reviewed_by_user
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT chk_business_accounts_years_in_operation_non_negative
    CHECK (years_in_operation IS NULL OR years_in_operation >= 0),
  CONSTRAINT chk_business_accounts_product_categories_json
    CHECK (product_categories IS NULL OR JSON_VALID(product_categories)),
  CONSTRAINT chk_business_accounts_document_urls_json
    CHECK (document_urls IS NULL OR JSON_VALID(document_urls))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
