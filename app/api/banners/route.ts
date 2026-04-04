import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicBanners } from "@/lib/server/services/banner-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = await getPublicBanners();
    return jsonResponse({ items: banners });
  } catch (error) {
    return handleRouteError(error);
  }
}
