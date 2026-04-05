import { randomUUID } from "node:crypto";

import { badRequest, conflict, notFound } from "@/lib/server/core/errors";
import {
  getAnalyticsSummary,
  getRecentCartActivity,
  getRecentCartActivityPage,
} from "@/lib/server/repositories/analytics-repository";
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

export async function getAdminActivityFeed(limit = 30) {
  return getRecentCartActivity(limit);
}

export async function getAdminActivityFeedPage(input: { page: number; pageSize: number }) {
  return getRecentCartActivityPage(input);
}

export async function createAdminAccount(input: { email: string; name: string }): Promise<AppUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedName = input.name.trim();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  return createAdminUser({
    firebaseUid: `admin:${randomUUID()}`,
    email: normalizedEmail,
    name: normalizedName,
  });
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
