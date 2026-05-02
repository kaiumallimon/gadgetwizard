-- Migration 034: Track partial fulfillment quantities and refunds

ALTER TABLE order_items
  ADD COLUMN delivered_quantity INT UNSIGNED NOT NULL DEFAULT 0 AFTER quantity,
  ADD COLUMN refunded_quantity INT UNSIGNED NOT NULL DEFAULT 0 AFTER delivered_quantity,
  ADD CONSTRAINT chk_order_items_delivered_quantity_non_negative CHECK (delivered_quantity >= 0),
  ADD CONSTRAINT chk_order_items_refunded_quantity_non_negative CHECK (refunded_quantity >= 0),
  ADD CONSTRAINT chk_order_items_delivered_quantity_lte_quantity CHECK (delivered_quantity <= quantity),
  ADD CONSTRAINT chk_order_items_refunded_quantity_lte_quantity CHECK (refunded_quantity <= quantity),
  ADD CONSTRAINT chk_order_items_fulfillment_total_lte_quantity CHECK (delivered_quantity + refunded_quantity <= quantity);

CREATE TABLE order_refunds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  admin_user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('stripe') NOT NULL DEFAULT 'stripe',
  provider_refund_id VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_order_refunds_provider_refund_id (provider_refund_id),
  INDEX idx_order_refunds_order_id (order_id),
  INDEX idx_order_refunds_user_id (user_id),
  INDEX idx_order_refunds_admin_user_id (admin_user_id),

  CONSTRAINT fk_order_refunds_order
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_order_refunds_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_order_refunds_admin_user
    FOREIGN KEY (admin_user_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
