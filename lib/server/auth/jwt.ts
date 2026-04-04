import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/server/core/env";
import type { AuthSession, UserRole } from "@/lib/server/types";

interface SessionJwtPayload {
  sub: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

function getSecret() {
  const env = getEnv();
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function issueBackendJwt(session: AuthSession): Promise<string> {
  const env = getEnv();
  const secret = getSecret();

  return new SignJWT({
    uid: session.firebaseUid,
    email: session.email,
    name: session.name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(String(session.userId))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + env.JWT_EXPIRES_IN_SECONDS)
    .sign(secret);
}

export async function verifyBackendJwt(token: string): Promise<AuthSession | null> {
  try {
    const env = getEnv();
    const secret = getSecret();

    const { payload } = await jwtVerify<SessionJwtPayload>(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (!payload.sub || !payload.uid || !payload.email || !payload.name || !payload.role) {
      return null;
    }

    if (payload.role !== "user" && payload.role !== "admin") {
      return null;
    }

    return {
      userId: Number(payload.sub),
      firebaseUid: payload.uid,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
