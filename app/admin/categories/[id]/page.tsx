import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CategoryEditForm } from "@/components/admin/category-edit-form";
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
import { getAdminCategories } from "@/lib/server/services/category-service";

export const dynamic = "force-dynamic";

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    notFound();
  }

  const categories = await getAdminCategories();
  const category = categories.find((entry) => entry.id === categoryId);
  if (!category) {
    notFound();
  }

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Edit Category</h1>
            <p className="mt-2 text-sm text-zinc-600">Update category details and replace image from this dedicated edit page.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/categories">Back To Categories</Link>
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
                <BreadcrumbLink asChild>
                  <Link href="/admin/categories">Categories</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Category</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <CategoryEditForm initialCategory={category} categories={categories} />
    </div>
  );
}
