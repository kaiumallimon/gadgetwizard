import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { newsletterSubscribeSchema } from "@/lib/server/schemas";
import { subscribeNewsletter } from "@/lib/server/services/newsletter-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, newsletterSubscribeSchema);
    const result = await subscribeNewsletter({ email: body.email });

    return jsonResponse({ success: true, message: result.message }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
