/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";

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

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative h-44 w-full overflow-hidden">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-base font-semibold text-white hover:text-(--accent)">
          {product.name}
        </Link>
        <p className="text-sm text-(--muted)">{product.categoryName}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">৳ {product.price.toLocaleString()}</span>
          {product.discountedPrice !== null && (
            <span className="text-sm text-emerald-300">Loyal: ৳ {product.discountedPrice.toLocaleString()}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={pending || product.stock === 0}
          className="w-full rounded-xl bg-(--accent) px-4 py-2 font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {product.stock === 0 ? "Out Of Stock" : pending ? "Adding..." : "Add To Cart"}
        </button>
      </div>
    </article>
  );
}
