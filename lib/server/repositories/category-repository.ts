import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  isHeaderCategory: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  is_header_category: number;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapCategory(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    isHeaderCategory: row.is_header_category === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listCategories(activeOnly = true): Promise<CategoryRecord[]> {
  const conditions = activeOnly ? "WHERE is_active = 1" : "";
  const rows = await queryRows<CategoryRow>(
    `
      SELECT id, name, slug, icon, image_url, parent_id, sort_order, is_active, is_header_category, created_at, updated_at
      FROM categories
      ${conditions}
      ORDER BY sort_order ASC, name ASC
    `,
  );

  return rows.map(mapCategory);
}

export async function findCategoryById(id: number): Promise<CategoryRecord | null> {
  const row = await queryOne<CategoryRow>(
    `
      SELECT id, name, slug, icon, image_url, parent_id, sort_order, is_active, is_header_category, created_at, updated_at
      FROM categories
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return row ? mapCategory(row) : null;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  isHeaderCategory: boolean;
}): Promise<CategoryRecord> {
  const result = await execute(
    `
      INSERT INTO categories (name, slug, icon, image_url, parent_id, sort_order, is_active, is_header_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.slug,
      input.icon,
      input.imageUrl,
      input.parentId,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.isHeaderCategory ? 1 : 0,
    ],
  );

  const category = await findCategoryById(result.insertId);
  if (!category) {
    throw new Error("Unable to create category");
  }

  return category;
}

export async function updateCategory(
  id: number,
  input: {
    name: string;
    slug: string;
    icon: string | null;
    imageUrl: string | null;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
    isHeaderCategory: boolean;
  },
): Promise<CategoryRecord | null> {
  await execute(
    `
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, image_url = ?, parent_id = ?, sort_order = ?, is_active = ?, is_header_category = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.slug,
      input.icon,
      input.imageUrl,
      input.parentId,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.isHeaderCategory ? 1 : 0,
      id,
    ],
  );

  return findCategoryById(id);
}

export async function deleteCategory(id: number): Promise<void> {
  await execute("DELETE FROM categories WHERE id = ?", [id]);
}

export async function countHeaderCategories(excludeCategoryId?: number): Promise<number> {
  if (excludeCategoryId) {
    const row = await queryOne<{ total: number }>(
      "SELECT COUNT(*) AS total FROM categories WHERE is_header_category = 1 AND id <> ?",
      [excludeCategoryId],
    );

    return row?.total ?? 0;
  }

  const row = await queryOne<{ total: number }>(
    "SELECT COUNT(*) AS total FROM categories WHERE is_header_category = 1",
  );

  return row?.total ?? 0;
}
