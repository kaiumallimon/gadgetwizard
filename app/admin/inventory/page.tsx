import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminInventoryManager } from "@/components/admin/admin-inventory-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const products = await getAdminProducts({ page: 1, pageSize: 200 });

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Inventory Management</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Manage stock levels with quick increase, decrease, set, and clear operations.
            </p>
          </div>
        </div>

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
                <BreadcrumbPage>Inventory</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AdminInventoryManager initialProducts={products.items} />
    </div>
  );
}
