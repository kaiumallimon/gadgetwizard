import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireAuth } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { cartUpdateSchema } from "@/lib/server/schemas";
import { updateCartForUser } from "@/lib/server/services/cart-service";

export const dynamic = "force-dynamic";

async function PATCHHandler(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await parseJsonBody(request, cartUpdateSchema);

    const cart = await updateCartForUser({
      userId: session.userId,
      productId: body.productId,
      quantity: body.quantity,
    });

    return jsonResponse({ cart }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PATCH = withRouteAudit(PATCHHandler);
