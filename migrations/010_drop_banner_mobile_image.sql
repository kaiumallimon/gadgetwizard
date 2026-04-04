-- 010_drop_banner_mobile_image.sql
-- Remove legacy mobile-specific banner image column.

ALTER TABLE banners
  DROP COLUMN IF EXISTS mobile_image_url;
