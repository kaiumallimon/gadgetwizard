"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Power, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductListManagerProps {
  initialProducts: Product[];
}

type ProductSortOption =
  | "newest"
  | "oldest"
  | "name_az"
  | "name_za"
  | "price_low"
  | "price_high"
  | "stock_low"
  | "stock_high"
  | "featured_first"
  | "active_first";

const PAGE_SIZE_OPTIONS = [8, 12, 24, 48] as const;

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function stripHtml(input: string | null): string {
  if (!input) {
    return "No description";
  }

  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countSpecificationEntries(specifications: Record<string, unknown> | null): number {
  if (!specifications) {
    return 0;
  }

  const entries = Object.entries(specifications);
  if (entries.length === 0) {
    return 0;
  }

  const grouped = entries.every(([, value]) => typeof value === "object" && value !== null && !Array.isArray(value));
  if (!grouped) {
    return entries.length;
  }

  return entries.reduce((total, [, value]) => {
    const rowCount = Object.keys(value as Record<string, unknown>).length;
    return total + rowCount;
  }, 0);
}

function sortProducts(items: Product[], sort: ProductSortOption): Product[] {
  const next = [...items];

  switch (sort) {
    case "oldest":
      next.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      return next;
    case "name_az":
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    case "name_za":
      next.sort((a, b) => b.name.localeCompare(a.name));
      return next;
    case "price_low":
      next.sort(
        (a, b) =>
          (a.discountedPrice ?? a.originalPrice) - (b.discountedPrice ?? b.originalPrice) ||
          a.name.localeCompare(b.name),
      );
      return next;
    case "price_high":
      next.sort(
        (a, b) =>
          (b.discountedPrice ?? b.originalPrice) - (a.discountedPrice ?? a.originalPrice) ||
          a.name.localeCompare(b.name),
      );
      return next;
    case "stock_low":
      next.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
      return next;
    case "stock_high":
      next.sort((a, b) => b.stock - a.stock || a.name.localeCompare(b.name));
      return next;
    case "featured_first":
      next.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
      return next;
    case "active_first":
      next.sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));
      return next;
    case "newest":
    default:
      next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return next;
  }
}

function buildProductPayload(
  product: Product,
  overrides: Partial<Parameters<typeof apiClient.adminUpdateProduct>[1]> = {},
): Parameters<typeof apiClient.adminUpdateProduct>[1] {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.originalPrice,
    originalPrice: product.originalPrice,
    discountedPrice: product.discountedPrice,
    loyalCustomerPrice: product.loyalCustomerPrice,
    stock: product.stock,
    categoryId: product.categoryId,
    brandId: product.brandId,
    sku: product.sku,
    modelNumber: product.modelNumber,
    color: product.color,
    warrantyMonths: product.warrantyMonths,
    returnWindowDays: product.returnWindowDays,
    weightGrams: product.weightGrams,
    tags: product.tags,
    highlightPoints: product.highlightPoints,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isTopRated: product.isTopRated,
    isTrending: product.isTrending,
    isLimitedStock: product.isLimitedStock,
    isFreeDelivery: product.isFreeDelivery,
    isCashOnDelivery: product.isCashOnDelivery,
    isEmiAvailable: product.isEmiAvailable,
    isOfficialWarranty: product.isOfficialWarranty,
    isExchangeAvailable: product.isExchangeAvailable,
    isPreorder: product.isPreorder,
    images: product.images,
    specifications: product.specifications,
    isActive: product.isActive,
    ...overrides,
  };
}

