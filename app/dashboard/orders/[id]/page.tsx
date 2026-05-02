import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { FiArrowLeft, FiDownload, FiMapPin, FiPackage } from "react-icons/fi";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getOrderForUser } from "@/lib/server/services/order-service";
import { getUserReviewsForOrder } from "@/lib/server/services/review-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderReviewPanel } from "@/components/order-review-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid:            { label: "Paid",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  processing:      { label: "Processing",      className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  shipped:         { label: "Shipped",         className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered:       { label: "Delivered",       className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled:       { label: "Cancelled",       className: "bg-red-100 text-red-800 border-red-200" },
  refunded:        { label: "Refunded",        className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();

  let order;
  try {
    order = await getOrderForUser(orderId, session.userId);
  } catch {
    notFound();
  }

  const existingReviews = await getUserReviewsForOrder(session.userId, order.id);

  const config = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  const addr = order.shippingAddressSnapshot;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Order #{order.id}</h1>
            <p className="mt-2 text-sm text-zinc-600">Placed on {formattedDate}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">Reference #{order.id.toString().padStart(6, "0")}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                <FiDownload className="h-4 w-4" /> Invoice
              </Link>
            </Button> */}
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/dashboard/orders"><FiArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <Badge className={`border text-sm ${config.className}`}>{config.label}</Badge>
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
                <BreadcrumbLink asChild>
                  <Link href="/dashboard/orders">Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Order #{order.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiPackage className="h-4 w-4" /> Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead>Product</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.productImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="h-12 w-12 rounded-lg border border-zinc-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100">
                            <FiPackage className="h-5 w-5 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900">{item.productName}</p>
                          {item.productSku && <p className="text-xs text-zinc-500">SKU: {item.productSku}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-700">AU${item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-zinc-700">{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900">AU${item.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="ml-auto w-full max-w-sm space-y-1 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>AU${order.subtotal.toLocaleString()}</span>
            </div>
            {order.shippingAmount > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span>AU${order.shippingAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-zinc-200 pt-2" />
            <div className="flex justify-between font-semibold text-zinc-900">
              <span>Total</span>
              <span className="text-emerald-700">AU${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FiMapPin className="h-4 w-4" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 space-y-0.5">
              {addr.label && <p className="font-semibold text-zinc-800">{addr.label}</p>}
              <p className="font-medium">{addr.fullName}</p>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</p>
              <p>{addr.country}</p>
              <p className="text-zinc-500">{addr.phone}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Order ID</span>
              <span className="font-semibold text-zinc-900">#{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Payment</span>
              <span className="font-medium text-zinc-800">{order.stripePaymentStatus ?? "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Items</span>
              <span className="font-medium text-zinc-800">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
              <span className="text-zinc-500">Status</span>
              <Badge className={`border text-xs ${config.className}`}>{config.label}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderReviewPanel
        orderId={order.id}
        orderStatus={order.status}
        items={order.items}
        initialReviews={existingReviews}
      />
    </div>
  );
}
