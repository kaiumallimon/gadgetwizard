import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminBusinessAccounts } from "@/lib/server/services/business-account-service";
import type { BusinessAccountStatus } from "@/lib/client/types";
import { AdminBusinessAccountRequestsManager } from "@/components/admin/admin-business-account-requests-manager";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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

function parseStatus(value: string | undefined): "all" | BusinessAccountStatus {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  return "all";
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

function buildPageHref(input: {
  page: number;
  pageSize: number;
  status: "all" | BusinessAccountStatus;
  search?: string;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));

  if (input.status !== "all") {
    query.set("status", input.status);
  }

  if (input.search) {
    query.set("search", input.search);
  }

  return `/admin/business-accounts?${query.toString()}`;
}

export default async function AdminBusinessAccountsPage(context: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireServerRole(["admin"]);

  const rawSearchParams = await context.searchParams;
  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));
  const status = parseStatus(firstParam(rawSearchParams.status));
  const search = firstParam(rawSearchParams.search)?.trim() || undefined;

  let result = await getAdminBusinessAccounts({
    page: requestedPage,
    pageSize,
    status: status === "all" ? undefined : status,
    search,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  let currentPage = requestedPage;
  if (result.total > 0 && requestedPage > totalPages) {
    currentPage = totalPages;
    result = await getAdminBusinessAccounts({
      page: currentPage,
      pageSize,
      status: status === "all" ? undefined : status,
      search,
    });
  }

  const finalTotalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const pages = pageWindow(currentPage, finalTotalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);
  const queryState = { pageSize, status, search };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Business Account Requests</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Showing {rangeStart}-{rangeEnd} of {result.total} requests.
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
                <BreadcrumbPage>Business Requests</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <form action="/admin/business-accounts" method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="business-search">Search</Label>
            <Input id="business-search" name="search" defaultValue={search ?? ""} placeholder="Business name, contact, user email" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="business-status">Status</Label>
            <select
              id="business-status"
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="business-page-size">Per Page</Label>
            <select
              id="business-page-size"
              name="pageSize"
              defaultValue={String(pageSize)}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={String(size)}>{size}</option>
              ))}
            </select>
          </div>

          <input type="hidden" name="page" value="1" />

          <div className="flex gap-2">
            <Button type="submit">Apply</Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/business-accounts">Reset</Link>
            </Button>
          </div>
        </form>

        <AdminBusinessAccountRequestsManager initialItems={result.items} />

        {finalTotalPages > 1 && (
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={currentPage > 1 ? buildPageHref({ ...queryState, page: currentPage - 1 }) : "#"}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {pages[0] !== 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink href={buildPageHref({ ...queryState, page: 1 })}>1</PaginationLink>
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
                    href={buildPageHref({ ...queryState, page: pageNumber })}
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
                    <PaginationLink href={buildPageHref({ ...queryState, page: finalTotalPages })}>
                      {finalTotalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href={currentPage < finalTotalPages ? buildPageHref({ ...queryState, page: currentPage + 1 }) : "#"}
                  className={currentPage >= finalTotalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </div>
  );
}
