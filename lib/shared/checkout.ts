import type { AddressSnapshot } from "@/lib/client/types";

export type CheckoutFulfillmentMethod = "delivery" | "pickup";

export const DELIVERY_CHARGE = 10;
export const FREE_DELIVERY_THRESHOLD = 200;

export function calculateDeliveryCharge(
  subtotal: number,
  fulfillmentMethod: CheckoutFulfillmentMethod = "delivery",
): number {
  if (fulfillmentMethod === "pickup") {
    return 0;
  }

  return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

export function calculateCheckoutTotal(input: {
  subtotal: number;
  fulfillmentMethod?: CheckoutFulfillmentMethod;
}): { subtotal: number; deliveryCharge: number; total: number } {
  const deliveryCharge = calculateDeliveryCharge(input.subtotal, input.fulfillmentMethod);

  return {
    subtotal: input.subtotal,
    deliveryCharge,
    total: input.subtotal + deliveryCharge,
  };
}

export function getShowroomPickupSnapshot(): AddressSnapshot {
  return {
    fullName: "Showroom pickup",
    phone: "N/A",
    addressLine1: "Pickup from showroom",
    addressLine2: null,
    city: "Showroom counter",
    state: null,
    postalCode: null,
    country: "Bangladesh",
    label: "Showroom pickup",
  };
}
