"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

export function SiteHeader() {
  const [loading, setLoading] = useState(true);
  const { session, user, token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    let active = true;

    async function syncSession() {
      try {
        const response = await apiClient.getMe(token ?? undefined);
        if (!active) {
          return;
        }

        setAuth({
          token: token ?? "",
          session: response.session,
          user: response.user,
        });
      } catch {
        if (!active) {
          return;
        }
        clearAuth();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void syncSession();
    return () => {
      active = false;
    };
  }, [token, setAuth, clearAuth]);

  async function onLogout() {
    try {
      await apiClient.logout();
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-(--surface-glass) backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          GadgetWizard
        </Link>

        <nav className="flex items-center gap-3 text-sm text-(--muted)">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/cart" className="hover:text-white">
            Cart
          </Link>

          {session && (
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
          )}

          {session?.role === "admin" && (
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          )}

          {!loading && !user && (
            <Link href="/login" className="rounded-full bg-white px-3 py-1 font-medium text-black">
              Login
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/40"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
