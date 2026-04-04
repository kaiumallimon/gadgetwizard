import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin-console";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminAnalytics } from "@/lib/server/services/admin-service";
import { getAdminBanners } from "@/lib/server/services/banner-service";
import { getAdminCategories } from "@/lib/server/services/category-service";
import { getAdminProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const [analytics, categories, products, banners] = await Promise.all([
    getAdminAnalytics(),
    getAdminCategories(),
    getAdminProducts({ page: 1, pageSize: 50 }),
    getAdminBanners(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Catalog, Banner, and Analytics Control</h1>
      </header>

      <AdminConsole
        initialAnalytics={analytics}
        initialCategories={categories}
        initialProducts={products.items}
        initialBanners={banners}
      />
    </div>
  );
}
