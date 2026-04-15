import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminCreateUserSchema } from "@/lib/server/schemas";
import { createAdminAccount, getAdminUsers } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const users = await getAdminUsers({
      page: 1,
      pageSize: 100,
      role: "admin",
    });

    return jsonResponse({ items: users.items, total: users.total }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminCreateUserSchema);

    const user = await createAdminAccount({
      ...body,
      origin: request.nextUrl.origin,
    });
    return jsonResponse({ item: user }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
