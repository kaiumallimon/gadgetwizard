import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface ProductRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  stock: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  images: string[];
  specifications: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  discounted_price: string | number | null;
  stock: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  images: string;
  specifications: string | null;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ProductCountRow {
  total: number;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    discountedPrice: row.discounted_price === null ? null : Number(row.discounted_price),
    stock: row.stock,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    images: parseJson<string[]>(row.images) ?? [],
    specifications: parseJson<Record<string, unknown>>(row.specifications),
    isActive: row.is_active === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listProducts(input: {
  page: number;
  pageSize: number;
  categorySlug?: string;
  search?: string;
  activeOnly: boolean;
}): Promise<{ items: ProductRecord[]; total: number }> {
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  if (input.activeOnly) {
    whereParts.push("p.is_active = 1");
  }

  if (input.categorySlug) {
    whereParts.push("c.slug = ?");
    whereParams.push(input.categorySlug);
  }

  if (input.search) {
    whereParts.push("(p.name LIKE ? OR p.description LIKE ?)");
    whereParams.push(`%${input.search}%`, `%${input.search}%`);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.discounted_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, input.pageSize, offset],
  );

  const countRow = await queryOne<ProductCountRow>(
    `
      SELECT COUNT(*) AS total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      ${whereClause}
    `,
    whereParams,
  );

  return {
    items: rows.map(mapProduct),
    total: countRow?.total ?? 0,
  };
}

export async function findProductBySlug(slug: string, activeOnly = true): Promise<ProductRecord | null> {
  const activeCondition = activeOnly ? "AND p.is_active = 1" : "";
  const row = await queryOne<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.discounted_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ?
      ${activeCondition}
      LIMIT 1
    `,
    [slug],
  );

  return row ? mapProduct(row) : null;
}

export async function findProductById(id: number, activeOnly = false): Promise<ProductRecord | null> {
  const activeCondition = activeOnly ? "AND p.is_active = 1" : "";
  const row = await queryOne<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.discounted_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?
      ${activeCondition}
      LIMIT 1
    `,
    [id],
  );

  return row ? mapProduct(row) : null;
}

export async function createProduct(input: {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  stock: number;
  categoryId: number;
  images: string[];
  specifications: Record<string, unknown> | null;
  isActive: boolean;
}): Promise<ProductRecord> {
  const result = await execute(
    `
      INSERT INTO products
      (name, slug, description, price, discounted_price, stock, category_id, images, specifications, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.slug,
      input.description,
      input.price,
      input.discountedPrice,
      input.stock,
      input.categoryId,
      JSON.stringify(input.images),
      input.specifications ? JSON.stringify(input.specifications) : null,
      input.isActive ? 1 : 0,
    ],
  );

  const product = await findProductById(result.insertId);
  if (!product) {
    throw new Error("Unable to create product");
  }

  return product;
}

export async function updateProduct(
  id: number,
  input: {
    name: string;
    slug: string;
    description: string | null;
    price: number;
    discountedPrice: number | null;
    stock: number;
    categoryId: number;
    images: string[];
    specifications: Record<string, unknown> | null;
    isActive: boolean;
  },
): Promise<ProductRecord | null> {
  await execute(
    `
      UPDATE products
      SET
        name = ?,
        slug = ?,
        description = ?,
        price = ?,
        discounted_price = ?,
        stock = ?,
        category_id = ?,
        images = ?,
        specifications = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.slug,
      input.description,
      input.price,
      input.discountedPrice,
      input.stock,
      input.categoryId,
      JSON.stringify(input.images),
      input.specifications ? JSON.stringify(input.specifications) : null,
      input.isActive ? 1 : 0,
      id,
    ],
  );

  return findProductById(id);
}

export async function deleteProduct(id: number): Promise<void> {
  await execute("DELETE FROM products WHERE id = ?", [id]);
}
