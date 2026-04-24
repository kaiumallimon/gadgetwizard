"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/client/api";
import type { Cart } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-zinc-600">Your cart is currently empty.</p>
          <Button asChild className="mt-4">
            <Link href="/">Explore Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      {activeCart.items.map((item) => (
        <Card key={item.id}>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-medium text-zinc-900">{item.productName}</p>
              <p className="text-sm text-zinc-600">
              Unit: ${(item.appliedDiscountedPrice ?? item.unitPrice).toLocaleString()} | Stock: {item.stock}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
              disabled={busyItemId === item.productId}
            >
              -
              </Button>
              <span className="min-w-8 text-center">{item.quantity}</span>
              <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
              disabled={busyItemId === item.productId || item.quantity >= item.stock}
            >
              +
              </Button>
              <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeItem(item.productId)}
              disabled={busyItemId === item.productId}
            >
              Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-emerald-700">Cart Total</p>
            <p className="text-2xl font-semibold text-emerald-900">${total.toLocaleString()}</p>
          </div>
          <Button asChild size="lg" className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
