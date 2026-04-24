import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/auth/server-session";
import { getCartForUser } from "@/lib/server/services/cart-service";
import { getUserAddresses } from "@/lib/server/services/address-service";
import { getEnv } from "@/lib/server/core/env";
import { CheckoutPageClient } from "@/components/checkout-page-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  const env = getEnv();
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-zinc-500">Online payment is not currently configured. Please contact support.</p>
      </div>
    );
  }

  const [cart, savedAddresses] = await Promise.all([
    getCartForUser(session.userId),
    getUserAddresses(session.userId),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-zinc-900">Checkout</h1>
        <p className="text-sm text-zinc-500">Review your order and complete payment.</p>
      </div>

      <CheckoutPageClient
        cart={cart}
        savedAddresses={savedAddresses}
        stripePublishableKey={publishableKey}
      />
    </div>
  );
}
