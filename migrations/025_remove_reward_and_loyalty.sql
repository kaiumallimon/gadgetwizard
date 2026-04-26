-- Migration 025: Remove legacy reward and loyalty pricing features.

DROP TABLE IF EXISTS reward_points_ledger;

ALTER TABLE users
  DROP CHECK chk_users_reward_points_non_negative,
  DROP COLUMN reward_points;

ALTER TABLE products
  DROP CHECK chk_products_loyal_price_non_negative,
  DROP CHECK chk_products_loyal_lte_original_price,
  DROP INDEX idx_products_price_combo,
  DROP COLUMN loyal_customer_price;

CREATE INDEX idx_products_price_combo ON products (original_price, discounted_price);
