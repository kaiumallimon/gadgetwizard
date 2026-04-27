import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireAuth } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { markChatConversationReadForSession } from "@/lib/server/services/chat-service";

export const dynamic = "force-dynamic";

function parseConversationId(rawId: string): number {
  const value = Number(rawId);
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest("Invalid conversation ID");
  }

  return value;
}

async function POSTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseConversationId(id);

    await markChatConversationReadForSession(session, conversationId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);