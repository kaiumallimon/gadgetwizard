import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getCartForUser } from "@/lib/server/services/cart-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const cart = await getCartForUser(session.userId);

    return jsonResponse({ cart }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
