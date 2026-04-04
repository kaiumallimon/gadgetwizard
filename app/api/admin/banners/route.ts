import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminBannerSchema } from "@/lib/server/schemas";
import { createBannerAdmin, getAdminBanners } from "@/lib/server/services/banner-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const banners = await getAdminBanners();
    return jsonResponse({ items: banners }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminBannerSchema);

    const banner = await createBannerAdmin(body);
    return jsonResponse({ item: banner }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
