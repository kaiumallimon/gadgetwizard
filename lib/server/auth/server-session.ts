import { forbidden, unauthorized } from "@/lib/server/core/errors";
import { auth } from "@/lib/server/auth/next-auth";
import type { AuthSession, UserRole } from "@/lib/server/types";

export async function getServerSession(): Promise<AuthSession | null> {
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
