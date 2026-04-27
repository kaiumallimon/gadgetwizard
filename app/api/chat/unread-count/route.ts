import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireAuth } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getChatUnreadMessageCountForSession } from "@/lib/server/services/chat-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const count = await getChatUnreadMessageCountForSession(session);

    return jsonResponse({ count }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);