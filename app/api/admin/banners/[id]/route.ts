import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminBannerSchema } from "@/lib/server/schemas";
import { deleteBannerAdmin, updateBannerAdmin } from "@/lib/server/services/banner-service";

export const dynamic = "force-dynamic";

async function getBannerId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const bannerId = Number(id);
  if (!Number.isInteger(bannerId) || bannerId <= 0) {
    throw badRequest("Invalid banner id");
  }

  return bannerId;
}

async function PUTHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const bannerId = await getBannerId(context);
    const body = await parseJsonBody(request, adminBannerSchema);

    const banner = await updateBannerAdmin(bannerId, body);
    return jsonResponse({ item: banner }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function DELETEHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const bannerId = await getBannerId(context);

    await deleteBannerAdmin(bannerId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
export const DELETE = withRouteAudit(DELETEHandler);
