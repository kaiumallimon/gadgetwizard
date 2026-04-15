-- 016_enforce_unique_product_sku.sql
-- Enforces unique SKU values for products.
-- Existing duplicate SKUs are normalized by appending the product id.

SET @schema_name := DATABASE();

UPDATE products
SET sku = NULL
WHERE sku IS NOT NULL
  AND TRIM(sku) = '';

UPDATE products p
JOIN (
  SELECT sku
  FROM products
  WHERE sku IS NOT NULL
  GROUP BY sku
  HAVING COUNT(*) > 1
) d ON d.sku = p.sku
SET p.sku = CONCAT(LEFT(p.sku, 108), '-', p.id);

SET @drop_old_sku_index_sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'products'
      AND INDEX_NAME = 'idx_products_sku'
  ),
  'ALTER TABLE products DROP INDEX idx_products_sku',
  'SELECT 1'
);
PREPARE drop_old_sku_index_stmt FROM @drop_old_sku_index_sql;
EXECUTE drop_old_sku_index_stmt;
DEALLOCATE PREPARE drop_old_sku_index_stmt;

SET @add_unique_sku_sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'products'
      AND INDEX_NAME = 'uk_products_sku'
  ),
  'SELECT 1',
  'ALTER TABLE products ADD CONSTRAINT uk_products_sku UNIQUE (sku)'
);
PREPARE add_unique_sku_stmt FROM @add_unique_sku_sql;
EXECUTE add_unique_sku_stmt;
DEALLOCATE PREPARE add_unique_sku_stmt;
