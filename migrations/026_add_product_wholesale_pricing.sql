-- Migration 026: Add wholesale pricing support to products.

ALTER TABLE products
  ADD COLUMN wholesale_price DECIMAL(12, 2) NULL AFTER discounted_price,
  ADD COLUMN wholesale_min_quantity INT UNSIGNED NULL AFTER wholesale_price,
  ADD CONSTRAINT chk_products_wholesale_price_non_negative
    CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
  ADD CONSTRAINT chk_products_wholesale_min_quantity_non_negative
    CHECK (wholesale_min_quantity IS NULL OR wholesale_min_quantity >= 0),
  ADD CONSTRAINT chk_products_wholesale_lte_original_price
    CHECK (wholesale_price IS NULL OR wholesale_price <= original_price),
  ADD CONSTRAINT chk_products_wholesale_pairing
    CHECK (
      (wholesale_price IS NULL AND wholesale_min_quantity IS NULL)
      OR (wholesale_price IS NOT NULL AND wholesale_min_quantity IS NOT NULL AND wholesale_min_quantity >= 2)
    );

CREATE INDEX idx_products_wholesale_min_quantity ON products (wholesale_min_quantity);
