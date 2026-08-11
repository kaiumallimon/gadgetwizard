import type Stripe from "stripe";

import {
  createOrderFromStripePaymentIntent,
  getStripeClient,
} from "@/lib/server/services/order-service";

const supportedEvents = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]);

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return secret;
}

export async function verifyStripeWebhook(payload: string, signature: string): Promise<Stripe.Event> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  return stripe.webhooks.constructEventAsync(payload, signature, getStripeWebhookSecret());
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<{ handled: boolean }> {
  if (!supportedEvents.has(event.type)) {
    return { handled: false };
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.status !== "succeeded") {
        return { handled: false };
      }

      await createOrderFromStripePaymentIntent(paymentIntent);
      return { handled: true };
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}
