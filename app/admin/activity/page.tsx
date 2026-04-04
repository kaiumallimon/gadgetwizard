import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminActivityFeed, getAdminAnalytics } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const [analytics, activity] = await Promise.all([getAdminAnalytics(), getAdminActivityFeed(60)]);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Routes</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Activity Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">Track cart interaction patterns and monitor recent activity logs.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{analytics.totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{analytics.totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Logged Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">
            {analytics.cartActivity.reduce((sum, item) => sum + item.total, 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feed Rows</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{activity.length}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Cart Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.length === 0 && <p className="text-sm text-zinc-500">No cart activity logs found.</p>}

          {activity.map((row) => (
            <article key={row.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{row.action}</Badge>
                  <p className="text-sm font-medium text-zinc-800">{row.productName ?? "Unknown product"}</p>
                </div>
                <p className="text-xs text-zinc-500">{new Date(row.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-1 text-sm text-zinc-600">User: {row.userName ?? "Unknown"} ({row.userEmail ?? "No email"})</p>
              <p className="mt-1 text-xs text-zinc-500">
                Quantity: {row.quantityBefore ?? 0} -> {row.quantityAfter ?? 0}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
