import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminCategorySchema } from "@/lib/server/schemas";
import { createCategoryAdmin, getAdminCategories } from "@/lib/server/services/category-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const categories = await getAdminCategories();

    return jsonResponse({ items: categories }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminCategorySchema);

    const category = await createCategoryAdmin(body);
    return jsonResponse({ item: category }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
