import { redirect } from "next/navigation";

import { AdminOverviewDashboard } from "@/components/admin/admin-overview-dashboard";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminDashboardBundle } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { analytics, categories, products, banners } = await getAdminDashboardBundle();

  return <AdminOverviewDashboard analytics={analytics} categories={categories} products={products} banners={banners} />;
}
