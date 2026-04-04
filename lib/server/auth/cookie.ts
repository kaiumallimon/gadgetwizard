import { getEnv } from "@/lib/server/core/env";

export function buildSessionCookie(token: string): string {
  const env = getEnv();
  const maxAge = env.JWT_EXPIRES_IN_SECONDS;
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";

  return `${env.AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function buildClearSessionCookie(): string {
  const env = getEnv();
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";

  return `${env.AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
