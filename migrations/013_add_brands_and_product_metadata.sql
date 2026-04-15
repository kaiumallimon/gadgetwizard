-- 013_add_brands_and_product_metadata.sql
-- Adds brand management and expands products for production-grade ecommerce metadata.

CREATE TABLE IF NOT EXISTS brands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(140) NOT NULL,
    slug VARCHAR(170) NOT NULL,
    image_url VARCHAR(500) NULL,
    description TEXT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_brands_name (name),
    UNIQUE KEY uk_brands_slug (slug),
    KEY idx_brands_active_sort (is_active, sort_order),
    CONSTRAINT chk_brands_sort_order_non_negative CHECK (sort_order >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS original_price DECIMAL(12, 2) NULL AFTER price,
    ADD COLUMN IF NOT EXISTS loyal_customer_price DECIMAL(12, 2) NULL AFTER discounted_price,
    ADD COLUMN IF NOT EXISTS brand_id BIGINT UNSIGNED NULL AFTER category_id,
    ADD COLUMN IF NOT EXISTS short_description VARCHAR(500) NULL AFTER description,
    ADD COLUMN IF NOT EXISTS sku VARCHAR(120) NULL AFTER brand_id,
    ADD COLUMN IF NOT EXISTS model_number VARCHAR(120) NULL AFTER sku,
    ADD COLUMN IF NOT EXISTS color VARCHAR(80) NULL AFTER model_number,
    ADD COLUMN IF NOT EXISTS warranty_months SMALLINT UNSIGNED NULL AFTER color,
    ADD COLUMN IF NOT EXISTS return_window_days SMALLINT UNSIGNED NULL AFTER warranty_months,
    ADD COLUMN IF NOT EXISTS weight_grams INT UNSIGNED NULL AFTER return_window_days,
    ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
    ADD COLUMN IF NOT EXISTS is_new_arrival TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured,
    ADD COLUMN IF NOT EXISTS is_best_seller TINYINT(1) NOT NULL DEFAULT 0 AFTER is_new_arrival,
    ADD COLUMN IF NOT EXISTS is_top_rated TINYINT(1) NOT NULL DEFAULT 0 AFTER is_best_seller,
    ADD COLUMN IF NOT EXISTS is_trending TINYINT(1) NOT NULL DEFAULT 0 AFTER is_top_rated,
    ADD COLUMN IF NOT EXISTS is_limited_stock TINYINT(1) NOT NULL DEFAULT 0 AFTER is_trending,
    ADD COLUMN IF NOT EXISTS is_free_delivery TINYINT(1) NOT NULL DEFAULT 0 AFTER is_limited_stock,
    ADD COLUMN IF NOT EXISTS is_cash_on_delivery TINYINT(1) NOT NULL DEFAULT 0 AFTER is_free_delivery,
    ADD COLUMN IF NOT EXISTS is_emi_available TINYINT(1) NOT NULL DEFAULT 0 AFTER is_cash_on_delivery,
    ADD COLUMN IF NOT EXISTS is_official_warranty TINYINT(1) NOT NULL DEFAULT 0 AFTER is_emi_available,
    ADD COLUMN IF NOT EXISTS is_exchange_available TINYINT(1) NOT NULL DEFAULT 0 AFTER is_official_warranty,
    ADD COLUMN IF NOT EXISTS is_preorder TINYINT(1) NOT NULL DEFAULT 0 AFTER is_exchange_available,
    ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3, 2) NOT NULL DEFAULT 0.00 AFTER is_preorder,
    ADD COLUMN IF NOT EXISTS rating_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER rating_avg,
    ADD COLUMN IF NOT EXISTS tags JSON NULL AFTER specifications,
    ADD COLUMN IF NOT EXISTS highlight_points JSON NULL AFTER tags,
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL AFTER highlight_points,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500) NULL AFTER meta_title;

UPDATE products
SET original_price = price
WHERE original_price IS NULL;

UPDATE products
SET loyal_customer_price = COALESCE(loyal_customer_price, discounted_price, original_price)
WHERE loyal_customer_price IS NULL;

ALTER TABLE products
    MODIFY COLUMN original_price DECIMAL(12, 2) NOT NULL;

ALTER TABLE products
    ADD CONSTRAINT chk_products_original_price_non_negative CHECK (original_price >= 0),
    ADD CONSTRAINT chk_products_loyal_price_non_negative CHECK (loyal_customer_price IS NULL OR loyal_customer_price >= 0),
    ADD CONSTRAINT chk_products_discount_lte_original_price CHECK (discounted_price IS NULL OR discounted_price <= original_price),
    ADD CONSTRAINT chk_products_loyal_lte_original_price CHECK (loyal_customer_price IS NULL OR loyal_customer_price <= original_price),
    ADD CONSTRAINT chk_products_rating_avg_range CHECK (rating_avg >= 0 AND rating_avg <= 5),
    ADD CONSTRAINT chk_products_rating_count_non_negative CHECK (rating_count >= 0),
    ADD CONSTRAINT chk_products_tags_json CHECK (tags IS NULL OR JSON_VALID(tags)),
    ADD CONSTRAINT chk_products_highlight_points_json CHECK (highlight_points IS NULL OR JSON_VALID(highlight_points));

ALTER TABLE products
    ADD CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id)
        REFERENCES brands (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

CREATE INDEX idx_products_brand_id ON products (brand_id);
CREATE INDEX idx_products_featured_active ON products (is_featured, is_active);
CREATE INDEX idx_products_new_arrival_active ON products (is_new_arrival, is_active);
CREATE INDEX idx_products_best_seller_active ON products (is_best_seller, is_active);
CREATE INDEX idx_products_price_combo ON products (original_price, discounted_price, loyal_customer_price);
CREATE INDEX idx_products_sku ON products (sku);
