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

  const cart = await getCartForUser(session.userId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Your Cart</h1>
        <p className="text-sm text-(--muted)">Order placement is not enabled yet. Manage cart items only.</p>
      </div>
      <CartClient initialCart={cart} />
    </div>
  );
}
