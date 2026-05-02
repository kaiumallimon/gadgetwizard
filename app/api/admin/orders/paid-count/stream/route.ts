import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { getAdminOrderStatusCount } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  await requireRole(request, ["admin"]);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const sendCount = async () => {
        try {
          const count = await getAdminOrderStatusCount("paid");
          const payload = JSON.stringify({ count });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          controller.enqueue(encoder.encode("event: error\ndata: {\"message\":\"count_failed\"}\n\n"));
        }
      };

      void sendCount();

      const interval = setInterval(sendCount, 15000);
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 20000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(keepAlive);
        controller.close();
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export const GET = withRouteAudit(GETHandler);
