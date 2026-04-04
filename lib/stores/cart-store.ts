"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Cart } from "@/lib/client/types";

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
    }),
    {
      name: "gw-cart",
    },
  ),
);
