import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { execute } from "@/lib/server/core/db";

export interface CreateOrderRefundInput {
  orderId: number;
  userId: number;
  adminUserId: number;
  provider: "stripe";
  providerRefundId: string;
  currency: string;
  amount: number;
  reason?: string | null;
}

async function executeWithConnection(
  sql: string,
  params: unknown[] = [],
  connection?: PoolConnection,
): Promise<ResultSetHeader> {
  if (connection) {
    const [result] = await connection.query<ResultSetHeader>(sql, params);
    return result;
  }

  return execute(sql, params);
}

export async function createOrderRefund(
  input: CreateOrderRefundInput,
  connection?: PoolConnection,
): Promise<{ id: number }> {
  const result = await executeWithConnection(
    `INSERT INTO order_refunds
      (
        order_id,
        user_id,
        admin_user_id,
        provider,
        provider_refund_id,
        currency,
        amount,
        reason
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.orderId,
      input.userId,
      input.adminUserId,
      input.provider,
      input.providerRefundId,
      input.currency.toLowerCase(),
      input.amount,
      input.reason ?? null,
    ],
    connection,
  );

  return { id: result.insertId };
}
