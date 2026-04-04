import type { NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/server/core/errors";
import type { AuthSession, UserRole } from "@/lib/server/types";
import { readSession } from "@/lib/server/auth/session";

export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  const session = await readSession(request);
  if (!session) {
    throw unauthorized();
  }

  return session;
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth(request);
  if (!allowedRoles.includes(session.role)) {
    throw forbidden();
  }

  return session;
}
