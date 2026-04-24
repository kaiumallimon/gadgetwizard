-- Migration 024: Create order_payments table
-- Stores immutable payment transaction records for completed orders.

CREATE TABLE order_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('stripe') NOT NULL DEFAULT 'stripe',
  provider_payment_id VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  amount_received DECIMAL(10, 2) NOT NULL,
  status VARCHAR(100) NOT NULL,
  payment_method_types JSON NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_order_payments_order_id (order_id),
  UNIQUE KEY uk_order_payments_provider_payment_id (provider_payment_id),
  INDEX idx_order_payments_user_id (user_id),
  INDEX idx_order_payments_status (status),
  INDEX idx_order_payments_paid_at (paid_at),

  CONSTRAINT fk_order_payments_order
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_order_payments_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
