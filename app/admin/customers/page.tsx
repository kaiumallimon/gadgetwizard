import Link from "next/link";
import { redirect } from "next/navigation";

import { RegularUserManager } from "@/components/admin/regular-user-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getRegularUsers } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const result = await getRegularUsers({ page: 1, pageSize: 200 });

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Regular Users</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Ban or unban regular users. Banned users cannot log in until reactivated.
        </p>
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
                <BreadcrumbPage>Regular Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <RegularUserManager initialUsers={result.items} />
    </div>
  );
}
