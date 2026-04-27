import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireAuth, requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody, parseSearchParams } from "@/lib/server/core/validation";
import {
  chatConversationsQuerySchema,
  createChatConversationSchema,
} from "@/lib/server/schemas";
import {
  getChatConversationsForSession,
  startChatConversationForUser,
} from "@/lib/server/services/chat-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const query = parseSearchParams(new URL(request.url), chatConversationsQuerySchema);

    const result = await getChatConversationsForSession(session, {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, createChatConversationSchema);

    const conversation = await startChatConversationForUser(session, {
      sourceType: body.sourceType,
      sourceRef: body.sourceRef ?? null,
      initialMessage: body.initialMessage,
    });

    return jsonResponse({ item: conversation }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);