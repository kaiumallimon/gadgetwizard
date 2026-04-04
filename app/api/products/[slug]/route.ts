import type { NextRequest } from "next/server";

import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const product = await getPublicProductBySlug(slug);

    return jsonResponse({ item: product });
  } catch (error) {
    return handleRouteError(error);
  }
}
