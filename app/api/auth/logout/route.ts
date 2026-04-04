import { buildClearSessionCookie } from "@/lib/server/auth/cookie";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";

export const dynamic = "force-dynamic";

export async function POST() {
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
