import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { badRequest } from "@/lib/server/core/errors";
import { parseJsonBody } from "@/lib/server/core/validation";
import { updateAdminOrderStatus } from "@/lib/server/services/order-service";
import type { OrderStatus } from "@/lib/client/types";

export const dynamic = "force-dynamic";

const updateStatusSchema = z.object({
  status: z.enum([
    "pending_payment", "paid", "processing", "shipped",
    "delivered", "cancelled", "refunded",
  ]),
  notes: z.string().max(2000).optional(),
});

async function PUTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw badRequest("Invalid order ID");
    }

    const body = await parseJsonBody(request, updateStatusSchema);
    const order = await updateAdminOrderStatus(orderId, body.status as OrderStatus, body.notes);
    return jsonResponse({ item: order }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
