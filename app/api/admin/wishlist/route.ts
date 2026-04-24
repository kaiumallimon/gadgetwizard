import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseSearchParams } from "@/lib/server/core/validation";
import { adminWishlistQuerySchema } from "@/lib/server/schemas";
import { getAdminWishlist } from "@/lib/server/services/wishlist-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const query = parseSearchParams(new URL(request.url), adminWishlistQuerySchema);

    const result = await getAdminWishlist({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    return jsonResponse({
      items: result.items,
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(result.total / query.pageSize),
    }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
