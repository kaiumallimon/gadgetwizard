-- 014_drop_category_parent.sql
-- Removes parent category support and keeps categories as a flat collection.

SET @schema_name := DATABASE();

SET @parent_fk := (
  SELECT kcu.CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE kcu
  WHERE kcu.TABLE_SCHEMA = @schema_name
    AND kcu.TABLE_NAME = 'categories'
    AND kcu.COLUMN_NAME = 'parent_id'
    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @drop_parent_fk_sql := IF(
  @parent_fk IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE categories DROP FOREIGN KEY `', @parent_fk, '`')
);
PREPARE drop_parent_fk_stmt FROM @drop_parent_fk_sql;
EXECUTE drop_parent_fk_stmt;
DEALLOCATE PREPARE drop_parent_fk_stmt;

SET @drop_idx_parent_id_sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'categories'
      AND INDEX_NAME = 'idx_categories_parent_id'
  ),
  'ALTER TABLE categories DROP INDEX idx_categories_parent_id',
  'SELECT 1'
);
PREPARE drop_idx_parent_id_stmt FROM @drop_idx_parent_id_sql;
EXECUTE drop_idx_parent_id_stmt;
DEALLOCATE PREPARE drop_idx_parent_id_stmt;

SET @drop_idx_active_parent_sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'categories'
      AND INDEX_NAME = 'idx_categories_active_parent'
  ),
  'ALTER TABLE categories DROP INDEX idx_categories_active_parent',
  'SELECT 1'
);
PREPARE drop_idx_active_parent_stmt FROM @drop_idx_active_parent_sql;
EXECUTE drop_idx_active_parent_stmt;
DEALLOCATE PREPARE drop_idx_active_parent_stmt;

SET @drop_parent_column_sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'categories'
      AND COLUMN_NAME = 'parent_id'
  ),
  'ALTER TABLE categories DROP COLUMN parent_id',
  'SELECT 1'
);
PREPARE drop_parent_column_stmt FROM @drop_parent_column_sql;
EXECUTE drop_parent_column_stmt;
DEALLOCATE PREPARE drop_parent_column_stmt;
