import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { FiArrowLeft, FiMapPin, FiPackage } from "react-icons/fi";

import { getServerSession } from "@/lib/server/auth/server-session";
import { getOrderForUser } from "@/lib/server/services/order-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/dashboard/orders"><FiArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Order #{order.id}</h1>
          <p className="text-sm text-zinc-500">{formattedDate}</p>
        </div>
        <Badge className={`ml-auto border text-sm ${config.className}`}>{config.label}</Badge>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiPackage className="h-4 w-4" /> Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="h-14 w-14 rounded-xl object-cover border border-zinc-100"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100">
                  <FiPackage className="h-6 w-6 text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 truncate">{item.productName}</p>
                {item.productSku && (
                  <p className="text-xs text-zinc-400">SKU: {item.productSku}</p>
                )}
                <p className="text-sm text-zinc-500">
                  ${item.unitPrice.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-zinc-900">
                ${item.totalPrice.toLocaleString()}
              </p>
            </div>
          ))}

          <div className="border-t border-zinc-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString()}</span>
            </div>
            {order.shippingAmount > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Shipping</span>
                <span>${order.shippingAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-zinc-900">
              <span>Total</span>
              <span className="text-emerald-700">${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiMapPin className="h-4 w-4" /> Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-700 space-y-0.5">
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

      {/* Write Review (if delivered) */}
      {order.status === "delivered" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-sm text-emerald-800">
            <p className="font-medium">Your order has been delivered!</p>
            <p className="mt-0.5 text-emerald-600">
              You can now leave a review for products in this order from each product&apos;s page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
