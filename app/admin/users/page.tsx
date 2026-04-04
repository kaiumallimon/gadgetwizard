import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminUsers } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const result = await getAdminUsers({ page: 1, pageSize: 100 });

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Users View</h1>
        <p className="mt-2 text-sm text-zinc-600">Monitor registered users, role assignments, and account status.</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Users: {result.total}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.items.length === 0 && <p className="text-sm text-zinc-500">No users found.</p>}

          {result.items.map((user) => (
            <article key={user.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-zinc-900">{user.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                  <Badge variant={user.isActive ? "secondary" : "outline"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Reward Points: {user.rewardPoints} | Joined: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
