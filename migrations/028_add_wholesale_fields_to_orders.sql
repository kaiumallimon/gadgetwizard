-- Migration 028: Mark wholesale orders and preserve wholesale line-item context.

ALTER TABLE orders
  ADD COLUMN purchase_mode ENUM('regular', 'business') NOT NULL DEFAULT 'regular' AFTER status,
  ADD COLUMN is_wholesale TINYINT(1) NOT NULL DEFAULT 0 AFTER purchase_mode,
  ADD COLUMN business_account_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD CONSTRAINT fk_orders_business_account
    FOREIGN KEY (business_account_id)
    REFERENCES business_accounts (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT chk_orders_is_wholesale_boolean
    CHECK (is_wholesale IN (0, 1));

CREATE INDEX idx_orders_purchase_mode ON orders (purchase_mode);
CREATE INDEX idx_orders_is_wholesale ON orders (is_wholesale);
CREATE INDEX idx_orders_business_account_id ON orders (business_account_id);

ALTER TABLE order_items
  ADD COLUMN is_wholesale_item TINYINT(1) NOT NULL DEFAULT 0 AFTER quantity,
  ADD COLUMN wholesale_unit_price DECIMAL(10, 2) NULL AFTER unit_price,
  ADD CONSTRAINT chk_order_items_is_wholesale_item_boolean
    CHECK (is_wholesale_item IN (0, 1)),
  ADD CONSTRAINT chk_order_items_wholesale_unit_price_non_negative
    CHECK (wholesale_unit_price IS NULL OR wholesale_unit_price >= 0),
  ADD CONSTRAINT chk_order_items_wholesale_unit_price_lte_unit_price
    CHECK (wholesale_unit_price IS NULL OR wholesale_unit_price <= unit_price);

CREATE INDEX idx_order_items_is_wholesale_item ON order_items (is_wholesale_item);
