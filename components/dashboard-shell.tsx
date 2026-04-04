"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
    BarChart3,
    Boxes,
    ChevronDown,
    HardDrive,
    Home,
    LayoutGrid,
    LogOut,
    Menu,
    Megaphone,
    Package,
    Shield,
    ShoppingBag,
    ShoppingCart,
    UserRound,
} from "lucide-react";

import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                        label: "Product",
                        items: [
                            { href: "/admin/products", label: "Products", icon: Package, exact: true },
                            { href: "/admin/products/new", label: "Add Product", icon: Package },
                        ]
                    },
                    {
                        label: "Categories & Banners",
                        items: [
                            { href: "/admin/categories", label: "Categories", icon: Boxes },
                            { href: "/admin/banners", label: "Banners", icon: Megaphone },
                        ],
                    },
                    {
                        label: "Infrastructure",
                        items: [
                            { href: "/admin/cdn", label: "CDN Management", icon: HardDrive },
                        ],
                    },
                    {
                        label: "User Management",
                        items: [
                            { href: "/admin/users", label: "Users", icon: UserRound },
                        ],
                    },
                    {
                        label: "Operations",
                        items: [
                            { href: "/", label: "Storefront", icon: ShoppingBag, exact: true },
                            { href: "/cart", label: "Cart Monitor", icon: ShoppingCart },
                        ],
                    },
                    {
                        label: "System",
                        items: [
                            { href: "/admin/activity", label: "System Monitoring", icon: BarChart3 },

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

    const currentNavLabel = useMemo(() => {
        for (const group of nav.groups) {
            for (const item of group.items) {
                if (isActive(item)) {
                    return item.label;
                }
            }
        }

        return "Dashboard";
    }, [nav, pathname]);

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
        <div className="flex h-screen overflow-hidden bg-zinc-50">
            <aside className="hidden h-screen w-64 overflow-hidden border-r border-zinc-200 bg-white md:flex">
                <SidebarContent />
            </aside>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation</SheetTitle>
                        <SheetDescription>Dashboard navigation links</SheetDescription>
                    </SheetHeader>
                    <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileOpen(true)}
                            >
                                <Menu className="h-4 w-4" />
                                <span className="sr-only">Open dashboard menu</span>
                            </Button>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-900">{currentNavLabel}</p>
                                <p className="truncate text-xs text-zinc-500">{nav.subtitle}</p>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">{children}</main>
                    <Separator />
                </div>
            </Sheet>
        </div>
    );
}
