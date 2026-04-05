"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductListManagerProps {
  initialProducts: Product[];
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

export function ProductListManager({ initialProducts }: ProductListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialProducts);

  async function toggleActive(product: Product) {
    try {
      const response = await apiClient.adminUpdateProduct(
        product.id,
        {
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
          isActive: !product.isActive,
        },
        token ?? undefined,
      );

      setItems((previous) =>
        previous.map((entry) => (entry.id === product.id ? response.item : entry)),
      );
      toast.success(!product.isActive ? "Product activated." : "Product deactivated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update product status");
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.adminDeleteProduct(product.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== product.id));
      toast.success("Product deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete product");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
                <Badge variant={product.isActive ? "default" : "outline"}>{product.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-zinc-500">
                {product.categoryName}
                {product.brandName ? ` | ${product.brandName}` : ""}
                {` | Stock: ${product.stock}`}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm text-zinc-600">
                <p>Original: ৳ {product.originalPrice.toLocaleString()}</p>
                <p>Discounted: {product.discountedPrice ? `৳ ${product.discountedPrice.toLocaleString()}` : "N/A"}</p>
                <p>Loyal: ৳ {product.loyalCustomerPrice.toLocaleString()}</p>
              </div>
              <p className="line-clamp-3 text-sm text-zinc-600">{stripHtml(product.description)}</p>
              <p className="text-xs text-zinc-500">
                Specs: {countSpecificationEntries(product.specifications)}
              </p>
              {(product.isFeatured || product.isNewArrival || product.isBestSeller) && (
                <div className="flex flex-wrap gap-1">
                  {product.isFeatured && <Badge variant="secondary">Featured</Badge>}
                  {product.isNewArrival && <Badge variant="secondary">New</Badge>}
                  {product.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/products/${product.id}`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/product/${product.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(product)}>
                  <Power className="h-3.5 w-3.5" /> {product.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteProduct(product)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && <p className="text-sm text-zinc-500">No products found.</p>}
    </div>
  );
}
