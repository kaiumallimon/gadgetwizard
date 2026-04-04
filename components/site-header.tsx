"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiGrid,
  FiLogOut,
  FiSearch,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function flattenCategories(items: Category[]): Category[] {
  const flat: Category[] = [];
  for (const item of items) {
    flat.push(item);
    if (item.children && item.children.length > 0) {
      flat.push(...flattenCategories(item.children));
    }
  }
  return flat;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [headerCategories, setHeaderCategories] = useState<Array<{ label: string; href: string }>>([]);
  const { session, user, token, setAuth, clearAuth } = useAuthStore();
  const dashboardHref = session?.role === "admin" ? "/admin" : "/dashboard";

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

    async function loadHeaderCategories() {
      try {
        const response = await apiClient.getCategories();
        if (!active) {
          return;
        }

        const selected = flattenCategories(response.items)
          .filter((category) => category.isHeaderCategory)
          .slice(0, 8)
          .map((category) => ({
            label: category.name,
            href: `/category/${category.slug}`,
          }));

        setHeaderCategories(selected);
      } catch {
        if (!active) {
          return;
        }
        setHeaderCategories([]);
      }
    }

    void syncSession();
    void loadHeaderCategories();
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

        <div className="relative hidden flex-1 md:block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input type="text" placeholder="Phones, tablets, accessories..." className="rounded-full pl-9" />
        </div>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/cart">
              <FiShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </Button>

          {session && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={dashboardHref}>
                <FiUser className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          )}

          {!loading && !user && (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">
                <FiUser className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}

          {!loading && user && (
            <Button type="button" onClick={onLogout} variant="outline" size="sm" className="rounded-full">
              <FiLogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </nav>
      </div>

      <div className="hidden border-t border-zinc-200 bg-white text-sm text-zinc-700 md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto px-6 py-2">
          {headerCategories.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 font-medium transition ${
                pathname === entry.href
                  ? "bg-orange-50 text-(--accent)"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {entry.label}
            </Link>
          ))}

          {headerCategories.length === 0 && (
            <span className="text-xs text-zinc-500">No header categories selected yet.</span>
          )}
        </div>
      </div>
    </header>
  );
}
