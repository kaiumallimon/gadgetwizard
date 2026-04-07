"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Pencil, Pin, PinOff, Power, Search, Star, StarOff, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
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

interface CategoryListManagerProps {
  initialCategories: Category[];
}

type CategorySortOption =
  | "sort_order"
  | "name_az"
  | "name_za"
  | "newest"
  | "oldest"
  | "header_first"
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

function sortCategories(items: Category[], sort: CategorySortOption): Category[] {
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
    case "header_first":
      next.sort((a, b) => Number(b.isHeaderCategory) - Number(a.isHeaderCategory) || a.name.localeCompare(b.name));
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

function buildCategoryPayload(
  category: Category,
  overrides: Partial<{
    name: string;
    slug: string;
    icon: string | null;
    imageUrl: string | null;
    isHeaderCategory: boolean;
    isFeatured: boolean;
    sortOrder: number;
    isActive: boolean;
  }>,
) {
  return {
    name: overrides.name ?? category.name,
    slug: overrides.slug ?? category.slug,
    icon: overrides.icon ?? category.icon,
    imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : category.imageUrl,
    isHeaderCategory: overrides.isHeaderCategory ?? category.isHeaderCategory,
    isFeatured: overrides.isFeatured ?? category.isFeatured,
    sortOrder: overrides.sortOrder ?? category.sortOrder,
    isActive: overrides.isActive ?? category.isActive,
  };
}

export function CategoryListManager({ initialCategories }: CategoryListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CategorySortOption>("sort_order");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [pendingById, setPendingById] = useState<Record<number, boolean>>({});
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const searched = normalized
      ? items.filter((category) => {
        return [
          String(category.id),
          category.name,
          category.slug,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      : items;

    return sortCategories(searched, sort);
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
    const active = items.filter((category) => category.isActive).length;
    const pinned = items.filter((category) => category.isHeaderCategory).length;
    const featured = items.filter((category) => category.isFeatured).length;
    const withImage = items.filter((category) => (category.imageUrl ?? "").trim().length > 0).length;

    return {
      total: items.length,
      active,
      pinned,
      featured,
      withImage,
    };
  }, [items]);

  async function refreshCategories() {
    const response = await apiClient.adminGetCategories(token ?? undefined);
    setItems(response.items);
  }

  async function updateCategory(category: Category, updates: Parameters<typeof buildCategoryPayload>[1], successMessage: string) {
    setPendingById((previous) => ({ ...previous, [category.id]: true }));

    try {
      const response = await apiClient.adminUpdateCategory(
        category.id,
        buildCategoryPayload(category, updates),
        token ?? undefined,
      );

      setItems((previous) => previous.map((entry) => (entry.id === category.id ? response.item : entry)));
      toast.success(successMessage);
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category update failed"));
      await refreshCategories();
    } finally {
      setPendingById((previous) => ({ ...previous, [category.id]: false }));
    }
  }

  async function handleQuickEditCategory(category: Category) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name) {
      return;
    }

    const slug = window.prompt("Category slug", category.slug)?.trim();
    if (!slug) {
      return;
    }

    await updateCategory(category, { name, slug }, "Category updated.");
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await apiClient.adminDeleteCategory(categoryId, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== categoryId));
      toast.success("Category deleted.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category delete failed"));
    }
  }

  async function handleReplaceCategoryImage(category: Category, file: File | null) {
    if (!file) {
      return;
    }

    const target = `category-${category.id}`;
    setUploadingTarget(target);

    try {
      const upload = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      await updateCategory(category, { imageUrl: upload.item.url }, "Category image updated.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category image update failed"));
    } finally {
      setUploadingTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Categories</CardTitle>
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
            <CardTitle className="text-base">Header Pinned</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.pinned}/8</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Featured</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.featured}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">With Image</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{stats.withImage}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Category Directory</CardTitle>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, slug, or id"
                className="pl-9"
              />
            </div>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as CategorySortOption);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <option value="sort_order">Sort: Order (default)</option>
              <option value="name_az">Sort: Name A-Z</option>
              <option value="name_za">Sort: Name Z-A</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="header_first">Sort: Header First</option>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagedItems.map((category) => {
                  const pending = pendingById[category.id] === true;

                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-zinc-900">{category.name}</p>
                          <p className="text-xs text-zinc-500">#{category.id} | {category.slug}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {category.imageUrl?.trim() ? (
                          <div className="h-14 w-24 overflow-hidden rounded border border-zinc-200 bg-zinc-50 p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <Badge variant="outline">No Image</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={category.isActive ? "default" : "outline"}>{category.isActive ? "Active" : "Inactive"}</Badge>
                          {category.isHeaderCategory && <Badge variant="secondary">Header</Badge>}
                          {category.isFeatured && <Badge variant="secondary">Featured</Badge>}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium text-zinc-700">{category.sortOrder}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              void updateCategory(
                                category,
                                { isHeaderCategory: !category.isHeaderCategory },
                                !category.isHeaderCategory
                                  ? "Category added to header navigation."
                                  : "Category removed from header navigation.",
                              );
                            }}
                          >
                            {category.isHeaderCategory ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            {category.isHeaderCategory ? "Unpin" : "Pin"}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              void updateCategory(
                                category,
                                { isFeatured: !category.isFeatured },
                                !category.isFeatured
                                  ? "Category marked as featured for storefront."
                                  : "Category removed from featured storefront list.",
                              );
                            }}
                          >
                            {category.isFeatured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                            {category.isFeatured ? "Unfeature" : "Feature"}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              void updateCategory(
                                category,
                                { isActive: !category.isActive },
                                !category.isActive ? "Category activated." : "Category deactivated.",
                              );
                            }}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {category.isActive ? "Deactivate" : "Activate"}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => {
                              void handleQuickEditCategory(category);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => {
                              void handleDeleteCategory(category.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>

                          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                            {uploadingTarget === `category-${category.id}` ? <Upload className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />} Replace Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingTarget === `category-${category.id}`}
                              onChange={async (event) => {
                                const input = event.currentTarget;
                                const file = input.files?.[0] ?? null;
                                input.value = "";
                                await handleReplaceCategoryImage(category, file);
                              }}
                            />
                          </label>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-500">No categories match the current search/filter criteria.</p>
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
