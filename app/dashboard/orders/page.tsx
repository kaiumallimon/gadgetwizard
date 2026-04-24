import Link from "next/link";
import { redirect } from "next/navigation";
import { FiPackage, FiChevronRight, FiShoppingBag } from "react-icons/fi";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getUserOrders } from "@/lib/server/services/order-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid:            { label: "Paid",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  processing:      { label: "Processing",      className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  shipped:         { label: "Shipped",         className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered:       { label: "Delivered",       className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled:       { label: "Cancelled",       className: "bg-red-100 text-red-800 border-red-200" },
  refunded:        { label: "Refunded",        className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export default async function DashboardOrdersPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const orders = await getUserOrders(session.userId);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">My Orders</h1>
            <p className="mt-2 text-sm text-zinc-600">Track your purchase history and order status.</p>
          </div>
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
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <FiShoppingBag className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-700">No orders yet</p>
              <p className="text-sm text-zinc-500">Your completed orders will appear here.</p>
            </div>
            <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-zinc-100 text-zinc-700 border-zinc-200" };
            const previewItem = order.items[0];
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <Card className="transition hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                      {previewItem?.productImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewItem.productImageUrl}
                          alt={previewItem.productName}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <FiPackage className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-zinc-900">Order #{order.id}</p>
                        <Badge className={`text-xs border ${config.className}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">
                        {previewItem?.productName}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {itemCount} item{itemCount !== 1 ? "s" : ""} · {formattedDate}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold text-zinc-900">${order.totalAmount.toLocaleString()}</p>
                      <FiChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
