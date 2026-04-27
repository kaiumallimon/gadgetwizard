import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireAuth } from "@/lib/server/auth/guards";
import { createChatEventStream } from "@/lib/server/realtime/chat-realtime";
import { handleRouteError } from "@/lib/server/core/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const stream = createChatEventStream(session);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);