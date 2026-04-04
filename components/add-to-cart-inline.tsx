"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddToCartInlineProps {
  productId: number;
  stock: number;
}

export function AddToCartInline({ productId, stock }: AddToCartInlineProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const { session, token } = useAuthStore();
  const { setCart } = useCartStore();

  async function onAdd() {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setPending(true);
      const response = await apiClient.addToCart({ productId, quantity }, token ?? undefined);
      setCart(response.cart);
      router.push("/cart");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to add to cart");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="number"
        min={1}
        max={Math.max(stock, 1)}
        value={quantity}
        onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
        className="w-24"
      />
      <Button type="button" onClick={onAdd} disabled={pending || stock === 0}>
        {stock === 0 ? "Out Of Stock" : pending ? "Adding..." : "Add To Cart"}
      </Button>
    </div>
  );
}
