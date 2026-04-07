import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPublicProductFilterFacets, getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const;
const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating_high", label: "Rating: High to Low" },
  { value: "rating_low", label: "Rating: Low to High" },
  { value: "name_az", label: "Name: A to Z" },
  { value: "name_za", label: "Name: Z to A" },
  { value: "stock_high", label: "Stock: High to Low" },
  { value: "stock_low", label: "Stock: Low to High" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function arrayParam(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
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

function parseSortOption(value: string | undefined): SortOption | undefined {
  if (!value) {
    return undefined;
  }

  return SORT_OPTIONS.some((entry) => entry.value === value) ? (value as SortOption) : undefined;
}

function parsePrice(value: string | undefined): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.floor(parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function buildCategoryHref(input: {
  slug: string;
  page: number;
  pageSize: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brandSlugs: string[];
  availabilitySelections: Array<"in" | "out">;
  sortPrimary: SortOption;
  sortSecondary?: SortOption;
}): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));

  if (input.search) {
    query.set("search", input.search);
  }

  if (input.minPrice !== undefined) {
    query.set("minPrice", String(input.minPrice));
  }

  if (input.maxPrice !== undefined) {
    query.set("maxPrice", String(input.maxPrice));
  }

  for (const brandSlug of input.brandSlugs) {
    query.append("brand", brandSlug);
  }

  for (const availability of input.availabilitySelections) {
    query.append("availability", availability);
  }

  if (input.sortPrimary !== "newest") {
    query.set("sortPrimary", input.sortPrimary);
  }

  if (input.sortSecondary && input.sortSecondary !== input.sortPrimary) {
    query.set("sortSecondary", input.sortSecondary);
  }

  const queryString = query.toString();
  return queryString ? `/category/${input.slug}?${queryString}` : `/category/${input.slug}`;
}

