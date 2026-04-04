-- 005_create_cart_activity.sql
-- Event log table for basic cart analytics in admin dashboard.

CREATE TABLE IF NOT EXISTS cart_activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    cart_id BIGINT UNSIGNED NULL,
    product_id BIGINT UNSIGNED NULL,
    action ENUM('add', 'update', 'remove') NOT NULL,
    quantity_before INT UNSIGNED NULL,
    quantity_after INT UNSIGNED NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cart_activity_user_id (user_id),
    KEY idx_cart_activity_action (action),
    KEY idx_cart_activity_created_at (created_at),
    CONSTRAINT fk_cart_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_cart_activity_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_cart_activity_product
        FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_cart_activity_metadata_json CHECK (metadata IS NULL OR JSON_VALID(metadata))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
