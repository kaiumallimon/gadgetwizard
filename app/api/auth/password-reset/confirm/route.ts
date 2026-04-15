import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { passwordResetConfirmSchema } from "@/lib/server/schemas";
import { confirmPasswordReset } from "@/lib/server/services/password-reset-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, passwordResetConfirmSchema);
    const result = await confirmPasswordReset({
      token: body.token,
      newPassword: body.newPassword,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
