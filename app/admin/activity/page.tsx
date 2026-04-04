import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Clock3, UserRound } from "lucide-react";

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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminActivityFeedPage, getAdminAnalytics } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function parsePage(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, Math.floor(parsed));
}

function buildPageHref(page: number): string {
  return `/admin/activity?page=${page}`;
}

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function eventLabel(action: "add" | "update" | "remove"): string {
  if (action === "add") return "cart.add";
  if (action === "update") return "cart.update";
  return "cart.remove";
}

function actionVariant(action: "add" | "update" | "remove"): "default" | "secondary" | "outline" {
  if (action === "add") return "default";
  if (action === "update") return "secondary";
  return "outline";
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parsePage(params.page);

  const [analytics, result] = await Promise.all([
    getAdminAnalytics(),
    getAdminActivityFeedPage({ page, pageSize: PAGE_SIZE }),
  ]);

  const visibleActorCount = new Set(result.items.map((row) => row.userEmail ?? `unknown-${row.id}`)).size;
  const pages = pageWindow(result.page, result.totalPages);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">System Monitoring</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Activity Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Audit who is doing what across cart events, with time-stamped actor and action tracking.
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
                <BreadcrumbPage>System Monitoring</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Total Logged Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{result.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4" /> Current Page
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">
            {result.page}/{result.totalPages}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" /> Actors On Page
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{visibleActorCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cart Action Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">
            {analytics.cartActivity.reduce((sum, item) => sum + item.total, 0)}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who Did What</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 && <p className="text-sm text-zinc-500">No activity logs found.</p>}

          {result.items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-zinc-50">
                  <tr className="text-left text-zinc-600">
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Change</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-200 text-zinc-800">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.userName ?? "Unknown user"}</p>
                        <p className="text-xs text-zinc-500">{row.userEmail ?? "No email"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(row.action)}>{eventLabel(row.action)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.productName ?? "Unknown product"}</p>
                        <p className="text-xs text-zinc-500">Product ID: {row.productId ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {row.quantityBefore ?? 0} {"->"} {row.quantityAfter ?? 0}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{new Date(row.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={result.page > 1 ? buildPageHref(result.page - 1) : "#"}
                    className={result.page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink href={buildPageHref(1)}>1</PaginationLink>
                    </PaginationItem>
                    {pages[0] > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {pages.map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink href={buildPageHref(pageNumber)} isActive={pageNumber === result.page}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pages[pages.length - 1] !== result.totalPages && (
                  <>
                    {pages[pages.length - 1] < result.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink href={buildPageHref(result.totalPages)}>{result.totalPages}</PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={result.page < result.totalPages ? buildPageHref(result.page + 1) : "#"}
                    className={result.page >= result.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <p className="text-xs text-zinc-500">
            Showing {(result.page - 1) * result.pageSize + 1} to {Math.min(result.page * result.pageSize, result.total)} of {result.total} monitored events.
          </p>

          <div className="text-xs text-zinc-500">
            <Link href="/admin" className="text-(--accent) hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
