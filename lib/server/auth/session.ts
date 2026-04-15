import type { NextRequest } from "next/server";

import type { AuthSession } from "@/lib/server/types";
import { auth } from "@/lib/server/auth/next-auth";
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

export async function readSession(request: NextRequest | Request): Promise<AuthSession | null> {
  const bearerToken = getTokenFromAuthorizationHeader(request);
  if (bearerToken) {
    const legacySession = await verifyBackendJwt(bearerToken);
    if (legacySession) {
      return legacySession;
    }
  }

  const session = await auth();
  if (!session?.user?.email || !session.user.name || !session.user.id || !session.user.role) {
    return null;
  }

  return {
    userId: session.user.id,
    authUid: session.user.authUid,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}
