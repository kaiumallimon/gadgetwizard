import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandCreateForm } from "@/components/admin/brand-create-form";
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
import { getAdminBrands } from "@/lib/server/services/brand-service";

export const dynamic = "force-dynamic";

export default async function AdminAddBrandPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const brands = await getAdminBrands();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Add Brand</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Create brand records with logo/image and visibility settings.
            </p>
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
                <BreadcrumbPage>Add Brand</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <BrandCreateForm brands={brands} />
    </div>
  );
}
