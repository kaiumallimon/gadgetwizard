import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { checkoutCreatePaymentIntentSchema } from "@/lib/server/schemas";
import { createPaymentIntent } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    // Only users (not admins) can checkout
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, checkoutCreatePaymentIntentSchema);

    const result = await createPaymentIntent(session.userId, {
      purchaseMode: body.purchaseMode,
      addressId: body.addressId,
      newAddress: body.newAddress,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
