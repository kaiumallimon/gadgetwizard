import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { execute, queryOne, queryRows } from "@/lib/server/core/db";

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

export interface OrderRefundRecord {
  id: number;
  order_id: number;
  order_status: string;
  order_total: number;
  user_id: number;
  user_name: string;
  user_email: string;
  admin_user_id: number;
  admin_name: string;
  admin_email: string;
  provider: "stripe";
  provider_refund_id: string;
  currency: string;
  amount: number;
  reason: string | null;
  created_at: Date | string;
}

export interface ListOrderRefundsFilter {
  page: number;
  pageSize: number;
  search?: string;
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

export async function listOrderRefunds(filter: ListOrderRefundsFilter): Promise<{ rows: OrderRefundRecord[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.search) {
    const like = `%${filter.search}%`;
    conditions.push(
      "(r.provider_refund_id LIKE ? OR r.order_id = ? OR u.email LIKE ? OR u.name LIKE ? OR admin.email LIKE ? OR admin.name LIKE ?)",
    );
    params.push(like, Number(filter.search) || 0, like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM order_refunds r
     JOIN orders o ON o.id = r.order_id
     JOIN users u ON u.id = r.user_id
     JOIN users admin ON admin.id = r.admin_user_id
     ${where}`,
    params,
  );

  const total = countResult?.total ?? 0;
  const offset = (filter.page - 1) * filter.pageSize;

  const rows = await queryRows<OrderRefundRecord>(
    `SELECT
        r.id,
        r.order_id,
        o.status AS order_status,
        o.total_amount AS order_total,
        r.user_id,
        u.name AS user_name,
        u.email AS user_email,
        r.admin_user_id,
        admin.name AS admin_name,
        admin.email AS admin_email,
        r.provider,
        r.provider_refund_id,
        r.currency,
        r.amount,
        r.reason,
        r.created_at
     FROM order_refunds r
     JOIN orders o ON o.id = r.order_id
     JOIN users u ON u.id = r.user_id
     JOIN users admin ON admin.id = r.admin_user_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filter.pageSize, offset],
  );

  return { rows, total };
}
