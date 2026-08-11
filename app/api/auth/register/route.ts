import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { authRegisterSchema } from "@/lib/server/schemas";
import { registerUserWithPassword } from "@/lib/server/services/auth-service";
import { rateLimit } from "@/lib/server/middleware/rate-limit";

export const dynamic = "force-dynamic";

const checkRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

async function POSTHandler(request: NextRequest) {
  try {
    const limited = checkRateLimit(request);
    if (limited) return limited;

    const body = await parseJsonBody(request, authRegisterSchema);
    const result = await registerUserWithPassword(body);

    return jsonResponse(
      {
        user: result.user,
      },
      201,
      noStoreHeaders(),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
