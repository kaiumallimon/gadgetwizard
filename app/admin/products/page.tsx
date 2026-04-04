import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin-console";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminDashboardBundle } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { analytics, categories, products, banners } = await getAdminDashboardBundle();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Routes</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Product Management</h1>
        <p className="mt-2 text-sm text-zinc-600">Add new products and perform update, activation, and delete operations.</p>
      </header>

      <AdminConsole
        initialAnalytics={analytics}
        initialCategories={categories}
        initialProducts={products}
        initialBanners={banners}
        initialTab="products"
        lockedTab="products"
      />
    </div>
  );
}
