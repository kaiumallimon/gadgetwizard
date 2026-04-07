import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicCategoryTree } from "@/lib/server/services/category-service";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

export const dynamic = "force-dynamic";

async function GETHandler() {
  try {
    const categories = await getPublicCategoryTree();
    return jsonResponse({ items: categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
