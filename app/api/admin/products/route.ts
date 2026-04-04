import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminProductSchema } from "@/lib/server/schemas";
import { createProductAdmin } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminProductSchema);

    const product = await createProductAdmin(body);
    return jsonResponse({ item: product }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
