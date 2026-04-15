import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminUserStatusSchema } from "@/lib/server/schemas";
import { updateRegularUserStatus } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

async function getUserId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw badRequest("Invalid user id");
  }

  return userId;
}

async function PUTHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const targetUserId = await getUserId(context);
    const body = await parseJsonBody(request, adminUserStatusSchema);

    const user = await updateRegularUserStatus({
      targetUserId,
      isActive: body.isActive,
    });

    return jsonResponse({ item: user }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
