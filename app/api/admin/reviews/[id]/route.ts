import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { badRequest } from "@/lib/server/core/errors";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminUpdateReviewStatus } from "@/lib/server/services/review-service";

export const dynamic = "force-dynamic";

const updateReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().max(1000).optional(),
});

async function PUTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const reviewId = Number(id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      throw badRequest("Invalid review ID");
    }

    const body = await parseJsonBody(request, updateReviewSchema);
    const review = await adminUpdateReviewStatus(reviewId, body.status, body.adminNote);
    return jsonResponse({ item: review }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
