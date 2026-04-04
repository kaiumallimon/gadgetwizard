import type { NextRequest } from "next/server";

import { buildSessionCookie } from "@/lib/server/auth/cookie";
import { getEnv } from "@/lib/server/core/env";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { authExchangeSchema } from "@/lib/server/schemas";
import { exchangeFirebaseToken } from "@/lib/server/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, authExchangeSchema);
    const sessionData = await exchangeFirebaseToken(body.idToken);
    const env = getEnv();

    return jsonResponse(
      {
        token: sessionData.token,
        expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        session: sessionData.session,
        user: sessionData.user,
      },
      200,
      {
        ...noStoreHeaders(),
        "Set-Cookie": buildSessionCookie(sessionData.token),
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
