"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddToCartInlineProps {
  productId: number;
  stock: number;
  colorOptions?: string[];
}

export function AddToCartInline({ productId, stock, colorOptions = [] }: AddToCartInlineProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const { session, token } = useAuthStore();
  const { setCart } = useCartStore();
  const returnTo = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

  const normalizedColorOptions = useMemo(() => {
    const seen = new Set<string>();

    return colorOptions
      .map((entry) => entry.trim())
      .filter((entry) => {
        if (!entry) {
          return false;
        }

        const normalized = entry.toLowerCase();
        if (seen.has(normalized)) {
          return false;
        }

        seen.add(normalized);
        return true;
      });
  }, [colorOptions]);

  const [selectedColor, setSelectedColor] = useState<string | null>(normalizedColorOptions[0] ?? null);
  const maxQuantity = Math.max(stock, 1);

  useEffect(() => {
    setSelectedColor(normalizedColorOptions[0] ?? null);
  }, [normalizedColorOptions]);

  useEffect(() => {
    setQuantity((current) => Math.min(Math.max(current, 1), maxQuantity));
  }, [maxQuantity]);

  function clampQuantity(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.min(Math.max(1, Math.floor(value)), maxQuantity);
  }

  async function onAdd() {
    if (!session) {
      router.push(loginHref);
      return;
    }
    if (session.role === "admin") {
      window.alert("Admin accounts cannot add items to cart.");
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

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(maxQuantity, current + 1));
  }

  return (
    <div className="space-y-4">
      {normalizedColorOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Color</p>
          <div className="flex flex-wrap gap-2">
            {normalizedColorOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedColor(option)}
                aria-pressed={selectedColor === option}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedColor === option
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {selectedColor && <p className="text-xs text-zinc-500">Selected color: {selectedColor}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-11 items-center overflow-hidden rounded-full border border-zinc-300 bg-white">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={pending || stock === 0 || quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex h-full w-11 items-center justify-center text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            <Minus className="h-4 w-4" />
          </button>

          <Input
            type="number"
            min={1}
            max={maxQuantity}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
            className="h-full w-16 rounded-none border-x border-y-0 border-zinc-300 text-center [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            disabled={pending || stock === 0}
            aria-label="Quantity"
          />

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={pending || stock === 0 || quantity >= stock}
            aria-label="Increase quantity"
            className="inline-flex h-full w-11 items-center justify-center text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          type="button"
          onClick={onAdd}
          disabled={pending || stock === 0}
          className="h-11 rounded-full px-6 text-sm font-semibold"
        >
          {stock === 0 ? "Out Of Stock" : pending ? "Adding..." : "Add To Cart"}
        </Button>
      </div>

      <p className="text-xs text-zinc-500">
        {stock > 0 ? `${stock.toLocaleString()} available in stock` : "This item is currently unavailable"}
      </p>
    </div>
  );
}
