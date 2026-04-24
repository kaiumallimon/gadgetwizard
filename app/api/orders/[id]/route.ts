import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { badRequest } from "@/lib/server/core/errors";
import { getOrderForUser } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw badRequest("Invalid order ID");
    }

    const order = await getOrderForUser(orderId, session.userId);
    return jsonResponse({ item: order }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
