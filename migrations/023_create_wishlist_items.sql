-- Migration 023: Create wishlist_items table
-- Stores one wishlist entry per user/product pair.

CREATE TABLE wishlist_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
  INDEX idx_wishlist_user_id (user_id),
  INDEX idx_wishlist_product_id (product_id),
  INDEX idx_wishlist_created_at (created_at),

  CONSTRAINT fk_wishlist_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_wishlist_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
