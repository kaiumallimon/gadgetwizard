/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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

function formatAud(value: number): string {
  return `AUD ${value.toLocaleString()}`;
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
  const displayPrice = hasDiscount ? (product.discountedPrice ?? product.originalPrice) : product.originalPrice;
  const discountAmount = hasDiscount ? Math.max(0, product.originalPrice - displayPrice) : 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const metaLabel = product.brandName ? `${product.brandName} | ${product.categoryName}` : product.categoryName;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-zinc-200/90 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-zinc-100 via-white to-orange-50">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="flex flex-wrap gap-1">
              {product.isNewArrival && <Badge className="bg-zinc-900 text-white hover:bg-zinc-900">New</Badge>}
              {product.isBestSeller && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Best Seller</Badge>}
            </div>
            {hasDiscount && discountAmount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Save {formatAud(discountAmount)}
              </Badge>
            )}
          </div>

          {product.stock === 0 && (
            <div className="absolute inset-0 grid place-items-center bg-zinc-950/55 backdrop-blur-[1px]">
              <span className="rounded-full border border-white/30 bg-zinc-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                Out Of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">{metaLabel}</p>
          <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-6 text-zinc-900 transition-colors hover:text-(--accent)">
            {product.name}
          </Link>
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/65 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-950">
              {formatAud(displayPrice)}
            </span>
            {hasDiscount && <span className="text-xs font-semibold text-red-500 line-through">{formatAud(product.originalPrice)}</span>}
          </div>

          {(hasDiscount || hasLoyal) && (
            <div className="flex flex-wrap gap-1">
              {hasDiscount && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Deal</Badge>}
              {hasLoyal && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Loyal {formatAud(product.loyalCustomerPrice)}
                </Badge>
              )}
              {isLowStock && <Badge variant="outline">Only {product.stock} left</Badge>}
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={onAddToCart}
          disabled={pending || product.stock === 0}
          className="cursor-pointer h-10 w-full rounded-xl text-sm font-semibold hover:bg-orange-300 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors"
        >
          {product.stock === 0 ? (
            "Out Of Stock"
          ) : pending ? (
            "Adding..."
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add To Cart
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
