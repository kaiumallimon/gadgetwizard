import { redirect } from "next/navigation";

import { CartClient } from "@/components/cart-client";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getCartForUser } from "@/lib/server/services/cart-service";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "admin") {
    redirect("/admin");
  }

  const cart = await getCartForUser(session.userId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900">Your Cart</h1>
        <p className="text-sm text-zinc-600">Review your cart and continue to secure checkout.</p>
      </div>
      <CartClient initialCart={cart} />
    </div>
  );
}
