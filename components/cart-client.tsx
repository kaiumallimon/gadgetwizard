"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";

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
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const { token } = useAuthStore();
  const { cart, setCart } = useCartStore();
  const selectionInitializedRef = useRef(false);

  const activeCart = cart ?? initialCart;

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart, setCart]);

  useEffect(() => {
    const activeItemIds = activeCart.items.map((item) => item.productId);

    if (!selectionInitializedRef.current) {
      setSelectedProductIds(activeItemIds);
      selectionInitializedRef.current = true;
      return;
    }

    setSelectedProductIds((current) => current.filter((productId) => activeItemIds.includes(productId)));
  }, [activeCart.items]);

  const selectedItems = useMemo(
    () => activeCart.items.filter((item) => selectedProductIds.includes(item.productId)),
    [activeCart.items, selectedProductIds],
  );

  const total = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const effectivePrice = item.appliedDiscountedPrice ?? item.unitPrice;
      return acc + effectivePrice * item.quantity;
    }, 0);
  }, [selectedItems]);

  const checkoutHref = useMemo(() => {
    if (selectedProductIds.length === 0) {
      return "/checkout";
    }

    const params = new URLSearchParams();
    params.set("selected", selectedProductIds.join(","));
    return `/checkout?${params.toString()}`;
  }, [selectedProductIds]);

  function toggleSelection(productId: number) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

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
        <Card
          key={item.id}
          className={selectedProductIds.includes(item.productId) ? "border-orange-200 bg-orange-50/30" : undefined}
        >
          <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleSelection(item.productId)}
                aria-pressed={selectedProductIds.includes(item.productId)}
                aria-label={selectedProductIds.includes(item.productId) ? `Deselect ${item.productName}` : `Select ${item.productName}`}
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                  selectedProductIds.includes(item.productId)
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-zinc-300 bg-white text-transparent hover:border-orange-300"
                }`}
              >
                <FiCheck className="h-4 w-4" />
              </button>
              {item.productImages[0] ? (
                <img
                  src={item.productImages[0]}
                  alt={item.productName}
                  className="h-14 w-14 shrink-0 rounded-md border border-zinc-200 bg-white object-cover"
                />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-zinc-200 bg-zinc-100 text-lg font-semibold text-zinc-600">
                  {item.productName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-zinc-900">{item.productName}</p>
                <p className="text-sm text-zinc-600">
                Unit: ${(item.appliedDiscountedPrice ?? item.unitPrice).toLocaleString()} | Stock: {item.stock}
                </p>
              </div>
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
              <input
                type="number"
                min={1}
                max={item.stock}
                value={item.quantity}
                onChange={(event) => {
                  const nextQuantity = Number(event.target.value);
                  if (Number.isNaN(nextQuantity)) return;
                  updateQuantity(item.productId, Math.max(1, Math.min(item.stock, nextQuantity)));
                }}
                disabled={busyItemId === item.productId}
                className="h-10 w-16 rounded-md border border-zinc-300 bg-white px-2 text-center text-sm text-zinc-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              />
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
            <p className="text-sm text-emerald-700">Selected Total</p>
            <p className="text-2xl font-semibold text-emerald-900">${total.toLocaleString()}</p>
            <p className="text-xs text-emerald-700">
              {selectedItems.length} of {activeCart.items.length} items selected
            </p>
          </div>
          {selectedItems.length > 0 ? (
            <Button asChild size="lg" className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600">
              <Link href={checkoutHref}>Proceed to Checkout</Link>
            </Button>
          ) : (
            <Button size="lg" className="rounded-full bg-orange-500 px-6 text-white" disabled>
              Select items to checkout
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
