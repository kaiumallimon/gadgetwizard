"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edit3, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Brand } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BrandListManagerProps {
  initialBrands: Brand[];
}

type BrandSortOption =
  | "sort_order"
  | "name_az"
  | "name_za"
  | "newest"
  | "oldest"
  | "featured_first"
  | "active_first";

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const;

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function sortBrands(items: Brand[], sort: BrandSortOption): Brand[] {
  const next = [...items];

  switch (sort) {
    case "name_az":
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
    case "name_za":
      next.sort((a, b) => b.name.localeCompare(a.name));
      return next;
    case "newest":
      next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return next;
    case "oldest":
      next.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      return next;
    case "featured_first":
      next.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name));
      return next;
    case "active_first":
      next.sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));
      return next;
    case "sort_order":
    default:
      next.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      return next;
  }
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrandListManager({ initialBrands }: BrandListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialBrands);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BrandSortOption>("sort_order");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searched = normalized
      ? items.filter((brand) =>
        [
          String(brand.id),
          brand.name,
          brand.slug,
          brand.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
      : items;

    return sortBrands(searched, sort);
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
    return {
      total: items.length,
      active: items.filter((brand) => brand.isActive).length,
      featured: items.filter((brand) => brand.isFeatured).length,
      withImage: items.filter((brand) => (brand.imageUrl ?? "").trim().length > 0).length,
    };
  }, [items]);

  async function deleteBrand(brand: Brand) {
    const confirmed = window.confirm(`Delete ${brand.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(brand.id);
      await apiClient.adminDeleteBrand(brand.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== brand.id));
      toast.success("Brand deleted.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to delete brand"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Brands</CardTitle>
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
            <CardTitle className="text-base">With Logo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.withImage}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Brand Directory</CardTitle>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, slug, description, or id"
                className="pl-9"
              />
            </div>

            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as BrandSortOption);
                setPage(1);
              }}
            >
              <SelectTrigger className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sort_order">Sort: Order (default)</SelectItem>
                <SelectItem value="name_az">Sort: Name A-Z</SelectItem>
                <SelectItem value="name_za">Sort: Name Z-A</SelectItem>
                <SelectItem value="newest">Sort: Newest</SelectItem>
                <SelectItem value="oldest">Sort: Oldest</SelectItem>
                <SelectItem value="featured_first">Sort: Featured First</SelectItem>
                <SelectItem value="active_first">Sort: Active First</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const next = Number(value) as (typeof PAGE_SIZE_OPTIONS)[number];
                setPageSize(next);
                setPage(1);
              }}
            >
              <SelectTrigger className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {pagedItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedItems.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">{brand.name}</p>
                        <p className="text-xs text-zinc-500">#{brand.id} | {brand.slug}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {brand.imageUrl ? (
                        <div className="h-14 w-24 overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <Badge variant="outline">No Logo</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={brand.isActive ? "default" : "outline"}>{brand.isActive ? "Active" : "Inactive"}</Badge>
                        {brand.isFeatured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-medium text-zinc-700">{brand.sortOrder}</TableCell>

                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm text-zinc-700">{brand.description ?? "No description"}</p>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button asChild type="button" size="sm" variant="outline">
                          <Link href={`/admin/brands/${brand.id}`}>
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </Link>
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => deleteBrand(brand)} disabled={deletingId === brand.id}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-500">No brands found for current search/filter options.</p>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
