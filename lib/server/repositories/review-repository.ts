import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { ReviewStatus } from "@/lib/client/types";

export interface ReviewRecord {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number;
  rating: number;
  comment: string;
  images: string | null; // JSON string
  status: ReviewStatus;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
  // joins
  user_name?: string;
  user_email?: string;
  product_name?: string;
  product_slug?: string;
}

export interface CreateReviewInput {
  productId: number;
  userId: number;
  orderId: number;
  rating: number;
  comment: string;
  images?: string[];
}

export async function createReview(input: CreateReviewInput): Promise<ReviewRecord> {
  const result = await execute(
    `INSERT INTO product_reviews
      (product_id, user_id, order_id, rating, comment, images, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      input.productId,
      input.userId,
      input.orderId,
      input.rating,
      input.comment,
      input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
    ],
  );

  const review = await getReviewById(result.insertId);
  if (!review) throw new Error("Failed to retrieve created review");
  return review;
}

export async function getReviewById(id: number): Promise<ReviewRecord | null> {
  return queryOne<ReviewRecord>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug
     FROM product_reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     WHERE r.id = ?`,
    [id],
  );
}

export async function getApprovedReviewsByProductId(productId: number): Promise<ReviewRecord[]> {
  return queryRows<ReviewRecord>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug
     FROM product_reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     WHERE r.product_id = ? AND r.status = 'approved'
     ORDER BY r.created_at DESC`,
    [productId],
  );
}

export async function findUserReviewForProductOrder(
  userId: number,
  productId: number,
  orderId: number,
): Promise<ReviewRecord | null> {
  return queryOne<ReviewRecord>(
    `SELECT * FROM product_reviews
     WHERE user_id = ? AND product_id = ? AND order_id = ?`,
    [userId, productId, orderId],
  );
}

export async function listUserReviewsByOrder(
  userId: number,
  orderId: number,
): Promise<ReviewRecord[]> {
  return queryRows<ReviewRecord>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug
     FROM product_reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     WHERE r.user_id = ? AND r.order_id = ?
     ORDER BY r.created_at DESC`,
    [userId, orderId],
  );
}

export interface ListReviewsFilter {
  status?: ReviewStatus;
  page: number;
  pageSize: number;
}

export async function listReviews(filter: ListReviewsFilter): Promise<{ rows: ReviewRecord[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.status) {
    conditions.push("r.status = ?");
    params.push(filter.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM product_reviews r ${where}`,
    params,
  );

  const total = countResult?.total ?? 0;
  const offset = (filter.page - 1) * filter.pageSize;

  const rows = await queryRows<ReviewRecord>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug
     FROM product_reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filter.pageSize, offset],
  );

  return { rows, total };
}

export async function updateReviewStatus(
  id: number,
  status: ReviewStatus,
  adminNote?: string,
): Promise<void> {
  await execute(
    `UPDATE product_reviews
     SET status = ?, admin_note = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, adminNote ?? null, id],
  );
}

export async function deleteReview(id: number): Promise<void> {
  await execute(
    `DELETE FROM product_reviews WHERE id = ?`,
    [id],
  );
}

export async function recomputeProductRating(productId: number): Promise<void> {
  const stats = await queryOne<{ avg_rating: number | null; rating_count: number }>(
    `SELECT
       AVG(rating) AS avg_rating,
       COUNT(*) AS rating_count
     FROM product_reviews
     WHERE product_id = ?
       AND status = 'approved'`,
    [productId],
  );

  const avgRating = stats?.avg_rating ? Number(stats.avg_rating.toFixed(2)) : 0;
  const ratingCount = stats?.rating_count ?? 0;

  await execute(
    `UPDATE products
     SET rating_avg = ?, rating_count = ?, updated_at = NOW()
     WHERE id = ?`,
    [avgRating, ratingCount, productId],
  );
}
