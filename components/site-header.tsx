"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

export function SiteHeader() {
  const [loading, setLoading] = useState(true);
  const { session, user, token, setAuth, clearAuth } = useAuthStore();

  const quickCategories = [
    { label: "Apple Products", href: "/category/apple-products" },
    { label: "Phones", href: "/category/phones" },
    { label: "Tablets & Accessories", href: "/category/tablets-and-accessories" },
    { label: "Computer & Laptops", href: "/category/computer-and-laptops" },
    { label: "Gadgets & Accessories", href: "/category/gadgets-and-accessories" },
  ];

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
    <header className="sticky top-0 z-50 border-b border-black/20 bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-2xl font-semibold tracking-tight text-white">
          GadgetWizard
        </Link>

        <label className="hidden flex-1 items-center rounded-full bg-zinc-800/95 px-4 py-2 text-sm text-zinc-400 sm:flex">
          <span className="mr-2">Search</span>
          <input
            type="text"
            placeholder="Phones, tablets, accessories..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </label>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/cart" className="rounded-full border border-white/20 px-3 py-1 hover:border-white/40">
            Cart
          </Link>

          {session && (
            <Link href="/dashboard" className="rounded-full border border-white/20 px-3 py-1 hover:border-white/40">
              Dashboard
            </Link>
          )}

          {session?.role === "admin" && (
            <Link href="/admin" className="rounded-full border border-white/20 px-3 py-1 hover:border-white/40">
              Admin
            </Link>
          )}

          {!loading && !user && (
            <Link href="/login" className="rounded-full bg-(--accent) px-3 py-1 font-semibold text-black">
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

      <div className="hidden border-t border-white/10 bg-zinc-50 text-sm text-zinc-700 md:block">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-5 overflow-x-auto px-6 py-2">
          {quickCategories.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              className="whitespace-nowrap font-medium text-zinc-700 hover:text-black"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
