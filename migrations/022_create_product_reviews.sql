-- Migration 022: Create product_reviews table
-- Users may only review a product once per delivered order.
-- Reviews require admin approval before being visible on storefront.

CREATE TABLE product_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  images JSON NULL COMMENT 'Array of image URLs',
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- A user can only review a product once per order
  UNIQUE KEY uk_review_product_user_order (product_id, user_id, order_id),

  INDEX idx_reviews_product_id (product_id),
  INDEX idx_reviews_user_id (user_id),
  INDEX idx_reviews_order_id (order_id),
  INDEX idx_reviews_status (status),

  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id)
    REFERENCES products (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_reviews_order
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
