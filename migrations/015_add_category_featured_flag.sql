-- 015_add_category_featured_flag.sql
-- Adds optional featured category flag for storefront Featured Categories section.

ALTER TABLE categories
    ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_header_category,
    ADD KEY idx_categories_featured_sort (is_featured, sort_order);
