import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { passwordResetRequestSchema } from "@/lib/server/schemas";
import { requestPasswordReset } from "@/lib/server/services/password-reset-service";
import { rateLimit } from "@/lib/server/middleware/rate-limit";

export const dynamic = "force-dynamic";

const checkRateLimit = rateLimit({ windowMs: 60_000, max: 3 });

async function POSTHandler(request: NextRequest) {
  try {
    const limited = checkRateLimit(request);
    if (limited) return limited;

    const body = await parseJsonBody(request, passwordResetRequestSchema);
    const result = await requestPasswordReset({
      email: body.email,
      origin: request.nextUrl.origin,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
