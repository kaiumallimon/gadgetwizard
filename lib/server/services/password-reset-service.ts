import { createHash, randomUUID } from "node:crypto";

import { verifyPasswordResetJwt, issuePasswordResetJwt } from "@/lib/server/auth/jwt";
import { updateFirebaseUserPassword } from "@/lib/server/auth/firebase-admin";
import { badRequest } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";
import { renderPasswordResetEmail } from "@/lib/server/mail/templates";
import { assertSmtpConfigured, sendSmtpMail } from "@/lib/server/mail/smtp";
import {
  createPasswordResetTokenRecord,
  findValidPasswordResetTokenByHash,
  invalidatePasswordResetTokensForUser,
  markPasswordResetTokenUsed,
} from "@/lib/server/repositories/password-reset-repository";
import { findUserByEmail, findUserById } from "@/lib/server/repositories/user-repository";

const GENERIC_RESET_MESSAGE = "If an active account exists for this email, a password reset link has been sent.";

function hashJti(jti: string): string {
  return createHash("sha256").update(jti).digest("hex");
}

function resolveBaseUrl(origin: string): string {
  const env = getEnv();
  const base = env.APP_BASE_URL ?? origin;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function validateResetToken(token: string) {
  const payload = await verifyPasswordResetJwt(token);
  if (!payload) {
    throw badRequest("Invalid or expired password reset token");
  }

  const jtiHash = hashJti(payload.jti);
  const tokenRecord = await findValidPasswordResetTokenByHash(jtiHash);
  if (!tokenRecord) {
    throw badRequest("Invalid or expired password reset token");
  }

  if (String(tokenRecord.userId) !== payload.sub || tokenRecord.email.toLowerCase() !== payload.email.toLowerCase()) {
    throw badRequest("Invalid or expired password reset token");
  }

  return tokenRecord;
}

export async function requestPasswordReset(input: { email: string; origin: string }) {
  assertSmtpConfigured();

  const env = getEnv();
  const email = input.email.trim().toLowerCase();
  const user = await findUserByEmail(email);

  if (!user || !user.isActive) {
    return { success: true, message: GENERIC_RESET_MESSAGE };
  }

  await invalidatePasswordResetTokensForUser(user.id);

  const jti = randomUUID();
  const expiresInMinutes = env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES;
  const token = await issuePasswordResetJwt({
    userId: user.id,
    email: user.email,
    jti,
    expiresInMinutes,
  });

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await createPasswordResetTokenRecord({
    userId: user.id,
    email: user.email,
    jtiHash: hashJti(jti),
    expiresAt,
  });

  const resetUrl = `${resolveBaseUrl(input.origin)}/reset-password?token=${encodeURIComponent(token)}`;

  await sendSmtpMail({
    to: user.email,
    subject: "GadgetWizard Password Reset",
    html: renderPasswordResetEmail({
      name: user.name,
      resetUrl,
      expiresInMinutes,
    }),
    text: `Hello ${user.name},\n\nReset your GadgetWizard password here: ${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes and can only be used once.`,
  });

  return { success: true, message: GENERIC_RESET_MESSAGE };
}

export async function verifyPasswordResetToken(token: string) {
  const tokenRecord = await validateResetToken(token);
  return {
    valid: true,
    email: tokenRecord.email,
    expiresAt: tokenRecord.expiresAt,
  };
}

export async function confirmPasswordReset(input: { token: string; newPassword: string }) {
  const tokenRecord = await validateResetToken(input.token);
  const user = await findUserById(tokenRecord.userId);

  if (!user || !user.isActive) {
    throw badRequest("Account is unavailable for password reset");
  }

  await updateFirebaseUserPassword(user.firebaseUid, input.newPassword);
  await markPasswordResetTokenUsed(tokenRecord.id);
  await invalidatePasswordResetTokensForUser(user.id);

  return {
    success: true,
  };
}
