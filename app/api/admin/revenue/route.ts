import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getAdminRevenueSnapshot } from "@/lib/server/services/revenue-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";

    const snapshot = await getAdminRevenueSnapshot({ range });

    return jsonResponse({ snapshot }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
