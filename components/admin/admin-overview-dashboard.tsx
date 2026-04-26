"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Boxes, ChartColumn, CircleAlert, Megaphone, Sparkles, Users } from "lucide-react";

import type { Banner, Category, Product } from "@/lib/client/types";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CartAction = "add" | "update" | "remove";

interface AdminOverviewDashboardProps {
  analytics: {
    totalUsers: number;
    totalProducts: number;
    cartActivity: Array<{ action: CartAction; total: number }>;
    businessAccountDistribution: Array<{ status: "pending" | "approved" | "rejected" | "none"; totalUsers: number }>;
  };
  categories: Category[];
  products: Product[];
  banners: Banner[];
}

const ACTION_COLORS: Record<CartAction, string> = {
  add: "#16a34a",
  update: "#2563eb",
  remove: "#ea580c",
};

const ACTION_LABELS: Record<CartAction, string> = {
  add: "Added",
  update: "Updated",
  remove: "Removed",
};

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatPercent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(1));
}

export function AdminOverviewDashboard({ analytics, categories, products, banners }: AdminOverviewDashboardProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateIn(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const totalCartEvents = useMemo(
    () => analytics.cartActivity.reduce((sum, item) => sum + item.total, 0),
    [analytics.cartActivity],
  );

  const cartByAction = useMemo(() => {
    const baseline: Record<CartAction, number> = {
      add: 0,
      update: 0,
      remove: 0,
    };

    for (const item of analytics.cartActivity) {
      baseline[item.action] = item.total;
    }

    return baseline;
  }, [analytics.cartActivity]);

  const activeProducts = products.filter((product) => product.isActive).length;
  const inactiveProducts = products.length - activeProducts;
  const lowStockProducts = products
    .filter((product) => product.stock > 0 && product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);
  const outOfStockProducts = products.filter((product) => product.stock === 0).length;
  const discountedProducts = products.filter(
    (product) => product.discountedPrice !== null && product.discountedPrice < product.originalPrice,
  ).length;

  const activeBanners = banners.filter((banner) => banner.isActive).length;

  const categoryRows = useMemo(() => {
    const categoryCount = new Map<string, number>();
    for (const product of products) {
      categoryCount.set(product.categoryName, (categoryCount.get(product.categoryName) ?? 0) + 1);
    }

    const total = products.length;

    return Array.from(categoryCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        share: formatPercent(count, total),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [products]);

  const businessRows = useMemo(() => {
    const totalUsers = analytics.businessAccountDistribution.reduce((sum, item) => sum + item.totalUsers, 0);

    return analytics.businessAccountDistribution.map((item) => {
      const labelByStatus: Record<typeof item.status, string> = {
        none: "Regular Users",
        pending: "Pending Business",
        approved: "Approved Business",
        rejected: "Rejected Business",
      };

      const colorByStatus: Record<typeof item.status, string> = {
        none: "#8b5cf6",
        pending: "#f59e0b",
        approved: "#16a34a",
        rejected: "#ef4444",
      };

      return {
        ...item,
        label: labelByStatus[item.status],
        color: colorByStatus[item.status],
        percent: formatPercent(item.totalUsers, totalUsers),
      };
    });
  }, [analytics.businessAccountDistribution]);

  const donutSegments = useMemo(() => {
    const ordered: Array<{ action: CartAction; total: number; percent: number; color: string }> = [
      { action: "add", total: cartByAction.add, percent: formatPercent(cartByAction.add, totalCartEvents), color: ACTION_COLORS.add },
      {
        action: "update",
        total: cartByAction.update,
        percent: formatPercent(cartByAction.update, totalCartEvents),
        color: ACTION_COLORS.update,
      },
      {
        action: "remove",
        total: cartByAction.remove,
        percent: formatPercent(cartByAction.remove, totalCartEvents),
        color: ACTION_COLORS.remove,
      },
    ];

    return ordered.filter((item) => item.total > 0);
  }, [cartByAction, totalCartEvents]);

  const donutBackground = useMemo(() => {
    if (donutSegments.length === 0) {
      return "#e4e4e7";
    }

    let cursor = 0;
    const stops = donutSegments.map((segment) => {
      const start = cursor;
      cursor += segment.percent;
      return `${segment.color} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [donutSegments]);

  const statsCards = [
    {
      title: "Total Users",
      value: formatNumber(analytics.totalUsers),
      hint: `${formatNumber(categories.filter((item) => item.isActive).length)} active categories`,
      icon: Users,
      accent: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      title: "Products",
      value: formatNumber(analytics.totalProducts),
      hint: `${formatNumber(activeProducts)} active, ${formatNumber(inactiveProducts)} inactive`,
      icon: Boxes,
      accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      title: "Live Banners",
      value: formatNumber(activeBanners),
      hint: `${formatNumber(banners.length)} total banner slots`,
      icon: Megaphone,
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      title: "Cart Interactions",
      value: formatNumber(totalCartEvents),
      hint: `${formatNumber(cartByAction.add)} add, ${formatNumber(cartByAction.update)} update`,
      icon: Activity,
      accent: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
    },
  ] as const;

  const quickLinks = [
    { href: "/admin/products", label: "Manage Products" },
    { href: "/admin/categories", label: "Manage Categories" },
    { href: "/admin/banners", label: "Manage Banners" },
    { href: "/admin/activity", label: "System Monitoring" },
  ];

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Business Overview</h1>
            <p className="mt-1 text-sm text-zinc-500">Clean analytics snapshot with catalog health and operational trends.</p>
          </div>
          <Badge className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Live analytics
          </Badge>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((item, index) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className={`transition-all duration-700 ${
                animateIn ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{item.title}</span>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ${item.accent}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                <p className="text-3xl font-semibold tracking-tight text-zinc-900">{item.value}</p>
                <p className="text-xs text-zinc-500">{item.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartColumn className="h-4 w-4" /> Cart Activity Split
            </CardTitle>
            <CardDescription>Add, update, and remove events from cart activity logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5">
              <div
                className={`relative h-36 w-36 shrink-0 rounded-full transition-all duration-700 ${
                  animateIn ? "scale-100 opacity-100" : "scale-90 opacity-0"
                }`}
                style={{ background: donutBackground }}
              >
                <div className="absolute inset-[18%] grid place-items-center rounded-full bg-white text-center shadow-inner">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Total</p>
                  <p className="text-lg font-semibold text-zinc-900">{formatNumber(totalCartEvents)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {(donutSegments.length > 0 ? donutSegments : [
                  { action: "add" as const, total: 0, percent: 0, color: "#a1a1aa" },
                ]).map((segment) => (
                  <div key={segment.action} className="flex items-center justify-between gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 text-zinc-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      {ACTION_LABELS[segment.action]}
                    </div>
                    <span className="font-medium text-zinc-900">{segment.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-zinc-50 px-2 py-2">
                <p className="text-zinc-500">Added</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{formatNumber(cartByAction.add)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-2 py-2">
                <p className="text-zinc-500">Updated</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{formatNumber(cartByAction.update)}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-2 py-2">
                <p className="text-zinc-500">Removed</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{formatNumber(cartByAction.remove)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Business Segments</CardTitle>
            <CardDescription>User distribution by business account status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessRows.length > 0 ? (
              businessRows.map((row, index) => (
                <div key={row.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium text-zinc-800">{row.label}</p>
                    <p className="text-zinc-500">{formatNumber(row.totalUsers)} users</p>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: animateIn ? `${row.percent}%` : "0%",
                        backgroundColor: row.color,
                        transitionDelay: `${index * 120}ms`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{row.percent}% share</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No business segment data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Catalog Health</CardTitle>
            <CardDescription>Inventory and merchandising status signals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-sm text-zinc-600">Out of stock</p>
              <p className="text-sm font-semibold text-zinc-900">{formatNumber(outOfStockProducts)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-sm text-zinc-600">{"Low stock (<=10)"}</p>
              <p className="text-sm font-semibold text-zinc-900">{formatNumber(lowStockProducts.length)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-sm text-zinc-600">Discounted products</p>
              <p className="text-sm font-semibold text-zinc-900">{formatNumber(discountedProducts)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-sm text-zinc-600">Active categories</p>
              <p className="text-sm font-semibold text-zinc-900">{formatNumber(categories.filter((item) => item.isActive).length)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Watchlist</CardTitle>
            <CardDescription>Products requiring restock attention soon.</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-zinc-900">{product.name}</TableCell>
                      <TableCell className="text-zinc-600">{product.categoryName}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={product.stock <= 3 ? "border-red-200 bg-red-50 text-red-700" : ""}
                        >
                          {product.stock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CircleAlert className="h-4 w-4" /> No low stock products right now.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Mix</CardTitle>
            <CardDescription>Top categories by product count share.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryRows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium text-zinc-900">{row.name}</TableCell>
                      <TableCell className="text-right text-zinc-700">{formatNumber(row.count)}</TableCell>
                      <TableCell className="text-right text-zinc-700">{row.share}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-zinc-500">Category mix will appear once products are available.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Quick Actions</h2>
            <p className="text-sm text-zinc-500">Jump into admin modules commonly used during daily operations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Button key={item.href} asChild variant="outline" className="rounded-xl">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
