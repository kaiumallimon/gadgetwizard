import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { submitOrderProductReview } from "@/lib/server/services/review-service";

export const dynamic = "force-dynamic";

const submitOrderReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(5000),
  images: z.array(z.string().url()).max(5).optional(),
});

async function POSTHandler(
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

    const body = await parseJsonBody(request, submitOrderReviewSchema);
    const item = await submitOrderProductReview(session.userId, orderId, body);

    return jsonResponse({ item }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
