import type { NextRequest } from "next/server";

import { requireAuth } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getCurrentUser } from "@/lib/server/services/auth-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const user = await getCurrentUser(session.userId);

    return jsonResponse(
      {
        session,
        user,
      },
      200,
      noStoreHeaders(),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
