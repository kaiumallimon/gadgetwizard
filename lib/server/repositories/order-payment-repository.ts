import { execute, queryOne } from "@/lib/server/core/db";

export interface OrderPaymentRecord {
  id: number;
  order_id: number;
  user_id: number;
  provider: "stripe";
  provider_payment_id: string;
  currency: string;
  amount: number;
  amount_received: number;
  status: string;
  payment_method_types: string | string[] | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertOrderPaymentInput {
  orderId: number;
  userId: number;
  provider: "stripe";
  providerPaymentId: string;
  currency: string;
  amount: number;
  amountReceived: number;
  status: string;
  paymentMethodTypes?: string[];
  paidAt?: Date | null;
}

export async function upsertOrderPayment(input: UpsertOrderPaymentInput): Promise<void> {
  await execute(
    `INSERT INTO order_payments
      (order_id, user_id, provider, provider_payment_id, currency, amount, amount_received, status, payment_method_types, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      provider = VALUES(provider),
      currency = VALUES(currency),
      amount = VALUES(amount),
      amount_received = VALUES(amount_received),
      status = VALUES(status),
      payment_method_types = VALUES(payment_method_types),
      paid_at = VALUES(paid_at),
      updated_at = CURRENT_TIMESTAMP`,
    [
      input.orderId,
      input.userId,
      input.provider,
      input.providerPaymentId,
      input.currency.toLowerCase(),
      input.amount,
      input.amountReceived,
      input.status,
      input.paymentMethodTypes ? JSON.stringify(input.paymentMethodTypes) : null,
      input.paidAt ?? null,
    ],
  );
}

export async function getOrderPaymentByOrderIdForUser(
  orderId: number,
  userId: number,
): Promise<OrderPaymentRecord | null> {
  return queryOne<OrderPaymentRecord>(
    `SELECT *
     FROM order_payments
     WHERE order_id = ? AND user_id = ?
     LIMIT 1`,
    [orderId, userId],
  );
}
