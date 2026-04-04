-- 003_create_products.sql
-- Product catalog table with JSON fields for CDN images and specifications.

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    description TEXT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discounted_price DECIMAL(12, 2) NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    category_id BIGINT UNSIGNED NOT NULL,
    images JSON NOT NULL,
    specifications JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_products_slug (slug),
    KEY idx_products_category_id (category_id),
    KEY idx_products_active_category (is_active, category_id),
    KEY idx_products_price (price),
    KEY idx_products_created_at (created_at),
    FULLTEXT KEY ftx_products_name_description (name, description),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_products_price_non_negative CHECK (price >= 0),
    CONSTRAINT chk_products_discount_non_negative CHECK (discounted_price IS NULL OR discounted_price >= 0),
    CONSTRAINT chk_products_discount_lte_price CHECK (discounted_price IS NULL OR discounted_price <= price),
    CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT chk_products_images_json CHECK (JSON_VALID(images)),
    CONSTRAINT chk_products_specifications_json CHECK (specifications IS NULL OR JSON_VALID(specifications))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
