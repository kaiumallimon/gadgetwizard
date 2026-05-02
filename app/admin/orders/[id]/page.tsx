import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Package, User } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminOrderById } from "@/lib/server/services/order-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminOrderPartialFulfillment } from "@/components/admin/admin-order-partial-fulfillment";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const MODE_BADGE: Record<string, string> = {
  regular: "border-zinc-200 bg-zinc-50 text-zinc-700",
  business: "border-blue-200 bg-blue-50 text-blue-700",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireServerRole(["admin"]);

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const order = await getAdminOrderById(orderId).catch(() => null);
  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddressSnapshot;
  const totalItemQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const hasRefundedItems = order.items.some((item) => item.refundedQuantity > 0);
  const hasDeliveredItems = order.items.some((item) => item.deliveredQuantity > 0);
  const isPartialDelivery = hasRefundedItems && hasDeliveredItems;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Order #{order.id}</h1>
            <p className="mt-2 text-sm text-zinc-600">Created {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{STATUS_LABELS[order.status] ?? order.status}</Badge>
            <Badge variant="outline" className={MODE_BADGE[order.purchaseMode] ?? MODE_BADGE.regular}>
              {order.purchaseMode.toUpperCase()}
            </Badge>
            {isPartialDelivery && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Partial delivery
              </Badge>
            )}
            {hasRefundedItems && (
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                Refund issued
              </Badge>
            )}
            {order.isWholesale && (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                WHOLESALE
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/orders">Orders</Link>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">
            A${order.totalAmount.toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Items</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-zinc-900">{totalItemQuantity}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-lg font-semibold text-zinc-900">
            {(order.stripePaymentStatus ?? "n/a").toUpperCase()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Purchase Mode</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-lg font-semibold text-zinc-900">{order.purchaseMode.toUpperCase()}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{item.productName}</p>
                      {item.productSku && <p className="text-xs text-zinc-500">SKU: {item.productSku}</p>}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>A${item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      {item.wholesaleUnitPrice !== null ? `A$${item.wholesaleUnitPrice.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-zinc-900">A${item.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AdminOrderPartialFulfillment order={order} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-zinc-700">
            <p><span className="font-medium text-zinc-900">Name:</span> {order.userName ?? "N/A"}</p>
            <p><span className="font-medium text-zinc-900">Email:</span> {order.userEmail ?? "N/A"}</p>
            <p><span className="font-medium text-zinc-900">Shipping Name:</span> {shippingAddress.fullName}</p>
            <p><span className="font-medium text-zinc-900">Phone:</span> {shippingAddress.phone}</p>
            <p><span className="font-medium text-zinc-900">Address:</span> {shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
            <p>{[shippingAddress.city, shippingAddress.state, shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
            <p>{shippingAddress.country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-zinc-700">
            {order.isWholesale && order.businessAccount ? (
              <>
                <p><span className="font-medium text-zinc-900">Business Name:</span> {order.businessAccount.businessName}</p>
                <p><span className="font-medium text-zinc-900">Entity:</span> {order.businessAccount.legalEntityType}</p>
                <p><span className="font-medium text-zinc-900">Contact:</span> {order.businessAccount.primaryContactName}</p>
                <p><span className="font-medium text-zinc-900">Contact Email:</span> {order.businessAccount.primaryContactEmail}</p>
                <p><span className="font-medium text-zinc-900">Contact Phone:</span> {order.businessAccount.primaryContactPhone}</p>
                {order.businessAccount.taxId && <p><span className="font-medium text-zinc-900">Tax ID:</span> {order.businessAccount.taxId}</p>}
                {order.businessAccount.registrationNumber && (
                  <p><span className="font-medium text-zinc-900">Registration:</span> {order.businessAccount.registrationNumber}</p>
                )}
              </>
            ) : (
              <p className="text-zinc-500">This order was not placed as a wholesale business order.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
