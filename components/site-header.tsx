"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiChevronRight,
  FiHeadphones,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiShield,
  FiSearch,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthDialog } from "@/components/auth-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "signup">("login");
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
      await signOut({ redirect: false });
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  }

  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (!user && (authParam === "login" || authParam === "signup")) {
      setAuthDialogMode(authParam);
      setAuthDialogOpen(true);
    }
  }, [searchParams, user]);

  function onAuthDialogChange(nextOpen: boolean) {
    setAuthDialogOpen(nextOpen);

    if (!nextOpen) {
      const authParam = searchParams.get("auth");
      if (authParam === "login" || authParam === "signup") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("auth");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
    }
  }

  return (
    <header className="gw-soft-border-light sticky top-0 z-50 border-b">
      <div className="bg-(--accent) text-zinc-950">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs sm:px-6 sm:py-2">
          <div className="flex w-full items-center justify-center gap-2 md:w-auto md:justify-start">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none text-zinc-950/90">
              <FiTruck className="h-3.5 w-3.5 text-zinc-950/80" /> Free delivery on selected products
            </span>
            <span className="hidden items-center gap-1.5 leading-none text-zinc-950/80 sm:inline-flex">
              <FiShield className="h-3.5 w-3.5 text-zinc-950/80" /> Secure payments
            </span>
            <span className="hidden items-center gap-1.5 leading-none text-zinc-950/80 lg:inline-flex">
              <FiPackage className="h-3.5 w-3.5 text-zinc-950/80" /> Fast order tracking
            </span>
          </div>

          <div className="hidden items-center gap-3 md:inline-flex">
            <span className="hidden items-center gap-1.5 text-zinc-950/80 md:inline-flex">
              <FiHeadphones className="h-3.5 w-3.5 text-zinc-950/80" /> Support: +880 1712-345678
            </span>

            {/* {!loading && !user && (
              <>
                <button
                  type="button"
                  className="font-medium text-zinc-950/90 hover:text-black"
                  onClick={() => {
                    setAuthDialogMode("login");
                    setAuthDialogOpen(true);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="font-semibold text-black hover:text-zinc-800"
                  onClick={() => {
                    setAuthDialogMode("signup");
                    setAuthDialogOpen(true);
                  }}
                >
                  Create Account
                </button>
              </>
            )} */}
          </div>
        </div>
      </div>

      <div className="bg-black text-zinc-100">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="group flex shrink-0 items-center">
              <Image
                src="/logo-black-surfacce.svg"
                alt="GadgetWizard"
                width={308}
                height={60}
                priority
                style={{ width: "auto" }}
                className="h-11 w-auto sm:h-15"
              />
            </Link>

            <div className="order-3 w-full md:order-0 md:flex-1">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search phones, tablets, accessories..."
                  className="gw-soft-border-dark h-10 rounded-full border bg-zinc-900 pl-9 text-zinc-100 placeholder:text-zinc-500 focus-visible:bg-zinc-950"
                />
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gw-soft-border-dark ml-auto inline-flex rounded-full border bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
                >
                  <FiMenu className="h-4 w-4" /> Menu
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="gw-soft-border-dark w-[88vw] max-w-sm border bg-white/85 p-0 backdrop-blur-2xl"
              >
                <SheetHeader className="gw-soft-border-dark border-b bg-white/70 px-5 py-4">
                  <SheetTitle className="text-base">Browse GadgetWizard</SheetTitle>
                  <SheetDescription className="text-xs">
                    Quick actions and category links in one place.
                  </SheetDescription>
                </SheetHeader>

                <div className="max-h-[calc(100vh-84px)] space-y-5 overflow-y-auto px-5 py-4">
                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Quick Actions</p>

                    <div className="grid gap-2">
                      <SheetClose asChild>
                        <Button
                          asChild
                          variant="outline"
                          className="gw-soft-border-dark justify-start rounded-xl border bg-white/70 text-zinc-800 hover:bg-zinc-50"
                        >
                          <Link href="/cart">
                            <FiShoppingCart className="h-4 w-4" /> Cart
                          </Link>
                        </Button>
                      </SheetClose>

                      {session && (
                        <SheetClose asChild>
                          <Button
                            asChild
                            variant="outline"
                            className="gw-soft-border-dark justify-start rounded-xl border bg-white/70 text-zinc-800 hover:bg-zinc-50"
                          >
                            <Link href={dashboardHref}>
                              <FiUser className="h-4 w-4" /> Dashboard
                            </Link>
                          </Button>
                        </SheetClose>
                      )}

                      {!loading && !user && (
                        <SheetClose asChild>
                          <Button
                            type="button"
                            className="justify-start rounded-xl"
                            onClick={() => {
                              setAuthDialogMode("login");
                              setAuthDialogOpen(true);
                            }}
                          >
                            <FiUser className="h-4 w-4" /> Login
                          </Button>
                        </SheetClose>
                      )}

                      {!loading && user && (
                        <Button
                          type="button"
                          variant="outline"
                          className="gw-soft-border-dark justify-start rounded-xl border bg-white/70 text-zinc-800 hover:bg-zinc-50"
                          onClick={onLogout}
                        >
                          <FiLogOut className="h-4 w-4" /> Logout
                        </Button>
                      )}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Categories</p>

                    {headerCategories.length > 0 ? (
                      <div className="grid gap-2">
                        {headerCategories.map((entry) => (
                          <SheetClose asChild key={entry.label}>
                            <Link
                              href={entry.href}
                              className={`gw-soft-border-dark flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                                pathname === entry.href
                                  ? "gw-soft-ring-accent bg-zinc-100 text-(--accent)"
                                  : "bg-white/70 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                              }`}
                            >
                              <span>{entry.label}</span>
                              <FiChevronRight className="h-4 w-4 opacity-70" />
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No header categories selected yet.</p>
                    )}
                  </section>

                  <div className="gw-soft-border-dark rounded-xl border bg-white/70 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Support</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                      <FiHeadphones className="h-4 w-4 text-(--accent)" /> +880 1712-345678
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <nav className="ml-auto hidden items-center gap-2 text-sm sm:gap-3 md:flex">
              <Button asChild variant="outline" size="sm" className="gw-soft-border-dark rounded-full border bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100">
                <Link href="/cart">
                  <FiShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                </Link>
              </Button>

              {session && (
                <Button asChild variant="outline" size="sm" className="gw-soft-border-dark rounded-full border bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100">
                  <Link href={dashboardHref}>
                    <FiUser className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
              )}

              {!loading && !user && (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setAuthDialogMode("login");
                    setAuthDialogOpen(true);
                  }}
                >
                  <FiUser className="h-4 w-4" />
                  Login
                </Button>
              )}

              {!loading && user && (
                <Button type="button" onClick={onLogout} variant="outline" size="sm" className="gw-soft-border-dark rounded-full border bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100">
                  <FiLogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="gw-soft-border-light hidden border-t bg-white text-sm text-zinc-700 md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {headerCategories.map((entry) => (
            <Link
              key={entry.label}
              href={entry.href}
              className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                pathname === entry.href
                  ? "gw-soft-ring-accent bg-orange-50 text-(--accent)"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {entry.label} <FiChevronRight className="h-3.5 w-3.5 opacity-70" />
            </Link>
          ))}

          {headerCategories.length === 0 && (
            <span className="text-xs text-zinc-500">No header categories selected yet.</span>
          )}
        </div>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={onAuthDialogChange}
        mode={authDialogMode}
        onModeChange={setAuthDialogMode}
      />
    </header>
  );
}
