"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Boxes,
    ChevronDown,
    ClipboardList,
    HardDrive,
    Home,
    LayoutGrid,
    LogOut,
    MapPin,
    Menu,
    Megaphone,
    CircleHelp,
    Package,
    Building2,
    ShoppingBag,
    ShoppingCart,
    Star,
    Heart,
    Tag,
    MessageCircle,
    Mail,
    UserRound,
    Users,
    Plus,
    ExternalLink,
    Activity,
    RotateCcw,
} from "lucide-react";

import { useAuthStore } from "@/lib/stores/auth-store";
import { apiClient } from "@/lib/client/api";
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
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const [paidOrdersCount, setPaidOrdersCount] = useState(0);
    const isLiveChatRoute = variant === "admin" && pathname === "/admin/live-chat";

    const refreshChatUnreadCount = useCallback(async () => {
        if (variant !== "admin") {
            return;
        }

        try {
            const response = await apiClient.getChatUnreadCount();
            setChatUnreadCount(response.count);
        } catch {
            setChatUnreadCount(0);
        }
    }, [variant]);

    useEffect(() => {
        if (variant !== "admin") {
            return;
        }

        void refreshChatUnreadCount();
        const paidOrdersStream = new EventSource("/api/admin/orders/paid-count/stream");

        const stream = new EventSource("/api/chat/stream");

        stream.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as { type?: string };
                if (payload.type === "message.created" || payload.type === "messages.read" || payload.type === "conversation.created") {
                    void refreshChatUnreadCount();
                }
            } catch {
                // ignore malformed payloads
            }
        };

        stream.onerror = () => {
            // best-effort live updates; the next successful refresh will correct the badge
        };

        paidOrdersStream.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as { count?: number };
                if (typeof payload.count === "number") {
                    setPaidOrdersCount(payload.count);
                }
            } catch {
                // ignore malformed payloads
            }
        };

        paidOrdersStream.onerror = () => {
            paidOrdersStream.close();
        };

        return () => {
            stream.close();
            paidOrdersStream.close();
        };
    }, [refreshChatUnreadCount, variant]);

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
                            { href: "/admin/revenue", label: "Revenue Insights", icon: BarChart3 },
                            { href: "/admin/activity", label: "System Monitoring", icon: Activity },
                            { href: "/", label: "View Storefront", icon: ExternalLink, exact: true }, // Changed icon for clarity
                        ],
                    },
                    {
                        label: "Catalog",
                        items: [
                            { href: "/admin/products", label: "Products", icon: Package },
                            { href: "/admin/inventory", label: "Inventory", icon: Boxes },
                            { href: "/admin/categories", label: "Categories", icon: LayoutGrid }, // Different icon to distinguish from Inventory
                            { href: "/admin/brands", label: "Brands", icon: Tag },
                        ],
                    },
                    {
                        label: "Sales & CRM",
                        items: [
                            { href: "/admin/orders", label: "Orders", icon: ClipboardList },
                            { href: "/admin/refunds", label: "Refunds", icon: RotateCcw },
                            { href: "/admin/business-accounts", label: "Business Requests", icon: Building2 },
                            { href: "/admin/customers", label: "Customers", icon: Users }, // Moved from "Users" group
                            { href: "/admin/live-chat", label: "Live Chat", icon: MessageCircle },
                        ],
                    },
                    {
                        label: "Marketing",
                        items: [
                            { href: "/admin/banners", label: "Banners", icon: Megaphone },
                            { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
                            { href: "/admin/reviews", label: "Customer Reviews", icon: Star }, // Moved from Orders
                            { href: "/admin/wishlist", label: "Wishlist Insights", icon: Heart }, // Moved from Orders
                        ],
                    },
                    {
                        label: "Management",
                        items: [
                            { href: "/admin/users", label: "Admin Team", icon: UserRound }, // Specific icon for clarity
                            { href: "/admin/faqs", label: "Help & FAQs", icon: CircleHelp },
                            { href: "/admin/cdn", label: "CDN Assets", icon: HardDrive },
                        ],
                    },
                ],
            };
        }

        return {
            title: "GadgetWizard",
            subtitle: "Customer Dashboard",
            groups: [
                {
                    label: "Overview",
                    items: [
                        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
                        { href: "/", label: "Storefront", icon: ShoppingBag, exact: true },
                    ],
                },
                {
                    label: "My Activity",
                    items: [
                        { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
                        { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
                        { href: "/cart", label: "Cart", icon: ShoppingCart },
                    ],
                },
                {
                    label: "Settings",
                    items: [
                        { href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
                        { href: "/dashboard/business-account", label: "Business Account", icon: Building2 },
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
            await signOut({ redirect: false });
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

                        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
                            <Image
                                src="/nameless-logo.svg"
                                alt="Admin"
                                width={36}
                                height={36}
                                className="h-8 w-8 object-contain"
                            />
                        </div>

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
                                    const showChatBadge = variant === "admin" && item.href === "/admin/live-chat" && chatUnreadCount > 0;
                                    const showPaidOrdersBadge = variant === "admin" && item.href === "/admin/orders" && paidOrdersCount > 0;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                                                isActive(item)
                                                    ? "bg-accent text-white"
                                                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                            {showChatBadge ? (
                                                <span className="ml-auto inline-flex min-w-6 items-center justify-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                                    <span>{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
                                                </span>
                                            ) : null}
                                            {showPaidOrdersBadge ? (
                                                <span className="ml-auto inline-flex min-w-6 items-center justify-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                                    <span>{paidOrdersCount > 99 ? "99+" : paidOrdersCount}</span>
                                                </span>
                                            ) : null}
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

                <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", isLiveChatRoute ? "overflow-hidden" : "overflow-y-auto")}>
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

                    <main className={cn("px-4 py-5 md:px-6 md:py-6", isLiveChatRoute && "flex-1 min-h-0 overflow-hidden")}>{children}</main>
                    <Separator />
                </div>
            </Sheet>
        </div>
    );
}
