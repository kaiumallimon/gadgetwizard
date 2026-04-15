import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandEditForm } from "@/components/admin/brand-edit-form";
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
import { badRequest } from "@/lib/server/core/errors";
import { getAdminBrandById } from "@/lib/server/services/brand-service";

export const dynamic = "force-dynamic";

export default async function AdminEditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId) || brandId <= 0) {
    throw badRequest("Invalid brand id");
  }

  const brand = await getAdminBrandById(brandId);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Edit Brand</h1>
            <p className="mt-2 text-sm text-zinc-600">Update brand settings from this dedicated edit page.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/brands">Back To Brands</Link>
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
                  <Link href="/admin/brands">Brands</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Brand</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <BrandEditForm initialBrand={brand} />
    </div>
  );
}
