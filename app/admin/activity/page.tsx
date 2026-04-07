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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminActivityFeedPage, getAdminActivitySummary } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;
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
  const rangeStart = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(result.page * result.pageSize, result.total);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">System Monitoring</p>
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Activity Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          $it who is doing what across CRUD actions, with actor identity, route target, and status.
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
            <CardTitle className="text-base">Successful Actions</CardTitle>
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
          <Pagination className="mx-0 w-full justify-start">
            <PaginationContent className="flex flex-wrap justify-start gap-2">
              <PaginationItem>
                <PaginationLink
                  size="default"
                  href={buildPageHref(1)}
                  isActive={!action}
                  className="h-8 px-2.5 text-xs whitespace-nowrap"
                >
                  All ({summary.total})
                </PaginationLink>
              </PaginationItem>
              {VALID_ACTIONS.map((actionName) => (
                <PaginationItem key={actionName}>
                  <PaginationLink
                    size="default"
                    href={buildPageHref(1, actionName)}
                    isActive={action === actionName}
                    className="h-8 px-2.5 text-xs whitespace-nowrap"
                  >
                    {eventLabel(actionName)} ({actionCountMap.get(actionName) ?? 0})
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>

          {result.items.length === 0 && <p className="text-sm text-zinc-500">No activity logs found.</p>}

          {result.items.length > 0 && (
            <div className="rounded-lg border border-zinc-200">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{row.actorName ?? "Unknown actor"}</p>
                        <p className="text-xs text-zinc-500">{row.actorEmail ?? "No email"}</p>
                        <p className="text-xs uppercase tracking-wider text-zinc-500">{row.actorRole}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(row.crudAction)}>{eventLabel(row.crudAction)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{row.resourceName}</p>
                        <p className="text-xs text-zinc-500">{row.routePath}</p>
                        {row.resourceId && <p className="text-xs text-zinc-500">Resource ID: {row.resourceId}</p>}
                      </TableCell>
                      <TableCell className="text-zinc-600">{row.message}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.isSuccess ? "secondary" : "outline"}
                          className={row.isSuccess ? "" : "border-red-200 bg-red-50 text-red-700"}
                        >
                          {row.isSuccess ? "Success" : "Failed"} ({row.statusCode})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-600">{new Date(row.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-zinc-500">
                Page {result.page} of {result.totalPages}
              </p>

              <div className="w-full overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
                <Pagination className="mx-0 w-max min-w-full justify-start md:w-auto md:min-w-0 md:justify-end">
                  <PaginationContent className="flex-nowrap">
                  <PaginationItem>
                    <PaginationLink
                      size="default"
                      href={result.page > 1 ? buildPageHref(1, action) : "#"}
                      className={`hidden sm:inline-flex ${result.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
                    >
                      First
                    </PaginationLink>
                  </PaginationItem>

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

                  <PaginationItem>
                    <PaginationLink
                      size="default"
                      href={result.page < result.totalPages ? buildPageHref(result.totalPages, action) : "#"}
                      className={`hidden sm:inline-flex ${result.page >= result.totalPages ? "pointer-events-none opacity-50" : ""}`}
                    >
                      Last
                    </PaginationLink>
                  </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-500">
            Showing {rangeStart} to {rangeEnd} of {result.total} monitored events.
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
