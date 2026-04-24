"use client";

import { create } from "zustand";

import { apiClient } from "@/lib/client/api";
import type { Product } from "@/lib/client/types";

interface WishlistState {
  loadedForUserId: number | null;
  productIds: number[];
  items: Product[];
  loading: boolean;
  ensureLoaded: (input: { userId: number; token?: string }) => Promise<void>;
  setWishlist: (input: { userId: number; productIds: number[]; items: Product[] }) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  loadedForUserId: null,
  productIds: [],
  items: [],
  loading: false,
  ensureLoaded: async ({ userId, token }) => {
    const state = get();
    if (state.loading) {
      return;
    }

    if (state.loadedForUserId === userId) {
      return;
    }

    set({ loading: true });
    try {
      const response = await apiClient.getWishlist(token);
      set({
        loadedForUserId: userId,
        productIds: response.wishlist.productIds,
        items: response.wishlist.items,
      });
    } catch {
      set({ loadedForUserId: userId, productIds: [], items: [] });
    } finally {
      set({ loading: false });
    }
  },
  setWishlist: ({ userId, productIds, items }) => {
    set({
      loadedForUserId: userId,
      productIds,
      items,
    });
  },
  clearWishlist: () => {
    set({ loadedForUserId: null, productIds: [], items: [], loading: false });
  },
}));
