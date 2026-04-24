import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { getApprovedProductReviews, submitProductReview } from "@/lib/server/services/review-service";
import { findProductBySlug } from "@/lib/server/repositories/product-repository";
import { notFound } from "@/lib/server/core/errors";

export const dynamic = "force-dynamic";

const submitReviewSchema = z.object({
  orderId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(5000),
  images: z.array(z.string().url()).max(5).optional(),
});

async function GETHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const product = await findProductBySlug(slug, true);
    if (!product) throw notFound("Product not found");

    const reviews = await getApprovedProductReviews(product.id);
    return jsonResponse({ items: reviews });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { slug } = await params;

    const product = await findProductBySlug(slug, true);
    if (!product) throw notFound("Product not found");

    const body = await parseJsonBody(request, submitReviewSchema);
    const review = await submitProductReview(session.userId, product.id, body);
    return jsonResponse({ item: review }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
