-- 008_add_category_image_url.sql
-- Adds optional category image URL for richer category cards in storefront UX.

ALTER TABLE categories
    ADD COLUMN image_url VARCHAR(500) NULL AFTER icon;
