import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/auth/server-session";
import { getCartForUser } from "@/lib/server/services/cart-service";
import { getUserAddresses } from "@/lib/server/services/address-service";
import { getCurrentUser } from "@/lib/server/services/auth-service";
import { getEnv } from "@/lib/server/core/env";
import { CheckoutPageClient } from "@/components/checkout-page-client";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseSelectedProductIds(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

interface CheckoutPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const rawSearchParams = await searchParams;
  const session = await getServerSession();

  if (!session) {
    redirect(buildLoginRedirect("/checkout", rawSearchParams));
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

  const [user, cart, savedAddresses] = await Promise.all([
    getCurrentUser(session.userId),
    getCartForUser(session.userId),
    getUserAddresses(session.userId),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const selectedProductIds = parseSelectedProductIds(firstParam(rawSearchParams.selected));
  const checkoutItems = selectedProductIds.length > 0
    ? cart.items.filter((item) => selectedProductIds.includes(item.productId))
    : cart.items;

  if (checkoutItems.length === 0) {
    redirect("/cart");
  }

  const checkoutCart = {
    ...cart,
    items: checkoutItems,
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-zinc-900">Checkout</h1>
        <p className="text-sm text-zinc-500">Review your order and complete payment.</p>
      </div>

      <CheckoutPageClient
        cart={checkoutCart}
        savedAddresses={savedAddresses}
        stripePublishableKey={publishableKey}
        isBusinessApproved={user.isBusinessApproved}
      />
    </div>
  );
}
