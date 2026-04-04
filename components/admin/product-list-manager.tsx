"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Power, Trash2 } from "lucide-react";

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

export function ProductListManager({ initialProducts }: ProductListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialProducts);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggleActive(product: Product) {
    try {
      const response = await apiClient.adminUpdateProduct(
        product.id,
        {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          discountedPrice: product.discountedPrice,
          stock: product.stock,
          categoryId: product.categoryId,
          images: product.images,
          specifications: product.specifications,
          isActive: !product.isActive,
        },
        token ?? undefined,
      );

      setItems((previous) =>
        previous.map((entry) => (entry.id === product.id ? response.item : entry)),
      );
      setNotice(!product.isActive ? "Product activated." : "Product deactivated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update product status");
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
      setNotice("Product deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete product");
    }
  }

  return (
    <div className="space-y-4">
      {notice && <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{notice}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
                <Badge variant={product.isActive ? "default" : "outline"}>{product.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-zinc-500">{product.categoryName} | Stock: {product.stock}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-600">Price: ৳ {product.price.toLocaleString()}</p>
              <p className="line-clamp-3 text-sm text-zinc-600">{stripHtml(product.description)}</p>
              <p className="text-xs text-zinc-500">
                Specs: {product.specifications ? Object.keys(product.specifications).length : 0}
              </p>

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
