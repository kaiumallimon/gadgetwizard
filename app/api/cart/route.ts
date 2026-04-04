import type { NextRequest } from "next/server";

import { requireAuth } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getCartForUser } from "@/lib/server/services/cart-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const cart = await getCartForUser(session.userId);

    return jsonResponse({ cart }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
