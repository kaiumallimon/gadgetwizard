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
import { getAdminActivityFeedPage, getAdminActivitySummary } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const VALID_ACTIONS = ["create", "read", "update", "delete"] as const;
type CrudAction = (typeof VALID_ACTIONS)[number];

function parsePage(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, Math.floor(parsed));
}

function parseAction(value?: string): CrudAction | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if ((VALID_ACTIONS as readonly string[]).includes(normalized)) {
    return normalized as CrudAction;
  }

  return undefined;
}

function buildPageHref(page: number, action?: CrudAction): string {
  const query = new URLSearchParams();
  query.set("page", String(page));
  if (action) {
    query.set("action", action);
  }

  return `/admin/activity?${query.toString()}`;
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

function eventLabel(action: CrudAction): string {
  if (action === "create") return "CREATE";
  if (action === "read") return "READ";
  if (action === "update") return "UPDATE";
  return "DELETE";
}

function actionVariant(action: CrudAction): "default" | "secondary" | "outline" {
  if (action === "create") return "default";
  if (action === "update") return "secondary";
  return "outline";
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const action = parseAction(params.action);

  const [summary, result] = await Promise.all([
    getAdminActivitySummary(),
    getAdminActivityFeedPage({ page, pageSize: PAGE_SIZE, action }),
  ]);

  const visibleActorCount = new Set(
    result.items.map((row) => row.actorEmail ?? `${row.actorRole}-${row.id}`),
  ).size;
  const pages = pageWindow(result.page, result.totalPages);
  const actionCountMap = new Map(summary.actionCounts.map((item) => [item.action, item.total]));

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">System Monitoring</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Activity Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Audit who is doing what across CRUD actions, with actor identity, route target, and status.
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
            {summary.successful}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who Did What</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <PaginationLink href={buildPageHref(1)} isActive={!action}>
              All ({summary.total})
            </PaginationLink>
            {VALID_ACTIONS.map((actionName) => (
              <PaginationLink key={actionName} href={buildPageHref(1, actionName)} isActive={action === actionName}>
                {eventLabel(actionName)} ({actionCountMap.get(actionName) ?? 0})
              </PaginationLink>
            ))}
          </div>

          {result.items.length === 0 && <p className="text-sm text-zinc-500">No activity logs found.</p>}

          {result.items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-zinc-50">
                  <tr className="text-left text-zinc-600">
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Message</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-200 text-zinc-800">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.actorName ?? "Unknown actor"}</p>
                        <p className="text-xs text-zinc-500">{row.actorEmail ?? "No email"}</p>
                        <p className="text-xs uppercase tracking-wider text-zinc-500">{row.actorRole}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(row.crudAction)}>{eventLabel(row.crudAction)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.resourceName}</p>
                        <p className="text-xs text-zinc-500">{row.routePath}</p>
                        {row.resourceId && <p className="text-xs text-zinc-500">Resource ID: {row.resourceId}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{row.message}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.isSuccess ? "secondary" : "destructive"}>
                          {row.isSuccess ? "Success" : "Failed"} ({row.statusCode})
                        </Badge>
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
                    href={result.page > 1 ? buildPageHref(result.page - 1, action) : "#"}
                    className={result.page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink href={buildPageHref(1, action)}>1</PaginationLink>
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
                    <PaginationLink href={buildPageHref(pageNumber, action)} isActive={pageNumber === result.page}>
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
                      <PaginationLink href={buildPageHref(result.totalPages, action)}>{result.totalPages}</PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={result.page < result.totalPages ? buildPageHref(result.page + 1, action) : "#"}
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
