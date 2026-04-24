import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface WishlistProductIdRow {
  productId: number;
  addedAt: string;
}

interface WishlistProductIdDbRow {
  product_id: number;
  created_at: Date | string;
}

interface WishlistEntryDbRow {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image_url: string | null;
  created_at: Date | string;
}

interface WishlistCountRow {
  total: number;
}

export interface AdminWishlistEntryRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  productId: number;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  createdAt: string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function addWishlistItem(userId: number, productId: number): Promise<void> {
  await execute(
    `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId, productId],
  );
}

export async function removeWishlistItem(userId: number, productId: number): Promise<void> {
  await execute(
    `
      DELETE FROM wishlist_items
      WHERE user_id = ? AND product_id = ?
      LIMIT 1
    `,
    [userId, productId],
  );
}

export async function isWishlisted(userId: number, productId: number): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `
      SELECT id
      FROM wishlist_items
      WHERE user_id = ? AND product_id = ?
      LIMIT 1
    `,
    [userId, productId],
  );

  return Boolean(row);
}

export async function listWishlistProductIdsByUser(userId: number): Promise<WishlistProductIdRow[]> {
  const rows = await queryRows<WishlistProductIdDbRow>(
    `
      SELECT product_id, created_at
      FROM wishlist_items
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    productId: row.product_id,
    addedAt: toIso(row.created_at),
  }));
}

export async function listAdminWishlistEntries(input: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{ items: AdminWishlistEntryRecord[]; total: number }> {
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  if (input.search) {
    whereParts.push("(u.name LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR p.slug LIKE ?)");
    const term = `%${input.search}%`;
    whereParams.push(term, term, term, term);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<WishlistEntryDbRow>(
    `
      SELECT
        w.id,
        w.user_id,
        u.name AS user_name,
        u.email AS user_email,
        w.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) AS product_image_url,
        w.created_at
      FROM wishlist_items w
      INNER JOIN users u ON u.id = w.user_id
      INNER JOIN products p ON p.id = w.product_id
      ${whereSql}
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, input.pageSize, offset],
  );

  const count = await queryOne<WishlistCountRow>(
    `
      SELECT COUNT(*) AS total
      FROM wishlist_items w
      INNER JOIN users u ON u.id = w.user_id
      INNER JOIN products p ON p.id = w.product_id
      ${whereSql}
    `,
    whereParams,
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      productId: row.product_id,
      productName: row.product_name,
      productSlug: row.product_slug,
      productImageUrl: row.product_image_url,
      createdAt: toIso(row.created_at),
    })),
    total: count?.total ?? 0,
  };
}
