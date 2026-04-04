"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiBox,
  FiGrid,
  FiHeadphones,
  FiLogOut,
  FiMonitor,
  FiSearch,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiTablet,
  FiUser,
} from "react-icons/fi";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

export function SiteHeader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const { session, user, token, setAuth, clearAuth } = useAuthStore();

  const quickCategories = [
    { label: "Apple Products", href: "/category/apple-products", icon: FiBox },
    { label: "Phones", href: "/category/phones", icon: FiSmartphone },
    { label: "Tablets", href: "/category/tablets-and-accessories", icon: FiTablet },
    { label: "Computers", href: "/category/computer-and-laptops", icon: FiMonitor },
    { label: "Accessories", href: "/category/gadgets-and-accessories", icon: FiHeadphones },
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
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 text-zinc-900 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-(--accent) text-white shadow-sm">
            <FiGrid className="h-4 w-4" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-zinc-900 group-hover:text-(--accent)">
            GadgetWizard
          </span>
        </Link>

        <label className="hidden flex-1 items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500 md:flex">
          <FiSearch className="mr-2 h-4 w-4" />
          <input
            type="text"
            placeholder="Phones, tablets, accessories..."
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
          />
        </label>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 hover:border-zinc-400"
          >
            <FiShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {session && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 hover:border-zinc-400"
            >
              <FiUser className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          {session?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 hover:border-zinc-400"
            >
              <FiShield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {!loading && !user && (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-(--accent) px-3 py-1.5 font-semibold text-white hover:brightness-95"
            >
              <FiUser className="h-4 w-4" />
              Login
            </Link>
          )}

          {!loading && user && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
            >
              <FiLogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </nav>
      </div>

      <div className="hidden border-t border-zinc-200 bg-white text-sm text-zinc-700 md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto px-6 py-2">
          {quickCategories.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 font-medium transition ${
                pathname === entry.href
                  ? "bg-orange-50 text-(--accent)"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <entry.icon className="h-4 w-4" />
              {entry.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
