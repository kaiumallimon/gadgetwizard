-- Migration 029: Keep stock snapshot in cart items to detect stale quantities at checkout.

ALTER TABLE cart_items
  ADD COLUMN product_stock_snapshot INT UNSIGNED NULL AFTER applied_discounted_price;

UPDATE cart_items ci
INNER JOIN products p ON p.id = ci.product_id
SET ci.product_stock_snapshot = p.stock
WHERE ci.product_stock_snapshot IS NULL;

ALTER TABLE cart_items
  MODIFY COLUMN product_stock_snapshot INT UNSIGNED NOT NULL,
  ADD CONSTRAINT chk_cart_items_stock_snapshot_non_negative
    CHECK (product_stock_snapshot >= 0);
