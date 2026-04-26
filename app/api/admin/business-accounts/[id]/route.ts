import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminBusinessAccountReviewSchema } from "@/lib/server/schemas";
import {
  getAdminBusinessAccountById,
  reviewBusinessAccount,
} from "@/lib/server/services/business-account-service";

export const dynamic = "force-dynamic";

async function getBusinessAccountId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const businessAccountId = Number(id);
  if (!Number.isInteger(businessAccountId) || businessAccountId <= 0) {
    throw badRequest("Invalid business account id");
  }

  return businessAccountId;
}

async function GETHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const businessAccountId = await getBusinessAccountId(context);
    const item = await getAdminBusinessAccountById(businessAccountId);

    return jsonResponse({ item }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function PUTHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(request, ["admin"]);
    const businessAccountId = await getBusinessAccountId(context);
    const body = await parseJsonBody(request, adminBusinessAccountReviewSchema);

    const item = await reviewBusinessAccount({
      id: businessAccountId,
      status: body.status,
      reviewNotes: body.reviewNotes ?? null,
      reviewedByUserId: session.userId,
    });

    return jsonResponse({ item }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const PUT = withRouteAudit(PUTHandler);
