import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { wishlistItemSchema } from "@/lib/server/schemas";
import { addToWishlistForUser, getWishlistForUser } from "@/lib/server/services/wishlist-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const wishlist = await getWishlistForUser(session.userId);
    return jsonResponse({ wishlist }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, wishlistItemSchema);

    const wishlist = await addToWishlistForUser({
      userId: session.userId,
      productId: body.productId,
    });

    return jsonResponse({ wishlist }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
