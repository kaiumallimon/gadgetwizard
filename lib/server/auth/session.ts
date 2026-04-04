import type { NextRequest } from "next/server";

import { getEnv } from "@/lib/server/core/env";
import type { AuthSession } from "@/lib/server/types";
import { verifyBackendJwt } from "@/lib/server/auth/jwt";

function getTokenFromAuthorizationHeader(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function getTokenFromCookieHeader(request: Request): string | null {
  const env = getEnv();
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  for (const entry of cookies) {
    if (entry.startsWith(`${env.AUTH_COOKIE_NAME}=`)) {
      return decodeURIComponent(entry.substring(env.AUTH_COOKIE_NAME.length + 1));
    }
  }

  return null;
}

export async function readSession(request: NextRequest | Request): Promise<AuthSession | null> {
  const token = getTokenFromAuthorizationHeader(request) ?? getTokenFromCookieHeader(request);
  if (!token) {
    return null;
  }

  return verifyBackendJwt(token);
}
