import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseSearchParams } from "@/lib/server/core/validation";
import { adminBusinessAccountQuerySchema } from "@/lib/server/schemas";
import { getAdminBusinessAccounts } from "@/lib/server/services/business-account-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const query = parseSearchParams(new URL(request.url), adminBusinessAccountQuerySchema);

    const result = await getAdminBusinessAccounts({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      search: query.search,
    });

    return jsonResponse(
      {
        items: result.items,
        total: result.total,
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

export const GET = withRouteAudit(GETHandler);
