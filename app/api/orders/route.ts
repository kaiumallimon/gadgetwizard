import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { createOrderSchema } from "@/lib/server/schemas";
import { createOrderAfterPayment, getUserOrders } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const orders = await getUserOrders(session.userId);
    return jsonResponse({ items: orders }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, createOrderSchema);

    const order = await createOrderAfterPayment({
      userId: session.userId,
      paymentIntentId: body.paymentIntentId,
      purchaseMode: body.purchaseMode,
      addressInput: {
        addressId: body.addressId,
        newAddress: body.newAddress,
      },
    });

    return jsonResponse({ order }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
