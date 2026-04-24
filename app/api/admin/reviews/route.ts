import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseSearchParams } from "@/lib/server/core/validation";
import { getAdminReviews } from "@/lib/server/services/review-service";
import type { ReviewStatus } from "@/lib/client/types";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const query = parseSearchParams(new URL(request.url), querySchema);

    const result = await getAdminReviews({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status as ReviewStatus | undefined,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
