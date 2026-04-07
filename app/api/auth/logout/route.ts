import { buildClearSessionCookie } from "@/lib/server/auth/cookie";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

export const dynamic = "force-dynamic";

async function POSTHandler() {
  try {
    return jsonResponse(
      {
        success: true,
      },
      200,
      {
        ...noStoreHeaders(),
        "Set-Cookie": buildClearSessionCookie(),
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
