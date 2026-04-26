"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import type { Cart, UserAddress } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CheckoutForm } from "@/components/checkout-form";

interface CheckoutPageClientProps {
  cart: Cart;
  savedAddresses: UserAddress[];
  stripePublishableKey: string;
  isBusinessApproved: boolean;
}

export function CheckoutPageClient({
  cart,
  savedAddresses,
  stripePublishableKey,
  isBusinessApproved,
}: CheckoutPageClientProps) {
  const { token } = useAuthStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<"regular" | "business">("regular");
  const [initialAddressId, setInitialAddressId] = useState<number | undefined>(
    savedAddresses.find((a) => a.isDefault)?.id ?? savedAddresses[0]?.id,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stripePromise = loadStripe(stripePublishableKey);

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
        const result = await apiClient.createPaymentIntent({ purchaseMode }, token ?? undefined);
        if (!active) return;
        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
        if (defaultAddress) setInitialAddressId(defaultAddress.id);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, [purchaseMode, savedAddresses, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-500" />
      </div>
    );
  }

  if (error || !clientSecret || !paymentIntentId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">{error ?? "Unable to initialize checkout."}</p>
        <p className="mt-1 text-sm text-red-500">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-medium text-zinc-900">Purchase Mode</p>
        <p className="mt-1 text-xs text-zinc-500">
          Business mode applies wholesale pricing only where product quantity thresholds are met.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPurchaseMode("regular")}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              purchaseMode === "regular"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-700"
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            onClick={() => setPurchaseMode("business")}
            disabled={!isBusinessApproved}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              purchaseMode === "business"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-700"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Business
          </button>
        </div>
        {!isBusinessApproved && (
          <p className="mt-2 text-xs text-amber-700">
            Business mode is locked until your business account is approved.
          </p>
        )}
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#f97316",
              borderRadius: "12px",
            },
          },
        }}
      >
        <CheckoutForm
          cart={cart}
          savedAddresses={savedAddresses}
          paymentIntentId={paymentIntentId}
          purchaseMode={purchaseMode}
          isBusinessApproved={isBusinessApproved}
          initialAddressId={initialAddressId}
        />
      </Elements>
    </div>
  );
}
