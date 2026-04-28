-- Migration 032: Create inventory_reservations table
-- Holds selected cart item quantities for a short checkout window.

CREATE TABLE inventory_reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_group_id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_intent_id VARCHAR(255) NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  status ENUM('active', 'fulfilled', 'released') NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_inventory_res_product_status_exp (product_id, status, expires_at),
  INDEX idx_inventory_res_user_status_exp (user_id, status, expires_at),
  INDEX idx_inventory_res_group_status (reservation_group_id, status),
  INDEX idx_inventory_res_payment_intent (payment_intent_id(191)),

  CONSTRAINT fk_inventory_res_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_inventory_res_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
