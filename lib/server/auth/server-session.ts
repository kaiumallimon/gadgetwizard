import { cookies } from "next/headers";

import { forbidden, unauthorized } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";
import { verifyBackendJwt } from "@/lib/server/auth/jwt";
import type { AuthSession, UserRole } from "@/lib/server/types";

export async function getServerSession(): Promise<AuthSession | null> {
  const env = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyBackendJwt(token);
}

export async function requireServerSession(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    throw unauthorized();
  }

  return session;
}

export async function requireServerRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireServerSession();
  if (!allowedRoles.includes(session.role)) {
    throw forbidden();
  }

  return session;
}
