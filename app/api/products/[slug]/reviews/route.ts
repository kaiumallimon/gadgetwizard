import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getApprovedProductReviews } from "@/lib/server/services/review-service";
import { findProductBySlug } from "@/lib/server/repositories/product-repository";
import { notFound } from "@/lib/server/core/errors";

export const dynamic = "force-dynamic";

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

export const GET = withRouteAudit(GETHandler);
