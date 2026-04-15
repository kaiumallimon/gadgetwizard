import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminBrandSchema } from "@/lib/server/schemas";
import { deleteBrandAdmin, updateBrandAdmin } from "@/lib/server/services/brand-service";

export const dynamic = "force-dynamic";

function parseBrandId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("Invalid brand id");
  }

  return id;
}

async function PUTHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, ["admin"]);
    const { id: rawId } = await context.params;
    const id = parseBrandId(rawId);
    const body = await parseJsonBody(request, adminBrandSchema);

    const brand = await updateBrandAdmin(id, body);
    return jsonResponse({ item: brand }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function DELETEHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, ["admin"]);
    const { id: rawId } = await context.params;
    const id = parseBrandId(rawId);

    await deleteBrandAdmin(id);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
export const DELETE = withRouteAudit(DELETEHandler);
