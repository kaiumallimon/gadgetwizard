import type { NextRequest } from "next/server";

import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { parseSearchParams } from "@/lib/server/core/validation";
import { paginationQuerySchema } from "@/lib/server/schemas";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = parseSearchParams(new URL(request.url), paginationQuerySchema);

    const result = await getPublicProducts({
      page: query.page,
      pageSize: query.pageSize,
      categorySlug: query.categorySlug,
      brandSlug: query.brandSlug,
      search: query.search,
    });

    return jsonResponse({
      items: result.items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
