import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin-console";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminDashboardBundle } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { analytics, categories, products, banners } = await getAdminDashboardBundle();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Banner Management</h1>
        <p className="mt-2 text-sm text-zinc-600">Control homepage campaign banners with one responsive image source.</p>
        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Banners</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AdminConsole
        initialAnalytics={analytics}
        initialCategories={categories}
        initialProducts={products}
        initialBanners={banners}
        initialTab="banners"
        lockedTab="banners"
      />
    </div>
  );
}
