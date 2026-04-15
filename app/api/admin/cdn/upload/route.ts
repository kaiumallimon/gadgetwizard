import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { uploadImageToCdn } from "@/lib/server/services/cdn-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const formData = await request.formData();
    const maybeFile = formData.get("file");

    if (!(maybeFile instanceof File)) {
      throw badRequest("File is required");
    }

    const item = await uploadImageToCdn(maybeFile);

    return jsonResponse({ item }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
