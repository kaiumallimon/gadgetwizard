import Link from "next/link";
import { redirect } from "next/navigation";
import { FiCheckCircle, FiPackage } from "react-icons/fi";

import { getServerSession } from "@/lib/server/auth/server-session";
import { Button } from "@/components/ui/button";
import { getOrderForUser } from "@/lib/server/services/order-service";
import { CheckoutInvoiceDownload } from "@/components/checkout-invoice-download";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const rawSearchParams = await searchParams;
  const session = await getServerSession();
  if (!session) redirect(buildLoginRedirect("/checkout/success", rawSearchParams));
  const { orderId: orderIdStr } = rawSearchParams;
  const orderId = orderIdStr ? Number(orderIdStr) : null;

  let order = null;
  if (orderId && Number.isInteger(orderId)) {
    try {
      order = await getOrderForUser(orderId, session.userId);
    } catch {
      order = null;
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <FiCheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-zinc-900">Order Placed!</h1>
        <p className="text-zinc-500">
          Thank you for your purchase. Your order has been confirmed and is being processed.
        </p>

        {order && (
          <div className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <FiPackage className="h-4 w-4" />
              Order #{order.id}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Status: <span className="font-medium capitalize text-zinc-700">{order.status.replace("_", " ")}</span>
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
            <Link href="/dashboard/orders">View My Orders</Link>
          </Button>
          {/* {order && <CheckoutInvoiceDownload order={order} />} */}
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
