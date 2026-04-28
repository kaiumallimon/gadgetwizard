import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { checkoutValidateReservationSchema } from "@/lib/server/schemas";
import { validateCheckoutReservation } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, checkoutValidateReservationSchema);

    await validateCheckoutReservation(session.userId, { selectedProductIds: body.selectedProductIds });

    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
