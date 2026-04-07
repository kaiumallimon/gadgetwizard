import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicBanners } from "@/lib/server/services/banner-service";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

export const dynamic = "force-dynamic";

async function GETHandler() {
  try {
    const banners = await getPublicBanners();
    return jsonResponse({ items: banners });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
