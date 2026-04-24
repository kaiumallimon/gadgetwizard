import Link from "next/link";
import { Search } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminWishlist } from "@/lib/server/services/wishlist-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
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

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function buildAdminWishlistHref(input: {
  page: number;
  pageSize: number;
  search?: string;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));

  if (input.search) {
    query.set("search", input.search);
  }

  return `/admin/wishlist?${query.toString()}`;
}

export default async function AdminWishlistPage(context: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireServerRole(["admin"]);

  const rawSearchParams = await context.searchParams;
  const search = firstParam(rawSearchParams.search)?.trim() || undefined;
  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));

  let result = await getAdminWishlist({
    page: requestedPage,
    pageSize,
    search,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  let currentPage = requestedPage;
  if (result.total > 0 && requestedPage > totalPages) {
    currentPage = totalPages;
    result = await getAdminWishlist({
      page: currentPage,
      pageSize,
      search,
    });
  }

  const finalTotalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const pages = pageWindow(currentPage, finalTotalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);
  const queryState = {
    pageSize,
    search,
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Wishlist Activity</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Showing {rangeStart}-{rangeEnd} of {result.total} wishlist entries.
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
                <BreadcrumbPage>Wishlist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-end" action="/admin/wishlist" method="get">
            <div className="w-full lg:max-w-lg">
              <label
                htmlFor="admin-wishlist-search"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="admin-wishlist-search"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search by user name, email, product name, or slug"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-wishlist-page-size"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Per Page
              </label>
              <select
                id="admin-wishlist-page-size"
                name="pageSize"
                defaultValue={String(pageSize)}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <input type="hidden" name="page" value="1" />

            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/wishlist">Reset</Link>
              </Button>
            </div>
          </form>

          {result.total === 0 ? (
            <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-lg font-medium text-zinc-500">No wishlist found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-700">User</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-700">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-700">Saved At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {result.items.map((entry) => (
                      <tr key={entry.id} className="hover:bg-zinc-50/80">
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-zinc-900">{entry.userName}</p>
                          <p className="text-xs text-zinc-500">{entry.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link href={`/product/${entry.productSlug}`} className="font-medium text-zinc-900 hover:underline">
                            {entry.productName}
                          </Link>
                          <div className="mt-1">
                            <Badge variant="outline">Product ID: {entry.productId}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 align-top">
                          {new Date(entry.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {finalTotalPages > 1 && (
                <Pagination className="justify-start">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={currentPage > 1
                          ? buildAdminWishlistHref({
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
                            href={buildAdminWishlistHref({
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
                          href={buildAdminWishlistHref({
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
                            href={buildAdminWishlistHref({
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
                          ? buildAdminWishlistHref({
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
