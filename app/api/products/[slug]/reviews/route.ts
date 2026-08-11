import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getApprovedProductReviews } from "@/lib/server/services/review-service";
import { findProductBySlug } from "@/lib/server/repositories/product-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function GETHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || !SLUG_PATTERN.test(slug)) {
      throw badRequest("Invalid product slug");
    }

    const product = await findProductBySlug(slug, true);
    if (!product) throw notFound("Product not found");

    const reviews = await getApprovedProductReviews(product.id);
    return jsonResponse({ items: reviews });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
