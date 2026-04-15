import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { authRegisterSchema } from "@/lib/server/schemas";
import { registerUserWithPassword } from "@/lib/server/services/auth-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
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
