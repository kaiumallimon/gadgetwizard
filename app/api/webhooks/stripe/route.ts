import type { NextRequest } from "next/server";
import Stripe from "stripe";

import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import {
  verifyStripeWebhook,
  handleStripeWebhookEvent,
} from "@/lib/server/services/order-webhook-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse({ error: "Missing Stripe signature" }, 400);
    }

    const payload = await request.text();
    const event = await verifyStripeWebhook(payload, signature);
    const result = await handleStripeWebhookEvent(event);

    return jsonResponse({ received: true, handled: result.handled }, 200);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return jsonResponse({ error: "Invalid webhook signature" }, 400);
    }

    return handleRouteError(error);
  }
}

export const POST = POSTHandler;