export function ProductListManager({ initialProducts }: ProductListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ProductSortOption>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [pendingById, setPendingById] = useState<Record<number, boolean>>({});

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const searched = normalized
      ? items.filter((product) => {
        return [
          String(product.id),
          product.name,
          product.slug,
          product.shortDescription ?? "",
          product.description ?? "",
          product.categoryName,
          product.brandName ?? "",
          product.sku ?? "",
          product.modelNumber ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      : items;

    return sortProducts(searched, sort);
  }, [items, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pages = pageWindow(page, totalPages);
  const start = (page - 1) * pageSize;
  const pagedItems = filteredItems.slice(start, start + pageSize);

  const stats = useMemo(() => {
    const active = items.filter((product) => product.isActive).length;
    const featured = items.filter((product) => product.isFeatured).length;
    const discounted = items.filter((product) => product.discountedPrice !== null).length;
    const lowStock = items.filter((product) => product.stock > 0 && product.stock <= 5).length;

    return {
      total: items.length,
      active,
      featured,
      discounted,
      lowStock,
    };
  }, [items]);

  async function toggleActive(product: Product) {
    setPendingById((previous) => ({ ...previous, [product.id]: true }));

    try {
      const response = await apiClient.adminUpdateProduct(
        product.id,
        buildProductPayload(product, { isActive: !product.isActive }),
        token ?? undefined,
      );

      setItems((previous) => previous.map((entry) => (entry.id === product.id ? response.item : entry)));
      toast.success(!product.isActive ? "Product activated." : "Product deactivated.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to update product status"));
    } finally {
      setPendingById((previous) => ({ ...previous, [product.id]: false }));
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setPendingById((previous) => ({ ...previous, [product.id]: true }));
      await apiClient.adminDeleteProduct(product.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== product.id));
      toast.success("Product deleted.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to delete product"));
    } finally {
      setPendingById((previous) => ({ ...previous, [product.id]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-emerald-700">{stats.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Featured</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.featured}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Discounted</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.discounted}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Low Stock (&lt;= 5)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.lowStock}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Product Directory</CardTitle>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, slug, category, brand, sku, or id"
                className="pl-9"
              />
            </div>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ProductSortOption);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name_az">Sort: Name A-Z</option>
              <option value="name_za">Sort: Name Z-A</option>
              <option value="price_low">Sort: Price Low-High</option>
              <option value="price_high">Sort: Price High-Low</option>
              <option value="stock_low">Sort: Stock Low-High</option>
              <option value="stock_high">Sort: Stock High-Low</option>
              <option value="featured_first">Sort: Featured First</option>
              <option value="active_first">Sort: Active First</option>
            </select>

            <select
              value={String(pageSize)}
              onChange={(event) => {
                const next = Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number];
                setPageSize(next);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {pagedItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Category / Brand</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedItems.map((product) => {
                  const pending = pendingById[product.id] === true;
                  const summary = stripHtml(product.shortDescription ?? product.description);

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-medium text-zinc-900">{product.name}</p>
                          <p className="text-xs text-zinc-500">
                            #{product.id} | {product.slug}
                            {product.sku ? ` | SKU: ${product.sku}` : ""}
                          </p>
                          <p className="line-clamp-2 text-xs text-zinc-600">{summary}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-xs text-zinc-700">
                          <p>Original: AUD {product.originalPrice.toLocaleString()}</p>
                          <p>
                            Discounted: {product.discountedPrice !== null ? `AUD ${product.discountedPrice.toLocaleString()}` : "N/A"}
                          </p>
                          <p>Loyal: AUD {product.loyalCustomerPrice.toLocaleString()}</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium text-zinc-700">{product.stock}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={product.isActive ? "default" : "outline"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                          {product.isFeatured && <Badge variant="secondary">Featured</Badge>}
                          {product.isNewArrival && <Badge variant="secondary">New</Badge>}
                          {product.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
                          {product.isLimitedStock && <Badge variant="secondary">Limited</Badge>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{product.categoryName}</p>
                          <p className="text-xs text-zinc-500">
                            {product.brandName ?? "No brand"} | Specs: {countSpecificationEntries(product.specifications)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button asChild type="button" size="sm" variant="secondary" disabled={pending}>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Link>
                          </Button>

                          <Button asChild type="button" size="sm" variant="outline" disabled={pending}>
                            <Link href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </Link>
                          </Button>

                          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void toggleActive(product)}>
                            <Power className="h-3.5 w-3.5" /> {product.isActive ? "Deactivate" : "Activate"}
                          </Button>

                          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => void deleteProduct(product)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-500">No products match the current search/filter criteria.</p>
          )}

          {totalPages > 1 && (
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (page > 1) {
                        setPage(page - 1);
                      }
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(1);
                        }}
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
                      href="#"
                      isActive={page === pageNumber}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
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
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (page < totalPages) {
                        setPage(page + 1);
                      }
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
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
