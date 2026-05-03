import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Shield, ShoppingCart, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getCurrentUser } from "@/lib/server/services/auth-service";
import { getCartForUser } from "@/lib/server/services/cart-service";
import { getUserOrders } from "@/lib/server/services/order-service";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect(buildLoginRedirect("/dashboard"));
  }
  if (session.role === "admin") {
    redirect("/admin");
  }

  const [user, cart, orders] = await Promise.all([
    getCurrentUser(session.userId),
    getCartForUser(session.userId),
    getUserOrders(session.userId),
  ]);

  const cartItemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">User Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Welcome back, {user.name}</h1>
            <p className="mt-2 text-zinc-600">
              Business account status: {user.businessAccountStatus ? user.businessAccountStatus : "not applied"}.
            </p>
          </div>
          <Badge variant="secondary">{user.role}</Badge>
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> Role
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold text-zinc-900">{user.role}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" /> Cart Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold text-zinc-900">{cartItemCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Business Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold text-zinc-900">
            {user.businessAccountStatus ? user.businessAccountStatus.toUpperCase() : "NONE"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Purchase History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold text-zinc-900">{orders.length}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Continue shopping or manage your account tools.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/cart">Manage Cart</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">My Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Browse Storefront</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/addresses">Saved Addresses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/business-account">Business Account</Link>
          </Button>
          {user.role === "admin" && (
            <Button asChild variant="secondary">
              <Link href="/admin">Open Admin Dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
