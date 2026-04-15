import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody, parseSearchParams } from "@/lib/server/core/validation";
import { adminProductSchema, paginationQuerySchema } from "@/lib/server/schemas";
import { createProductAdmin, getAdminProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const query = parseSearchParams(new URL(request.url), paginationQuerySchema);

    const result = await getAdminProducts({
      page: query.page,
      pageSize: query.pageSize,
      categorySlug: query.categorySlug,
      brandSlug: query.brandSlug,
      search: query.search,
    });

    return jsonResponse(
      {
        items: result.items,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / query.pageSize),
        },
      },
      200,
      noStoreHeaders(),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminProductSchema);

    const product = await createProductAdmin(body);
    return jsonResponse({ item: product }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
