import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface BrandRecord {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandRow {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: number;
  is_featured: number;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapBrand(row: BrandRow): BrandRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    isFeatured: row.is_featured === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listBrands(activeOnly = true): Promise<BrandRecord[]> {
  const conditions = activeOnly ? "WHERE is_active = 1" : "";
  const rows = await queryRows<BrandRow>(
    `
      SELECT id, name, slug, image_url, description, sort_order, is_active, is_featured, created_at, updated_at
      FROM brands
      ${conditions}
      ORDER BY sort_order ASC, name ASC
    `,
  );

  return rows.map(mapBrand);
}

export async function findBrandById(id: number): Promise<BrandRecord | null> {
  const row = await queryOne<BrandRow>(
    `
      SELECT id, name, slug, image_url, description, sort_order, is_active, is_featured, created_at, updated_at
      FROM brands
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return row ? mapBrand(row) : null;
}

export async function findBrandBySlug(slug: string): Promise<BrandRecord | null> {
  const row = await queryOne<BrandRow>(
    `
      SELECT id, name, slug, image_url, description, sort_order, is_active, is_featured, created_at, updated_at
      FROM brands
      WHERE slug = ?
      LIMIT 1
    `,
    [slug],
  );

  return row ? mapBrand(row) : null;
}

export async function createBrand(input: {
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}): Promise<BrandRecord> {
  const result = await execute(
    `
      INSERT INTO brands (name, slug, image_url, description, sort_order, is_active, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.slug,
      input.imageUrl,
      input.description,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.isFeatured ? 1 : 0,
    ],
  );

  const brand = await findBrandById(result.insertId);
  if (!brand) {
    throw new Error("Unable to create brand");
  }

  return brand;
}

export async function updateBrand(
  id: number,
  input: {
    name: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
  },
): Promise<BrandRecord | null> {
  await execute(
    `
      UPDATE brands
      SET name = ?, slug = ?, image_url = ?, description = ?, sort_order = ?, is_active = ?, is_featured = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.slug,
      input.imageUrl,
      input.description,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.isFeatured ? 1 : 0,
      id,
    ],
  );

  return findBrandById(id);
}

export async function deleteBrand(id: number): Promise<void> {
  await execute("DELETE FROM brands WHERE id = ?", [id]);
}
