import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminBrandSchema } from "@/lib/server/schemas";
import { createBrandAdmin, getAdminBrands } from "@/lib/server/services/brand-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const brands = await getAdminBrands();

    return jsonResponse({ items: brands }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminBrandSchema);

    const brand = await createBrandAdmin(body);
    return jsonResponse({ item: brand }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
