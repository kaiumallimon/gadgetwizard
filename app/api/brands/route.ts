import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicBrands } from "@/lib/server/services/brand-service";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

export const dynamic = "force-dynamic";

async function GETHandler() {
  try {
    const brands = await getPublicBrands();
    return jsonResponse({ items: brands });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
