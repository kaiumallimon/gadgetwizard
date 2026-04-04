-- 009_add_header_category_flag.sql
-- Adds optional header category flag to control category links shown in top navigation.

ALTER TABLE categories
    ADD COLUMN is_header_category TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
    ADD KEY idx_categories_header_sort (is_header_category, sort_order);
