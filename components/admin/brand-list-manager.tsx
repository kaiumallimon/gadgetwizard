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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as BrandSortOption);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <option value="sort_order">Sort: Order (default)</option>
              <option value="name_az">Sort: Name A-Z</option>
              <option value="name_za">Sort: Name Z-A</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
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
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {pagedItems.map((brand) => {
          return (
            <Card key={brand.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">{brand.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={brand.isActive ? "default" : "outline"}>{brand.isActive ? "Active" : "Inactive"}</Badge>
                    {brand.isFeatured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {brand.imageUrl && (
                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    <div className="h-28 bg-zinc-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-sm text-zinc-700">
                  <p><span className="font-medium text-zinc-900">Slug:</span> {brand.slug}</p>
                  <p><span className="font-medium text-zinc-900">Sort Order:</span> {brand.sortOrder}</p>
                  <p><span className="font-medium text-zinc-900">Status:</span> {brand.isActive ? "Active" : "Inactive"}</p>
                  <p><span className="font-medium text-zinc-900">Featured:</span> {brand.isFeatured ? "Yes" : "No"}</p>
                  <p className="line-clamp-3">
                    <span className="font-medium text-zinc-900">Description:</span> {brand.description ?? "No description"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/admin/brands/${brand.id}`}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deleteBrand(brand)} disabled={deletingId === brand.id}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pagedItems.length === 0 && <p className="text-sm text-zinc-500">No brands found for current search/filter options.</p>}

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
