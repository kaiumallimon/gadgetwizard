"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminInventoryManagerProps {
  initialProducts: Product[];
}

type StockFilter = "all" | "in" | "low" | "out";

const LOW_STOCK_THRESHOLD = 10;

function buildProductUpdatePayload(product: Product, stock: number) {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.originalPrice,
    originalPrice: product.originalPrice,
    discountedPrice: product.discountedPrice,
    wholesalePrice: product.wholesalePrice,
    wholesaleMinQuantity: product.wholesaleMinQuantity,
    stock,
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
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function parseStockInput(raw: string): number | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

export function AdminInventoryManager({ initialProducts }: AdminInventoryManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [bulkStep, setBulkStep] = useState("5");
  const [pendingById, setPendingById] = useState<Record<number, boolean>>({});
  const [draftStockById, setDraftStockById] = useState<Record<number, string>>(() => {
    return Object.fromEntries(initialProducts.map((product) => [product.id, String(product.stock)]));
  });

  const stats = useMemo(() => {
    const inStock = items.filter((product) => product.stock > 0).length;
    const outOfStock = items.filter((product) => product.stock === 0).length;
    const lowStock = items.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD).length;
    const totalUnits = items.reduce((sum, product) => sum + product.stock, 0);

    return {
      totalProducts: items.length,
      inStock,
      outOfStock,
      lowStock,
      totalUnits,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((product) => {
      if (stockFilter === "in" && product.stock <= 0) {
        return false;
      }

      if (stockFilter === "low" && !(product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD)) {
        return false;
      }

      if (stockFilter === "out" && product.stock !== 0) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        product.name,
        product.sku ?? "",
        product.categoryName,
        product.brandName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [items, query, stockFilter]);

  const numericBulkStep = Math.max(1, parseStockInput(bulkStep) ?? 1);

  async function persistStock(product: Product, nextStock: number, actionLabel: string) {
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast.error("Stock must be a non-negative whole number");
      return;
    }

    setPendingById((previous) => ({ ...previous, [product.id]: true }));

    try {
      const response = await apiClient.adminUpdateProduct(
        product.id,
        buildProductUpdatePayload(product, nextStock),
        token ?? undefined,
      );

      setItems((previous) => previous.map((entry) => (entry.id === product.id ? response.item : entry)));
      setDraftStockById((previous) => ({ ...previous, [product.id]: String(response.item.stock) }));
      toast.success(`${actionLabel} for ${product.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update stock");
    } finally {
      setPendingById((previous) => ({ ...previous, [product.id]: false }));
    }
  }

  function handleSetStock(product: Product) {
    const parsed = parseStockInput(draftStockById[product.id] ?? String(product.stock));
    if (parsed === null) {
      toast.error("Enter a valid non-negative stock value");
      return;
    }

    void persistStock(product, parsed, "Stock updated");
  }

  function handleAdjustStock(product: Product, delta: number) {
    const nextStock = Math.max(0, product.stock + delta);
    const label = delta >= 0 ? `Stock increased by ${delta}` : `Stock decreased by ${Math.abs(delta)}`;
    void persistStock(product, nextStock, label);
  }

  function handleClearStock(product: Product) {
    void persistStock(product, 0, "Stock cleared");
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-zinc-900">{formatNumber(stats.totalProducts)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">In Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-emerald-700">{formatNumber(stats.inStock)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-amber-600">{formatNumber(stats.lowStock)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Out Of Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-rose-700">{formatNumber(stats.outOfStock)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Units On Hand</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-zinc-900">{formatNumber(stats.totalUnits)}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Inventory Control</CardTitle>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by product, SKU, category, or brand"
                className="pl-9"
              />
            </div>

            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
              <SelectTrigger className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in">In stock</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              value={bulkStep}
              onChange={(event) => setBulkStep(event.target.value)}
              placeholder="Bulk step"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Set Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((product) => {
                  const pending = pendingById[product.id] === true;
                  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="line-clamp-1 font-medium text-zinc-900">{product.name}</p>
                          <p className="text-xs text-zinc-500">
                            {product.categoryName}
                            {product.brandName ? ` | ${product.brandName}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600">{product.sku ?? "-"}</TableCell>
                      <TableCell>
                        {product.stock === 0 ? (
                          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Out</Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Low</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">In</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-900">{formatNumber(product.stock)}</TableCell>
                      <TableCell>
                        <div className="ml-auto w-26">
                          <Input
                            type="number"
                            min={0}
                            value={draftStockById[product.id] ?? String(product.stock)}
                            onChange={(event) => {
                              setDraftStockById((previous) => ({
                                ...previous,
                                [product.id]: event.target.value,
                              }));
                            }}
                            disabled={pending}
                            className="h-9 text-right"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending || product.stock === 0}
                            onClick={() => handleAdjustStock(product, -1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => handleAdjustStock(product, numericBulkStep)}
                          >
                            <Plus className="h-3.5 w-3.5" /> {numericBulkStep}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={pending}
                            onClick={() => handleSetStock(product)}
                          >
                            Set
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending || product.stock === 0}
                            onClick={() => handleClearStock(product)}
                          >
                            Clear
                          </Button>
                          <Button asChild type="button" size="sm" variant="outline" disabled={pending}>
                            <Link href={`/admin/products/${product.id}`}>Edit</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-500">No inventory rows match your current filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
