import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getAdminOrderStatusCount } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const count = await getAdminOrderStatusCount("paid");

    return jsonResponse({ count }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
