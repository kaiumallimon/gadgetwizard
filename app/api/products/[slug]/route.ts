import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";
import { badRequest } from "@/lib/server/core/errors";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function GETHandler(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug || !SLUG_PATTERN.test(slug)) {
      throw badRequest("Invalid product slug");
    }

    const product = await getPublicProductBySlug(slug);

    return jsonResponse({ item: product });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
