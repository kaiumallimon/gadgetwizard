import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { getAdminReviews } from "@/lib/server/services/review-service";
import { AdminReviewsManager } from "@/components/admin/admin-reviews-manager";
import type { ReviewStatus } from "@/lib/client/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"] as const;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parsePageSize(value: string | undefined): number {
  const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : DEFAULT_PAGE_SIZE;
}

function parseStatus(value: string | undefined): "all" | ReviewStatus {
  return STATUS_OPTIONS.includes((value ?? "all") as (typeof STATUS_OPTIONS)[number])
    ? ((value ?? "all") as "all" | ReviewStatus)
    : "all";
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

function buildAdminReviewsHref(input: {
  page: number;
  pageSize: number;
  status: "all" | ReviewStatus;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));

  if (input.status !== "all") {
    query.set("status", input.status);
  }

  return `/admin/reviews?${query.toString()}`;
}

export default async function AdminReviewsPage(context: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireServerRole(["admin"]);

  const rawSearchParams = await context.searchParams;
  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));
  const status = parseStatus(firstParam(rawSearchParams.status));

  let result = await getAdminReviews({
    page: requestedPage,
    pageSize,
    status: status === "all" ? undefined : status,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  let currentPage = requestedPage;
  if (result.total > 0 && requestedPage > totalPages) {
    currentPage = totalPages;
    result = await getAdminReviews({
      page: currentPage,
      pageSize,
      status: status === "all" ? undefined : status,
    });
  }

  const finalTotalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const pages = pageWindow(currentPage, finalTotalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);
  const queryState = {
    pageSize,
    status,
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Reviews Management</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Showing {rangeStart}-{rangeEnd} of {result.total} reviews. Moderate customer reviews before they go live.
            </p>
          </div>
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
                <BreadcrumbPage>Reviews</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-end" action="/admin/reviews" method="get">
            <div>
              <label
                htmlFor="admin-reviews-status"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Status
              </label>
              <Select name="status" defaultValue={status}>
                <SelectTrigger
                  id="admin-reviews-status"
                  className="h-10 min-w-48 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="admin-reviews-page-size"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Per Page
              </label>
              <Select name="pageSize" defaultValue={String(pageSize)}>
                <SelectTrigger
                  id="admin-reviews-page-size"
                  className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <input type="hidden" name="page" value="1" />

            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/reviews">Reset</Link>
              </Button>
            </div>
          </form>

          <AdminReviewsManager initialReviews={result.items} activeStatus={status} />

          {finalTotalPages > 1 && (
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={currentPage > 1
                      ? buildAdminReviewsHref({
                        ...queryState,
                        page: currentPage - 1,
                      })
                      : "#"}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href={buildAdminReviewsHref({
                          ...queryState,
                          page: 1,
                        })}
                      >
                        1
                      </PaginationLink>
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
                    <PaginationLink
                      href={buildAdminReviewsHref({
                        ...queryState,
                        page: pageNumber,
                      })}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pages[pages.length - 1] !== finalTotalPages && (
                  <>
                    {pages[pages.length - 1] < finalTotalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildAdminReviewsHref({
                          ...queryState,
                          page: finalTotalPages,
                        })}
                      >
                        {finalTotalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={currentPage < finalTotalPages
                      ? buildAdminReviewsHref({
                        ...queryState,
                        page: currentPage + 1,
                      })
                      : "#"}
                    className={currentPage >= finalTotalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