export default async function CategoryPage(context: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, rawSearchParams] = await Promise.all([context.params, context.searchParams]);

  const search = firstParam(rawSearchParams.search)?.trim() || undefined;
  const selectedBrandSlugs = Array.from(
    new Set(arrayParam(rawSearchParams.brand).map((value) => value.trim()).filter((value) => value.length > 0)),
  );

  const availabilitySelections = arrayParam(rawSearchParams.availability).filter(
    (value): value is "in" | "out" => value === "in" || value === "out",
  );

  const availabilityFilter =
    availabilitySelections.length === 1
      ? availabilitySelections[0]
      : "all";

  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));

  const sortPrimary = parseSortOption(firstParam(rawSearchParams.sortPrimary)) ?? "newest";
  const parsedSortSecondary = parseSortOption(firstParam(rawSearchParams.sortSecondary));
  const sortSecondary = parsedSortSecondary && parsedSortSecondary !== sortPrimary ? parsedSortSecondary : undefined;
  const sortOrder = sortSecondary ? [sortPrimary, sortSecondary] : [sortPrimary];

  const facets = await getPublicProductFilterFacets({
    categorySlug: slug,
    search,
  });

  const hasPriceBounds = facets.price.min !== null && facets.price.max !== null;
  const priceFloor = hasPriceBounds ? Math.floor(facets.price.min as number) : 0;
  const priceCeil = hasPriceBounds ? Math.ceil(facets.price.max as number) : 0;

  const rawMinPrice = parsePrice(firstParam(rawSearchParams.minPrice));
  const rawMaxPrice = parsePrice(firstParam(rawSearchParams.maxPrice));

  let sliderMinValue = hasPriceBounds ? priceFloor : 0;
  let sliderMaxValue = hasPriceBounds ? priceCeil : 0;

  if (hasPriceBounds) {
    const normalizedMin = rawMinPrice === undefined ? priceFloor : clamp(rawMinPrice, priceFloor, priceCeil);
    const normalizedMax = rawMaxPrice === undefined ? priceCeil : clamp(rawMaxPrice, priceFloor, priceCeil);
    sliderMinValue = Math.min(normalizedMin, normalizedMax);
    sliderMaxValue = Math.max(normalizedMin, normalizedMax);
  }

  const minPrice = hasPriceBounds && sliderMinValue > priceFloor ? sliderMinValue : undefined;
  const maxPrice = hasPriceBounds && sliderMaxValue < priceCeil ? sliderMaxValue : undefined;

  let currentPage = requestedPage;
  let result = await getPublicProducts({
    page: currentPage,
    pageSize,
    categorySlug: slug,
    search,
    brandSlugs: selectedBrandSlugs,
    minPrice,
    maxPrice,
    availability: availabilityFilter,
    sort: sortOrder,
  });

  let totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  if (result.total > 0 && currentPage > totalPages) {
    currentPage = totalPages;
    result = await getPublicProducts({
      page: currentPage,
      pageSize,
      categorySlug: slug,
      search,
      brandSlugs: selectedBrandSlugs,
      minPrice,
      maxPrice,
      availability: availabilityFilter,
      sort: sortOrder,
    });
    totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  }

  const categoryTitle = result.items[0]?.categoryName ?? slugToTitle(slug);
  const pages = pageWindow(currentPage, totalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);
  const brandNameBySlug = new Map(facets.brands.map((brand) => [brand.slug, brand.name]));

  const queryState = {
    slug,
    pageSize,
    search,
    minPrice,
    maxPrice,
    brandSlugs: selectedBrandSlugs,
    availabilitySelections,
    sortPrimary,
    sortSecondary,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{categoryTitle}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Showing {rangeStart}-{rangeEnd} of {result.total} products
            </p>
          </div>

          <Badge variant="outline" className="rounded-full px-3 py-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters & Sort
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Filter Products</CardTitle>
            <CardDescription>Refine by price, brand, availability, and sorting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="GET" className="space-y-6">
              <input type="hidden" name="page" value="1" />

              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium text-zinc-800">Search</label>
                <Input
                  id="search"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search in this category"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-800">Price Range</p>
                {hasPriceBounds ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>AUD {sliderMinValue.toLocaleString()}</span>
                      <span>AUD {sliderMaxValue.toLocaleString()}</span>
                    </div>

                    <input
                      type="range"
                      name="minPrice"
                      min={priceFloor}
                      max={priceCeil}
                      defaultValue={sliderMinValue}
                      className="w-full accent-(--accent)"
                    />
                    <input
                      type="range"
                      name="maxPrice"
                      min={priceFloor}
                      max={priceCeil}
                      defaultValue={sliderMaxValue}
                      className="w-full accent-(--accent)"
                    />
                  </>
                ) : (
                  <p className="text-xs text-zinc-500">No price range available for this category yet.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-800">Brands</p>
                {facets.brands.length > 0 ? (
                  <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
                    {facets.brands.map((brand) => (
                      <label key={brand.slug} className="inline-flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-700">
                        <span className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="brand"
                            value={brand.slug}
                            defaultChecked={selectedBrandSlugs.includes(brand.slug)}
                            className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
                          />
                          {brand.name}
                        </span>
                        <span className="text-xs text-zinc-500">{brand.total}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No brands found in this category.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-800">Availability</p>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="availability"
                    value="in"
                    defaultChecked={availabilitySelections.includes("in")}
                    className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
                  />
                  In stock ({facets.availability.inStock})
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="availability"
                    value="out"
                    defaultChecked={availabilitySelections.includes("out")}
                    className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
                  />
                  Out of stock ({facets.availability.outOfStock})
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-800">Sort By (Multiple)</p>

                <div className="space-y-2">
                  <label htmlFor="sortPrimary" className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Primary sort</label>
                  <select
                    id="sortPrimary"
                    name="sortPrimary"
                    defaultValue={sortPrimary}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="sortSecondary" className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Secondary sort</label>
                  <select
                    id="sortSecondary"
                    name="sortSecondary"
                    defaultValue={sortSecondary ?? ""}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                  >
                    <option value="">None</option>
                    {SORT_OPTIONS.filter((option) => option.value !== sortPrimary).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="pageSize" className="text-sm font-medium text-zinc-800">Products per page</label>
                <select
                  id="pageSize"
                  name="pageSize"
                  defaultValue={String(pageSize)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={String(size)}>{size} per page</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button type="submit" className="w-full">Apply Filters</Button>
                <Button asChild type="button" variant="outline" className="w-full">
                  <Link href={`/category/${slug}`}>Reset All</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {search && <Badge variant="outline">Search: {search}</Badge>}
            {minPrice !== undefined && <Badge variant="outline">Min: AUD {minPrice.toLocaleString()}</Badge>}
            {maxPrice !== undefined && <Badge variant="outline">Max: AUD {maxPrice.toLocaleString()}</Badge>}
            {selectedBrandSlugs.map((brandSlug) => (
              <Badge key={brandSlug} variant="outline">Brand: {brandNameBySlug.get(brandSlug) ?? slugToTitle(brandSlug)}</Badge>
            ))}
            {availabilityFilter === "in" && <Badge variant="outline">In stock only</Badge>}
            {availabilityFilter === "out" && <Badge variant="outline">Out of stock only</Badge>}
            {sortPrimary !== "newest" && (
              <Badge variant="outline">
                Sort: {SORT_OPTIONS.find((option) => option.value === sortPrimary)?.label ?? "Custom"}
              </Badge>
            )}
            {sortSecondary && (
              <Badge variant="outline">
                Then: {SORT_OPTIONS.find((option) => option.value === sortSecondary)?.label ?? "Custom"}
              </Badge>
            )}
          </div>

          {result.items.length === 0 ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
              No products match your current filters. Try broadening the range or resetting filters.
            </section>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </section>
          )}

          {totalPages > 1 && (
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={currentPage > 1
                      ? buildCategoryHref({
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
                        href={buildCategoryHref({
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
                      href={buildCategoryHref({
                        ...queryState,
                        page: pageNumber,
                      })}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pages[pages.length - 1] !== totalPages && (
                  <>
                    {pages[pages.length - 1] < totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildCategoryHref({
                          ...queryState,
                          page: totalPages,
                        })}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={currentPage < totalPages
                      ? buildCategoryHref({
                        ...queryState,
                        page: currentPage + 1,
                      })
                      : "#"}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}
