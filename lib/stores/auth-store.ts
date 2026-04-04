"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AppUser, AuthSession } from "@/lib/client/types";

interface AuthState {
  token: string | null;
  session: AuthSession | null;
  user: AppUser | null;
  setAuth: (payload: { token: string; session: AuthSession; user: AppUser }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      session: null,
      user: null,
      setAuth: (payload) =>
        set({
          token: payload.token,
          session: payload.session,
          user: payload.user,
        }),
      clearAuth: () =>
        set({
          token: null,
          session: null,
          user: null,
        }),
    }),
    {
      name: "gw-auth",
    },
  ),
);
