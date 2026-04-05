import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { getRegularUsers } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const users = await getRegularUsers({
      page: 1,
      pageSize: 200,
    });

    return jsonResponse({ items: users.items, total: users.total }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
