"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Home,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type DashboardVariant = "admin" | "user";

interface DashboardShellProps {
  children: React.ReactNode;
  variant: DashboardVariant;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export function DashboardShell({ children, variant }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = useMemo(() => {
    if (variant === "admin") {
      return {
        title: "GadgetWizard",
        subtitle: "Admin Control Panel",
        groups: [
          {
            label: "Overview",
            items: [{ href: "/admin", label: "Dashboard", icon: Home, exact: true }],
          },
          {
            label: "Management",
            items: [
              { href: "/admin/categories", label: "Categories", icon: Boxes },
              { href: "/admin/products", label: "Products", icon: Package, exact: true },
              { href: "/admin/products/new", label: "Add Product", icon: Package },
              { href: "/admin/banners", label: "Banners", icon: Megaphone },
              { href: "/admin/users", label: "Users", icon: UserRound },
              { href: "/admin/activity", label: "System Monitoring", icon: BarChart3 },
            ],
          },
          {
            label: "Operations",
            items: [
              { href: "/", label: "Storefront", icon: ShoppingBag, exact: true },
              { href: "/cart", label: "Cart Monitor", icon: ShoppingCart },
            ],
          },
        ],
      };
    }

    return {
      title: "GadgetWizard",
      subtitle: "Member Dashboard",
      groups: [
        {
          label: "Overview",
          items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true }],
        },
        {
          label: "Shopping",
          items: [
            { href: "/", label: "Storefront", icon: ShoppingBag, exact: true },
            { href: "/cart", label: "My Cart", icon: ShoppingCart },
          ],
        },
      ],
    };
  }, [variant]);

  async function onLogout() {
    try {
      await apiClient.logout();
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  }

  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{nav.title}</p>
              <p className="text-xs text-zinc-500">{nav.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {nav.groups.map((group) => (
            <section key={group.label} className="space-y-2">
              <h3 className="px-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{group.label}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                        isActive(item)
                          ? "bg-[var(--accent)] text-white"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-zinc-200 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-lg p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {(user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-medium text-zinc-900">{user?.name ?? "Authenticated User"}</p>
                  <p className="truncate text-xs text-zinc-500">{user?.email ?? "Session active"}</p>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-72 border-r border-zinc-200 bg-white md:block">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Dashboard navigation links</SheetDescription>
          </SheetHeader>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>

              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input placeholder="Search products, categories, or banners" className="pl-9" />
              </div>

              <Badge variant="secondary" className="hidden md:inline-flex">
                {variant === "admin" ? "Admin Mode" : "Member Mode"}
              </Badge>
            </div>
          </header> */}

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
          <Separator />
        </div>
      </Sheet>
    </div>
  );
}
