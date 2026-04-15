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

interface PasswordResetJwtPayload {
  sub: string;
  email: string;
  jti: string;
  purpose: "password-reset";
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

export async function issuePasswordResetJwt(input: {
  userId: number;
  email: string;
  jti: string;
  expiresInMinutes: number;
}): Promise<string> {
  const env = getEnv();
  const secret = getSecret();

  return new SignJWT({
    email: input.email,
    jti: input.jti,
    purpose: "password-reset",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(`${env.JWT_ISSUER}:password-reset`)
    .setAudience(`${env.JWT_AUDIENCE}:password-reset`)
    .setSubject(String(input.userId))
    .setIssuedAt()
    .setExpirationTime(`${input.expiresInMinutes}m`)
    .sign(secret);
}

export async function verifyPasswordResetJwt(token: string): Promise<PasswordResetJwtPayload | null> {
  try {
    const env = getEnv();
    const secret = getSecret();

    const { payload } = await jwtVerify<PasswordResetJwtPayload>(token, secret, {
      issuer: `${env.JWT_ISSUER}:password-reset`,
      audience: `${env.JWT_AUDIENCE}:password-reset`,
    });

    if (!payload.sub || !payload.email || !payload.jti || payload.purpose !== "password-reset") {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      jti: payload.jti,
      purpose: payload.purpose,
    };
  } catch {
    return null;
  }
}
