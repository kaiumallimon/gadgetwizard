import { badRequest, conflict, notFound } from "@/lib/server/core/errors";
import type { ProductReview, ReviewStatus } from "@/lib/client/types";
import {
  createReview,
  deleteReview,
  getReviewById,
  getApprovedReviewsByProductId,
  findUserReviewForProductOrder,
  listUserReviewsByOrder,
  listReviews,
  recomputeProductRating,
  updateReviewStatus,
  type ReviewRecord,
  type ListReviewsFilter,
} from "@/lib/server/repositories/review-repository";
import { findProductById } from "@/lib/server/repositories/product-repository";
import { hasUserDeliveredOrderForProductInOrder } from "@/lib/server/repositories/order-repository";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapReview(row: ReviewRecord): ProductReview {
  let images: string[] = [];
  if (row.images) {
    try {
      images = JSON.parse(row.images) as string[];
    } catch {
      images = [];
    }
  }

  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    orderId: row.order_id,
    rating: row.rating,
    comment: row.comment,
    images,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    userName: row.user_name,
    userEmail: row.user_email,
    productName: row.product_name,
    productSlug: row.product_slug,
  };
}

export async function getApprovedProductReviews(productId: number): Promise<ProductReview[]> {
  const rows = await getApprovedReviewsByProductId(productId);
  return rows.map(mapReview);
}

export async function submitProductReview(
  userId: number,
  productId: number,
  input: {
    orderId: number;
    rating: number;
    comment: string;
    images?: string[];
  },
): Promise<ProductReview> {
  const product = await findProductById(productId);
  if (!product) throw notFound("Product not found");

  const isEligibleOrder = await hasUserDeliveredOrderForProductInOrder(userId, productId, input.orderId);
  if (!isEligibleOrder) {
    throw badRequest("Invalid order for this review.");
  }

  const existing = await findUserReviewForProductOrder(userId, productId, input.orderId);
  if (existing) {
    throw conflict("You have already submitted a review for this product.");
  }

  if (input.rating < 1 || input.rating > 5) {
    throw badRequest("Rating must be between 1 and 5.");
  }

  const row = await createReview({
    productId,
    userId,
    orderId: input.orderId,
    rating: input.rating,
    comment: input.comment,
    images: input.images,
  });

  return mapReview(row);
}

export async function getUserReviewsForOrder(userId: number, orderId: number): Promise<ProductReview[]> {
  const rows = await listUserReviewsByOrder(userId, orderId);
  return rows.map(mapReview);
}

export async function submitOrderProductReview(
  userId: number,
  orderId: number,
  input: {
    productId: number;
    rating: number;
    comment: string;
    images?: string[];
  },
): Promise<ProductReview> {
  const product = await findProductById(input.productId);
  if (!product) throw notFound("Product not found");

  const isEligibleOrder = await hasUserDeliveredOrderForProductInOrder(userId, input.productId, orderId);
  if (!isEligibleOrder) {
    throw badRequest("You can only review delivered products from this order.");
  }

  const existing = await findUserReviewForProductOrder(userId, input.productId, orderId);
  if (existing) {
    throw conflict("You have already submitted a review for this product in this order.");
  }

  if (input.rating < 1 || input.rating > 5) {
    throw badRequest("Rating must be between 1 and 5.");
  }

  const row = await createReview({
    productId: input.productId,
    userId,
    orderId,
    rating: input.rating,
    comment: input.comment,
    images: input.images,
  });

  return mapReview(row);
}

export async function getAdminReviews(filter: ListReviewsFilter): Promise<{
  items: ProductReview[];
  total: number;
}> {
  const { rows, total } = await listReviews(filter);
  return { items: rows.map(mapReview), total };
}

export async function adminUpdateReviewStatus(
  reviewId: number,
  status: ReviewStatus,
  adminNote?: string,
): Promise<ProductReview> {
  const existing = await getReviewById(reviewId);
  if (!existing) throw notFound("Review not found");

  await updateReviewStatus(reviewId, status, adminNote);
  await recomputeProductRating(existing.product_id);

  const updated = await getReviewById(reviewId);
  if (!updated) throw new Error("Failed to retrieve updated review");
  return mapReview(updated);
}

export async function adminDeleteReview(reviewId: number): Promise<void> {
  const existing = await getReviewById(reviewId);
  if (!existing) throw notFound("Review not found");

  await deleteReview(reviewId);
  await recomputeProductRating(existing.product_id);
}
