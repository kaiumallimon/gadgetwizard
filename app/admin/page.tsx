import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, Boxes, Megaphone, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminDashboardBundle } from "@/lib/server/services/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const { analytics, categories, products, banners } = await getAdminDashboardBundle();

  const quickLinks = [
    { href: "/admin/categories", label: "Categories", description: "Create, update, delete, and pin header categories." },
    { href: "/admin/brands", label: "Brands", description: "Manage brand logos, visibility, and sort order." },
    { href: "/admin/brands/new", label: "Add Brand", description: "Create new brands that can be assigned in product forms." },
    { href: "/admin/products", label: "Products", description: "View, update, and delete catalog products." },
    {
      href: "/admin/products/new",
      label: "Add Product",
      description: "Use rich-text descriptions and key/value specifications when creating products.",
    },
    { href: "/admin/banners", label: "Banners", description: "Manage homepage campaigns with one responsive image source." },
    { href: "/admin/cdn", label: "CDN", description: "Upload media assets and view detailed CDN statistics." },
    { href: "/admin/users", label: "Admins", description: "Create and manage admin accounts and access state." },
    { href: "/admin/customers", label: "Users", description: "Ban or unban regular users and control login access." },
    {
      href: "/admin/activity",
      label: "System Monitoring",
      description: "Track who is doing what with event timelines and activity pages.",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Catalog, Banner, and Analytics Control</h1>
          </div>
          <Badge>Live Admin Mode</Badge>
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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{analytics.totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4" /> Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{analytics.totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" /> Banners
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{banners.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> Cart Events
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">
            {analytics.cartActivity.reduce((sum, item) => sum + item.total, 0)}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle className="text-lg">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-600">{item.description}</p>
              <Button asChild variant="outline" className="w-full justify-center">
                <Link href={item.href}>Open {item.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Categories</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{categories.filter((item) => item.isActive).length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catalog Items</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{products.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Logged Events
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {analytics.cartActivity.reduce((sum, item) => sum + item.total, 0)}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
