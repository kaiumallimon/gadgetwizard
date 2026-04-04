import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { badRequest } from "@/lib/server/core/errors";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminCategories } from "@/lib/server/services/category-service";
import { getAdminProductById } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw badRequest("Invalid product id");
  }

  const [categories, product] = await Promise.all([getAdminCategories(), getAdminProductById(productId)]);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Routes</p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Edit Product</h1>
            <p className="mt-2 text-sm text-zinc-600">Update content, specifications, pricing, and activation state.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products">Back To Products</Link>
          </Button>
        </div>
      </header>

      <ProductForm mode="edit" categories={categories} initialProduct={product} />
    </div>
  );
}
