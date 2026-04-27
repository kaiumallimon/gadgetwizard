import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireAuth } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody, parseSearchParams } from "@/lib/server/core/validation";
import { chatMessagesQuerySchema, sendChatMessageSchema } from "@/lib/server/schemas";
import { getChatMessagesForSession, sendChatMessageForSession } from "@/lib/server/services/chat-service";

export const dynamic = "force-dynamic";

function parseConversationId(rawId: string): number {
  const value = Number(rawId);
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest("Invalid conversation ID");
  }

  return value;
}

async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseConversationId(id);
    const query = parseSearchParams(new URL(request.url), chatMessagesQuerySchema);

    const result = await getChatMessagesForSession(session, {
      conversationId,
      page: query.page,
      pageSize: query.pageSize,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseConversationId(id);
    const body = await parseJsonBody(request, sendChatMessageSchema);

    const message = await sendChatMessageForSession(session, conversationId, body.body);
    return jsonResponse({ item: message }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);