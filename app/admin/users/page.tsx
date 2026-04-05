import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminUserManager } from "@/components/admin/admin-user-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminUsers } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAdminUsers({ page: 1, pageSize: 100, role: "admin" });

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Admin Accounts</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Create admin accounts and manage their access state from one place.
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
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AdminUserManager initialUsers={result.items} />
    </div>
  );
}
