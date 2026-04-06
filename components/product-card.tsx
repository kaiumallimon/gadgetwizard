/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { session, token } = useAuthStore();
  const { setCart } = useCartStore();

  async function onAddToCart() {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setPending(true);
      const response = await apiClient.addToCart({ productId: product.id, quantity: 1 }, token ?? undefined);
      setCart(response.cart);
      router.push("/cart");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add to cart";
      window.alert(message);
    } finally {
      setPending(false);
    }
  }

  const image = product.images[0] ?? "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200";
  const hasDiscount = product.discountedPrice !== null && product.discountedPrice < product.originalPrice;
  const hasLoyal = product.loyalCustomerPrice < product.originalPrice;

  return (
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative h-44 w-full overflow-hidden">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-base font-semibold text-zinc-900 hover:text-(--accent)">
          {product.name}
        </Link>
        <p className="text-sm text-zinc-500">{product.brandName ? `${product.brandName} | ` : ""}{product.categoryName}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-zinc-900">
              AUD {(hasDiscount ? product.discountedPrice : product.originalPrice)?.toLocaleString()}
            </span>
            {hasDiscount && <span className="text-xs text-zinc-500 line-through">AUD {product.originalPrice.toLocaleString()}</span>}
          </div>
          {(hasDiscount || hasLoyal) && (
            <div className="flex flex-wrap gap-1">
              {hasDiscount && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Deal</Badge>}
              {hasLoyal && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Loyal AUD {product.loyalCustomerPrice.toLocaleString()}
                </Badge>
              )}
              {product.isNewArrival && <Badge variant="outline">New</Badge>}
            </div>
          )}
        </div>
        <Button type="button" onClick={onAddToCart} disabled={pending || product.stock === 0} className="w-full">
          {product.stock === 0 ? "Out Of Stock" : pending ? "Adding..." : "Add To Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
