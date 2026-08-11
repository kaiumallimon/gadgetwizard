-- Migration 035: Enforce one order per Stripe payment intent
-- Prevents duplicate orders when the checkout client and the Stripe webhook
-- race to create the order for the same successful payment.

ALTER TABLE orders
  ADD UNIQUE KEY uk_orders_stripe_payment_intent (stripe_payment_intent_id(191));
