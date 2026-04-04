import { getAnalyticsSummary, getRecentCartActivity } from "@/lib/server/repositories/analytics-repository";
import { listUsers } from "@/lib/server/repositories/user-repository";
import { getAdminBanners } from "@/lib/server/services/banner-service";
import { getAdminCategories } from "@/lib/server/services/category-service";
import { getAdminProducts } from "@/lib/server/services/product-service";
import type { UserRole } from "@/lib/server/types";

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
