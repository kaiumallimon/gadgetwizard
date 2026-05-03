import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getServerSession } from "@/lib/server/auth/server-session";
import { getWishlistPageForUser } from "@/lib/server/services/wishlist-service";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "oldest", label: "Oldest Added" },
  { value: "name_az", label: "Name: A to Z" },
  { value: "name_za", label: "Name: Z to A" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
] as const;

type RawSearchParams = Record<string, string | string[] | undefined>;
type WishlistSort = (typeof SORT_OPTIONS)[number]["value"];

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

function parseSort(value: string | undefined): WishlistSort {
  if (!value) {
    return "recent";
  }

  return SORT_OPTIONS.some((option) => option.value === value) ? (value as WishlistSort) : "recent";
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

function buildWishlistHref(input: {
  page: number;
  pageSize: number;
  search?: string;
  sort: WishlistSort;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));

  if (input.search) {
    query.set("search", input.search);
  }

  if (input.sort !== "recent") {
    query.set("sort", input.sort);
  }

  const queryString = query.toString();
  return queryString ? `/wishlist?${queryString}` : "/wishlist";
}

export default async function WishlistPage(context: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawSearchParams = await context.searchParams;
  const session = await getServerSession();
  if (!session) {
    redirect(buildLoginRedirect("/wishlist", rawSearchParams));
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  const search = firstParam(rawSearchParams.search)?.trim() || undefined;
  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));
  const sort = parseSort(firstParam(rawSearchParams.sort));

  let wishlist = await getWishlistPageForUser({
    userId: session.userId,
    page: requestedPage,
    pageSize,
    search,
    sort,
  });

  if (wishlist.total > 0 && requestedPage > wishlist.totalPages) {
    wishlist = await getWishlistPageForUser({
      userId: session.userId,
      page: wishlist.totalPages,
      pageSize,
      search,
      sort,
    });
  }

  const pages = pageWindow(wishlist.page, wishlist.totalPages);
  const rangeStart = wishlist.total === 0 ? 0 : (wishlist.page - 1) * wishlist.pageSize + 1;
  const rangeEnd = wishlist.total === 0 ? 0 : Math.min(wishlist.page * wishlist.pageSize, wishlist.total);
  const queryState = {
    pageSize,
    search,
    sort,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900">
              <Heart className="h-7 w-7" /> My Wishlist
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Showing {rangeStart}-{rangeEnd} of {wishlist.total} saved products
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <form className="flex flex-col gap-3 lg:flex-row lg:items-end" action="/wishlist" method="get">
          <div className="w-full lg:max-w-md">
            <label htmlFor="wishlist-search" className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Search Wishlist
            </label>
            <Input
              id="wishlist-search"
              name="search"
              placeholder="Search by product name, slug, or description"
              defaultValue={search ?? ""}
            />
          </div>

          <div>
            <label htmlFor="wishlist-sort" className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sort
            </label>
            <Select name="sort" defaultValue={sort}>
              <SelectTrigger
                id="wishlist-sort"
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="wishlist-page-size" className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Per Page
            </label>
            <Select name="pageSize" defaultValue={String(pageSize)}>
              <SelectTrigger
                id="wishlist-page-size"
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
              <Link href="/wishlist">Reset</Link>
            </Button>
          </div>
        </form>
      </section>

      {wishlist.total === 0 ? (
        <section className="flex min-h-[calc(100vh-18rem)] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-lg font-medium text-zinc-500">No wishlist found.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {wishlist.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>

          {wishlist.totalPages > 1 && (
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={wishlist.page > 1
                      ? buildWishlistHref({
                        ...queryState,
                        page: wishlist.page - 1,
                      })
                      : "#"}
                    className={wishlist.page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href={buildWishlistHref({
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
                      href={buildWishlistHref({
                        ...queryState,
                        page: pageNumber,
                      })}
                      isActive={pageNumber === wishlist.page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pages[pages.length - 1] !== wishlist.totalPages && (
                  <>
                    {pages[pages.length - 1] < wishlist.totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildWishlistHref({
                          ...queryState,
                          page: wishlist.totalPages,
                        })}
                      >
                        {wishlist.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={wishlist.page < wishlist.totalPages
                      ? buildWishlistHref({
                        ...queryState,
                        page: wishlist.page + 1,
                      })
                      : "#"}
                    className={wishlist.page >= wishlist.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
