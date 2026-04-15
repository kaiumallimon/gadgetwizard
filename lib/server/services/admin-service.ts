import { randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { badRequest, conflict, HttpError, notFound } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";
import { renderAdminWelcomeEmail } from "@/lib/server/mail/templates";
import { assertSmtpConfigured, sendSmtpMail } from "@/lib/server/mail/smtp";
import {
  getAnalyticsSummary,
} from "@/lib/server/repositories/analytics-repository";
import {
  getSystemActivityPage,
  getSystemActivitySummary,
  type CrudAction,
} from "@/lib/server/repositories/system-activity-repository";
import {
  countActiveAdmins,
  createAdminUser,
  findUserByEmail,
  findUserById,
  listUsers,
  removeUserById,
  updateUserActiveStatus,
} from "@/lib/server/repositories/user-repository";
import { getAdminBanners } from "@/lib/server/services/banner-service";
import { getAdminCategories } from "@/lib/server/services/category-service";
import { getAdminProducts } from "@/lib/server/services/product-service";
import type { AppUser, UserRole } from "@/lib/server/types";

const PASSWORD_UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_LOWERCASE = "abcdefghijkmnpqrstuvwxyz";
const PASSWORD_NUMBERS = "23456789";
const PASSWORD_SYMBOLS = "!@#$%^&*";
const PASSWORD_POOL = `${PASSWORD_UPPERCASE}${PASSWORD_LOWERCASE}${PASSWORD_NUMBERS}${PASSWORD_SYMBOLS}`;

function pickRandom(chars: string): string {
  return chars[randomInt(0, chars.length)];
}

function shuffleChars(input: string[]): string[] {
  const output = [...input];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    const current = output[index];
    output[index] = output[swapIndex];
    output[swapIndex] = current;
  }

  return output;
}

function generateTemporaryPassword(length = 14): string {
  const chars: string[] = [
    pickRandom(PASSWORD_UPPERCASE),
    pickRandom(PASSWORD_LOWERCASE),
    pickRandom(PASSWORD_NUMBERS),
    pickRandom(PASSWORD_SYMBOLS),
  ];

  while (chars.length < length) {
    chars.push(pickRandom(PASSWORD_POOL));
  }

  return shuffleChars(chars).join("");
}

function resolveBaseUrl(origin: string): string {
  const env = getEnv();
  const raw = env.APP_BASE_URL ?? origin;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function getAdminAnalytics() {
  return getAnalyticsSummary();
}

export async function getAdminDashboardBundle() {
  const [analytics, categories, products, banners] = await Promise.all([
    getAdminAnalytics(),
    getAdminCategories(),
    getAdminProducts({ page: 1, pageSize: 50 }),
    getAdminBanners(),
  ]);

  return {
    analytics,
    categories,
    products: products.items,
    banners,
  };
}

export async function getAdminUsers(input: {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
}) {
  return listUsers(input);
}

export async function getRegularUsers(input: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return listUsers({
    ...input,
    role: "user",
  });
}

export async function getAdminActivityFeedPage(input: {
  page: number;
  pageSize: number;
  action?: CrudAction;
}) {
  return getSystemActivityPage(input);
}

export async function getAdminActivitySummary() {
  return getSystemActivitySummary();
}

export async function createAdminAccount(input: {
  email: string;
  name: string;
  origin: string;
}): Promise<AppUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name.trim();

  assertSmtpConfigured();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  let createdUser: AppUser | null = null;

  try {
    createdUser = await createAdminUser({
      authUid: randomUUID(),
      email: normalizedEmail,
      name: normalizedName,
      passwordHash,
    });

    const loginUrl = `${resolveBaseUrl(input.origin)}/login`;
    await sendSmtpMail({
      to: normalizedEmail,
      subject: "Your GadgetWizard Admin Account",
      html: renderAdminWelcomeEmail({
        name: normalizedName,
        email: normalizedEmail,
        password: temporaryPassword,
        loginUrl,
      }),
      text: `Hello ${normalizedName},\n\nYour GadgetWizard admin account has been created.\n\nEmail: ${normalizedEmail}\nTemporary password: ${temporaryPassword}\nLogin: ${loginUrl}\n\nPlease reset your password after first login.`,
    });

    return createdUser;
  } catch (error) {
    if (createdUser) {
      try {
        await removeUserById(createdUser.id);
      } catch {
        // Best-effort rollback if DB cleanup fails.
      }
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new Error("Unable to send admin credentials email. Account creation was rolled back.");
  }
}

export async function updateAdminAccountStatus(input: {
  actorUserId: number;
  targetUserId: number;
  isActive: boolean;
}): Promise<AppUser> {
  const target = await findUserById(input.targetUserId);
  if (!target) {
    throw notFound("Admin account not found");
  }

  if (target.role !== "admin") {
    throw badRequest("Only admin accounts can be managed from this page");
  }

  if (!input.isActive && target.id === input.actorUserId) {
    throw badRequest("You cannot deactivate your own admin account");
  }

  if (!input.isActive && target.isActive) {
    const activeAdminCount = await countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw conflict("At least one active admin account is required");
    }
  }

  const updated = await updateUserActiveStatus(target.id, input.isActive);
  if (!updated) {
    throw notFound("Admin account not found");
  }

  return updated;
}

export async function deleteAdminAccount(input: {
  actorUserId: number;
  targetUserId: number;
}): Promise<void> {
  const target = await findUserById(input.targetUserId);
  if (!target) {
    throw notFound("Admin account not found");
  }

  if (target.role !== "admin") {
    throw badRequest("Only admin accounts can be managed from this page");
  }

  if (target.id === input.actorUserId) {
    throw badRequest("You cannot delete your own admin account");
  }

  if (target.isActive) {
    const activeAdminCount = await countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw conflict("At least one active admin account is required");
    }
  }

  const removed = await removeUserById(target.id);
  if (!removed) {
    throw notFound("Admin account not found");
  }
}

export async function updateRegularUserStatus(input: {
  targetUserId: number;
  isActive: boolean;
}): Promise<AppUser> {
  const target = await findUserById(input.targetUserId);
  if (!target) {
    throw notFound("User account not found");
  }

  if (target.role !== "user") {
    throw badRequest("Only regular user accounts can be managed from this page");
  }

  const updated = await updateUserActiveStatus(target.id, input.isActive);
  if (!updated) {
    throw notFound("User account not found");
  }

  return updated;
}
