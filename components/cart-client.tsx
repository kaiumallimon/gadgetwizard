"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/client/api";
import type { Cart } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";

interface CartClientProps {
  initialCart: Cart;
}

export function CartClient({ initialCart }: CartClientProps) {
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const { token } = useAuthStore();
  const { cart, setCart } = useCartStore();

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart, setCart]);

  const activeCart = cart ?? initialCart;

  const total = useMemo(() => {
    return activeCart.items.reduce((acc, item) => {
      const effectivePrice = item.appliedDiscountedPrice ?? item.unitPrice;
      return acc + effectivePrice * item.quantity;
    }, 0);
  }, [activeCart.items]);

  async function updateQuantity(productId: number, quantity: number) {
    try {
      setBusyItemId(productId);
      const response = await apiClient.updateCart({ productId, quantity }, token ?? undefined);
      setCart(response.cart);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update quantity");
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(productId: number) {
    try {
      setBusyItemId(productId);
      const response = await apiClient.removeFromCart(productId, token ?? undefined);
      setCart(response.cart);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to remove item");
    } finally {
      setBusyItemId(null);
    }
  }

  if (activeCart.items.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-(--muted)">Your cart is currently empty.</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-(--accent) px-5 py-2 font-medium text-black">
          Explore Products
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {activeCart.items.map((item) => (
        <article key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-medium text-white">{item.productName}</p>
            <p className="text-sm text-(--muted)">
              Unit: ৳ {(item.appliedDiscountedPrice ?? item.unitPrice).toLocaleString()} | Stock: {item.stock}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
              disabled={busyItemId === item.productId}
              className="h-9 w-9 rounded-full border border-white/20 text-white"
            >
              -
            </button>
            <span className="min-w-8 text-center">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
              disabled={busyItemId === item.productId || item.quantity >= item.stock}
              className="h-9 w-9 rounded-full border border-white/20 text-white"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              disabled={busyItemId === item.productId}
              className="rounded-full border border-red-300/30 px-3 py-1 text-red-200"
            >
              Remove
            </button>
          </div>
        </article>
      ))}

      <div className="rounded-2xl border border-emerald-200/20 bg-emerald-100/10 p-4 text-right">
        <p className="text-sm text-(--muted)">Cart Total</p>
        <p className="text-2xl font-semibold text-white">৳ {total.toLocaleString()}</p>
      </div>
    </section>
  );
}
