"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { FiMapPin, FiPlus, FiCheck } from "react-icons/fi";
import { z } from "zod";

import type { Cart, UserAddress } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addressSchema = z.object({
  label: z.string().max(100).optional(),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("Bangladesh"),
  saveAddress: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface CheckoutFormProps {
  cart: Cart;
  savedAddresses: UserAddress[];
  paymentIntentId: string;
  purchaseMode: "regular" | "business";
  isBusinessApproved: boolean;
  initialAddressId?: number;
}

export function CheckoutForm({
  cart,
  savedAddresses,
  paymentIntentId,
  purchaseMode,
  isBusinessApproved,
  initialAddressId,
}: CheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuthStore();
  const { clearCart } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    initialAddressId ?? (savedAddresses[0]?.id ?? null),
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(savedAddresses.length === 0);
  const [newAddress, setNewAddress] = useState<AddressFormData>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
    label: "",
    saveAddress: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const regularModeBlockedItems = purchaseMode === "regular"
    ? cart.items.filter(
      (item) =>
        item.productWholesaleMinQuantity !== null &&
        item.quantity >= item.productWholesaleMinQuantity,
    )
    : [];

  const total = cart.items.reduce((sum, item) => {
    const regularPrice = item.appliedDiscountedPrice ?? item.unitPrice;
    const isWholesaleItem =
      purchaseMode === "business" &&
      isBusinessApproved &&
      item.productWholesalePrice !== null &&
      item.productWholesaleMinQuantity !== null &&
      item.quantity >= item.productWholesaleMinQuantity;

    const price = isWholesaleItem ? (item.productWholesalePrice ?? regularPrice) : regularPrice;
    return sum + price * item.quantity;
  }, 0);

  function handleAddressChange(field: keyof AddressFormData, value: string | boolean) {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const handleSelectSaved = useCallback((id: number) => {
    setSelectedAddressId(id);
    setShowNewAddressForm(false);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      // Validate address if using new form
      if (!showNewAddressForm && selectedAddressId) {
        // using saved address
      } else {
        const parsed = addressSchema.safeParse(newAddress);
        if (!parsed.success) {
          const errors: Partial<Record<keyof AddressFormData, string>> = {};
          parsed.error.issues.forEach((issue) => {
            const key = issue.path[0] as keyof AddressFormData;
            if (key) errors[key] = issue.message;
          });
          setFormErrors(errors);
          setSubmitting(false);
          return;
        }
      }

      // Confirm Stripe payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (stripeError) {
        setSubmitError(stripeError.message ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Create order on backend
      const orderPayload = showNewAddressForm
        ? { paymentIntentId, purchaseMode, newAddress }
        : { paymentIntentId, purchaseMode, addressId: selectedAddressId! };

      const { order } = await apiClient.createOrder(orderPayload, token ?? undefined);
      clearCart();

      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-700">
                {item.productName} <span className="text-zinc-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-zinc-900">
                ${(
                  (
                    purchaseMode === "business" &&
                    isBusinessApproved &&
                    item.productWholesalePrice !== null &&
                    item.productWholesaleMinQuantity !== null &&
                    item.quantity >= item.productWholesaleMinQuantity
                      ? item.productWholesalePrice
                      : (item.appliedDiscountedPrice ?? item.unitPrice)
                  ) * item.quantity
                ).toLocaleString()}
              </span>
            </div>
          ))}
          {regularModeBlockedItems.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Regular mode is blocked for:
              {regularModeBlockedItems.map((item) => ` ${item.productName} (${item.productWholesaleMinQuantity}+ qty)`).join(", ")}
              . Switch to business mode to continue.
            </div>
          )}
          <div className="border-t border-zinc-100 pt-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-zinc-900">Total</span>
              <span className="text-lg text-emerald-700">${total.toLocaleString()}</span>
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
        <CardContent className="space-y-3">
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelectSaved(addr.id)}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                    selectedAddressId === addr.id && !showNewAddressForm
                      ? "border-orange-400 bg-orange-50 ring-1 ring-orange-400"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {addr.label && (
                        <p className="mb-0.5 font-semibold text-zinc-800">{addr.label}</p>
                      )}
                      <p className="font-medium text-zinc-800">{addr.fullName}</p>
                      <p className="text-zinc-600">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-zinc-600">{addr.addressLine2}</p>}
                      <p className="text-zinc-600">
                        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-zinc-600">{addr.country}</p>
                      <p className="text-zinc-500">{addr.phone}</p>
                    </div>
                    {selectedAddressId === addr.id && !showNewAddressForm && (
                      <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    )}
                  </div>
                </button>
              ))}

              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800"
                >
                  <FiPlus className="h-4 w-4" /> Use a different address
                </button>
              )}
            </div>
          )}

          {showNewAddressForm && (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-700">New Shipping Address</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="label" className="text-xs">Label (optional)</Label>
                  <Input
                    id="label"
                    placeholder="Home, Office..."
                    value={newAddress.label ?? ""}
                    onChange={(e) => handleAddressChange("label", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={newAddress.fullName}
                    onChange={(e) => handleAddressChange("fullName", e.target.value)}
                  />
                  {formErrors.fullName && <p className="text-xs text-red-500">{formErrors.fullName}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="+880..."
                    value={newAddress.phone}
                    onChange={(e) => handleAddressChange("phone", e.target.value)}
                  />
                  {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="addressLine1" className="text-xs">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Street address, building, apartment..."
                    value={newAddress.addressLine1}
                    onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
                  />
                  {formErrors.addressLine1 && <p className="text-xs text-red-500">{formErrors.addressLine1}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="addressLine2" className="text-xs">Address Line 2 (optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Floor, area landmark..."
                    value={newAddress.addressLine2 ?? ""}
                    onChange={(e) => handleAddressChange("addressLine2", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-xs">City *</Label>
                  <Input
                    id="city"
                    placeholder="Dhaka"
                    value={newAddress.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                  />
                  {formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state" className="text-xs">District / State</Label>
                  <Input
                    id="state"
                    placeholder="Dhaka Division"
                    value={newAddress.state ?? ""}
                    onChange={(e) => handleAddressChange("state", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postalCode" className="text-xs">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="1207"
                    value={newAddress.postalCode ?? ""}
                    onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-xs">Country</Label>
                  <Input
                    id="country"
                    value={newAddress.country}
                    onChange={(e) => handleAddressChange("country", e.target.value)}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={newAddress.saveAddress ?? false}
                  onChange={(e) => handleAddressChange("saveAddress", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-orange-500"
                />
                Save this address for future orders
              </label>

              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAddressForm(false);
                    setSelectedAddressId(savedAddresses[0]?.id ?? null);
                  }}
                  className="text-xs text-zinc-500 underline hover:text-zinc-800"
                >
                  Use a saved address instead
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </CardContent>
      </Card>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || submitting || regularModeBlockedItems.length > 0}
        className="w-full rounded-full bg-orange-500 py-6 text-base font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {submitting ? "Placing Order..." : `Pay $${total.toLocaleString()} & Place Order`}
      </Button>
    </form>
  );
}
