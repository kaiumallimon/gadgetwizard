"use client";

import Image from "next/image";
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
    CircleHelp,
    Package,
    ShoppingBag,
    ShoppingCart,
    Tag,
    UserRound,
    Users,
    Plus,
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
                        items: [
                            { href: "/admin", label: "Dashboard", icon: Home, exact: true },
                            { href: "/admin/activity", label: "System Monitoring", icon: BarChart3 },
                        ],
                    },
                    {
                        label: "Catalog",
                        items: [
                            { href: "/admin/products", label: "Products", icon: Package, exact: true },
                            { href: "/admin/inventory", label: "Inventory", icon: Boxes, exact: true },
                            { href: "/admin/categories", label: "Categories", icon: Boxes, exact: true },
                            { href: "/admin/brands", label: "Brands", icon: Tag, exact: true },
                        ]
                    },
                    {
                        label: "Merchandising",
                        items: [
                            { href: "/admin/banners", label: "Banners", icon: Megaphone },
                            { href: "/admin/faqs", label: "FAQs", icon: CircleHelp, exact: true },
                        ],
                    },
                    {
                        label: "Create New",
                        items: [
                            { href: "/admin/products/new", label: "Add Product", icon: Plus },
                            { href: "/admin/categories/new", label: "Add Category", icon: Plus, exact: true },
                            { href: "/admin/brands/new", label: "Add Brand", icon: Plus, exact: true },
                        ],
                    },
                    {
                        label: "Users",
                        items: [
                            { href: "/admin/users", label: "Admins", icon: UserRound },
                            { href: "/admin/customers", label: "Users", icon: Users },
                        ],
                    },
                    {
                        label: "Platform",
                        items: [
                            { href: "/admin/cdn", label: "CDN Management", icon: HardDrive },
                            { href: "/", label: "Storefront", icon: ShoppingBag, exact: true },
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

    const navItems = useMemo(() => nav.groups.flatMap((group) => group.items), [nav]);

    const normalizedPath = useMemo(() => {
        if (pathname !== "/" && pathname.endsWith("/")) {
            return pathname.slice(0, -1);
        }

        return pathname;
    }, [pathname]);

    const activeHref = useMemo(() => {
        let bestHref: string | null = null;
        let bestScore = -1;

        for (const item of navItems) {
            const candidate = item.href !== "/" && item.href.endsWith("/") ? item.href.slice(0, -1) : item.href;

            let score = -1;
            if (normalizedPath === candidate) {
                score = candidate.length + 1000;
            } else if (normalizedPath.startsWith(`${candidate}/`)) {
                score = candidate.length;
            }

            if (score > bestScore) {
                bestScore = score;
                bestHref = item.href;
            }
        }

        return bestHref;
    }, [navItems, normalizedPath]);

    const currentNavLabel = (() => {
        for (const group of nav.groups) {
            for (const item of group.items) {
                if (isActive(item)) {
                    return item.label;
                }
            }
        }

        return "Dashboard";
    })();

    async function onLogout() {
        try {
            await apiClient.logout();
        } finally {
            clearAuth();
            window.location.href = "/";
        }
    }

    function isActive(item: NavItem) {
        return activeHref === item.href;
    }

    function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
        return (
            <div className="flex h-full w-full flex-col overflow-hidden">
                <div className="w-full border-b border-zinc-200">
                    <div className="flex items-center gap-3 px-4 py-4">
                        {variant === "admin" ? (
                            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
                                <Image
                                    src="/nameless-logo.svg"
                                    alt="Admin"
                                    width={36}
                                    height={36}
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-linear-to-br from-[#f36523] to-red-500 text-white shadow-sm">
                                <LayoutGrid className="h-4 w-4" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-zinc-900">{nav.title}</p>
                            <p className="text-xs text-zinc-500">{nav.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-sidebar-scroll flex-1 space-y-4 overflow-y-auto p-3">
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
                                                    ? "bg-(--accent) text-white"
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

                <div className="w-full border-t border-zinc-200">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3">
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
        <div className="flex h-full overflow-hidden bg-zinc-50">
            <aside className="hidden h-full w-64 overflow-hidden border-r border-zinc-200 bg-white md:flex md:flex-col">
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

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
                    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/55 px-4 py-4 backdrop-blur">
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

                    <main className="px-4 py-5 md:px-6 md:py-6">{children}</main>
                    <Separator />
                </div>
            </Sheet>
        </div>
    );
}
