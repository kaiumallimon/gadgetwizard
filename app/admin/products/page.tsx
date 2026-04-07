import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductListManager } from "@/components/admin/product-list-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

const PRODUCT_BATCH_SIZE = 200;

async function getAllAdminProducts() {
  const items = [] as Awaited<ReturnType<typeof getAdminProducts>>["items"];
  let page = 1;

  while (true) {
    const batch = await getAdminProducts({ page, pageSize: PRODUCT_BATCH_SIZE });
    items.push(...batch.items);

    if (items.length >= batch.total || batch.items.length === 0) {
      break;
    }

    page += 1;
  }

  return items;
}

export default async function AdminProductsPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const products = await getAllAdminProducts();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Product Management</h1>
            <p className="mt-2 text-sm text-zinc-600">
              View, update, activate/deactivate, and delete products. Creation is handled in a dedicated add page.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Add Product</Link>
          </Button>
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
                <BreadcrumbPage>Products</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <ProductListManager initialProducts={products} />
    </div>
  );
}
