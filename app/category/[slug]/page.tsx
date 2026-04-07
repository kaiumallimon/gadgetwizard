import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

import { CategoryFilters } from "@/components/category-filters";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
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
const PRICE_FILTER_MIN = 0;
const PRICE_FILTER_MAX = 1_000_000;

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

function normalizeColorValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatColorLabel(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  colors: string[];
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

  for (const color of input.colors) {
    query.append("color", color);
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
  const selectedColors = Array.from(
    new Set(arrayParam(rawSearchParams.color).map(normalizeColorValue).filter((value) => value.length > 0)),
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

  const rawMinPrice = parsePrice(firstParam(rawSearchParams.minPrice));
  const rawMaxPrice = parsePrice(firstParam(rawSearchParams.maxPrice));

  const normalizedMinPrice = clamp(rawMinPrice ?? PRICE_FILTER_MIN, PRICE_FILTER_MIN, PRICE_FILTER_MAX);
  const normalizedMaxPrice = clamp(rawMaxPrice ?? PRICE_FILTER_MAX, PRICE_FILTER_MIN, PRICE_FILTER_MAX);
  const selectedMinPrice = Math.min(normalizedMinPrice, normalizedMaxPrice);
  const selectedMaxPrice = Math.max(normalizedMinPrice, normalizedMaxPrice);

  const minPrice = selectedMinPrice > PRICE_FILTER_MIN ? selectedMinPrice : undefined;
  const maxPrice = selectedMaxPrice < PRICE_FILTER_MAX ? selectedMaxPrice : undefined;

  let currentPage = requestedPage;
  let result = await getPublicProducts({
    page: currentPage,
    pageSize,
    categorySlug: slug,
    search,
    brandSlugs: selectedBrandSlugs,
    colors: selectedColors,
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
      colors: selectedColors,
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
  const colorLabelByValue = new Map(facets.colors.map((color) => [color.value, color.label]));

  const queryState = {
    slug,
    pageSize,
    search,
    minPrice,
    maxPrice,
    brandSlugs: selectedBrandSlugs,
    colors: selectedColors,
    availabilitySelections,
    sortPrimary,
    sortSecondary,
  };

  const hasActiveFilters =
    Boolean(search) ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    selectedBrandSlugs.length > 0 ||
    selectedColors.length > 0 ||
    availabilityFilter !== "all" ||
    sortPrimary !== "newest" ||
    Boolean(sortSecondary);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
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
        <CategoryFilters
          slug={slug}
          search={search}
          priceMin={PRICE_FILTER_MIN}
          priceMax={PRICE_FILTER_MAX}
          selectedMinPrice={selectedMinPrice}
          selectedMaxPrice={selectedMaxPrice}
          brands={facets.brands}
          selectedBrandSlugs={selectedBrandSlugs}
          colors={facets.colors}
          selectedColors={selectedColors}
          availabilitySelections={availabilitySelections}
          sortOptions={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          sortPrimary={sortPrimary}
          sortSecondary={sortSecondary}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />

        <div className="space-y-5">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Active filters</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {search && <Badge variant="outline">Search: {search}</Badge>}
              {minPrice !== undefined && <Badge variant="outline">From: AUD {minPrice.toLocaleString()}</Badge>}
              {maxPrice !== undefined && <Badge variant="outline">Up to: AUD {maxPrice.toLocaleString()}</Badge>}
              {selectedBrandSlugs.map((brandSlug) => (
                <Badge key={brandSlug} variant="outline">Brand: {brandNameBySlug.get(brandSlug) ?? slugToTitle(brandSlug)}</Badge>
              ))}
              {selectedColors.map((colorValue) => (
                <Badge key={colorValue} variant="outline">
                  Color: {colorLabelByValue.get(colorValue) ?? formatColorLabel(colorValue)}
                </Badge>
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
              {!hasActiveFilters && <p className="text-sm text-zinc-500">No filters applied.</p>}
            </div>
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
