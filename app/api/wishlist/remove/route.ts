import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { wishlistItemSchema } from "@/lib/server/schemas";
import { removeFromWishlistForUser } from "@/lib/server/services/wishlist-service";

export const dynamic = "force-dynamic";

async function DELETEHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, wishlistItemSchema);

    const wishlist = await removeFromWishlistForUser({
      userId: session.userId,
      productId: body.productId,
    });

    return jsonResponse({ wishlist }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const DELETE = withRouteAudit(DELETEHandler);
