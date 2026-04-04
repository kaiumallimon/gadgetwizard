import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getCdnStats } from "@/lib/server/services/cdn-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const stats = await getCdnStats();

    return jsonResponse({ stats }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
