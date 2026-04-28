import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { execute, queryRows } from "@/lib/server/core/db";

export type ReservationStatus = "active" | "fulfilled" | "released";

type ReservationQuantityRow = {
  product_id: number;
  reserved_qty: number;
};

async function queryRowsWithConnection<T>(
  sql: string,
  params: unknown[],
  connection?: PoolConnection,
): Promise<T[]> {
  if (connection) {
    const [rows] = await connection.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  }

  return queryRows<T>(sql, params);
}

async function executeWithConnection(
  sql: string,
  params: unknown[],
  connection?: PoolConnection,
): Promise<void> {
  if (connection) {
    await connection.query(sql, params);
    return;
  }

  await execute(sql, params);
}

export async function releaseActiveReservationsForUser(userId: number, connection?: PoolConnection): Promise<void> {
  await executeWithConnection(
    `UPDATE inventory_reservations
     SET status = 'released'
     WHERE user_id = ? AND status = 'active'`,
    [userId],
    connection,
  );
}

export async function createReservationsForGroup(input: {
  reservationGroupId: string;
  userId: number;
  expiresAt: Date;
  items: Array<{ productId: number; quantity: number }>;
  connection?: PoolConnection;
}): Promise<void> {
  if (input.items.length === 0) {
    return;
  }

  const valuesSql = input.items.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const params: unknown[] = [];

  for (const item of input.items) {
    params.push(
      input.reservationGroupId,
      input.userId,
      item.productId,
      item.quantity,
      input.expiresAt,
    );
  }

  await executeWithConnection(
    `INSERT INTO inventory_reservations
      (reservation_group_id, user_id, product_id, quantity, expires_at)
     VALUES ${valuesSql}`,
    params,
    input.connection,
  );
}

export async function attachPaymentIntentToReservationGroup(
  reservationGroupId: string,
  paymentIntentId: string,
): Promise<void> {
  await execute(
    `UPDATE inventory_reservations
     SET payment_intent_id = ?
     WHERE reservation_group_id = ? AND status = 'active'`,
    [paymentIntentId, reservationGroupId],
  );
}

export async function markReservationGroupStatus(
  reservationGroupId: string,
  status: ReservationStatus,
  connection?: PoolConnection,
): Promise<void> {
  await executeWithConnection(
    `UPDATE inventory_reservations
     SET status = ?
     WHERE reservation_group_id = ? AND status = 'active'`,
    [status, reservationGroupId],
    connection,
  );
}

export async function markReservationsByPaymentIntent(
  paymentIntentId: string,
  status: ReservationStatus,
  connection?: PoolConnection,
): Promise<void> {
  await executeWithConnection(
    `UPDATE inventory_reservations
     SET status = ?
     WHERE payment_intent_id = ? AND status = 'active'`,
    [status, paymentIntentId],
    connection,
  );
}

export async function getActiveReservedQuantitiesByProductIds(input: {
  productIds: number[];
  excludeUserId?: number;
  userId?: number;
  reservationGroupId?: string;
  connection?: PoolConnection;
}): Promise<Map<number, number>> {
  if (input.productIds.length === 0) {
    return new Map();
  }

  const placeholders = input.productIds.map(() => "?").join(", ");
  const params: unknown[] = [...input.productIds];
  const conditions: string[] = [
    `product_id IN (${placeholders})`,
    `status = 'active'`,
    "expires_at > UTC_TIMESTAMP()",
  ];

  if (typeof input.excludeUserId === "number") {
    conditions.push("user_id <> ?");
    params.push(input.excludeUserId);
  }

  if (typeof input.userId === "number") {
    conditions.push("user_id = ?");
    params.push(input.userId);
  }

  if (input.reservationGroupId) {
    conditions.push("reservation_group_id = ?");
    params.push(input.reservationGroupId);
  }

  const rows = await queryRowsWithConnection<ReservationQuantityRow>(
    `SELECT product_id, COALESCE(SUM(quantity), 0) AS reserved_qty
     FROM inventory_reservations
     WHERE ${conditions.join(" AND ")}
     GROUP BY product_id`,
    params,
    input.connection,
  );

  return new Map(rows.map((row) => [Number(row.product_id), Number(row.reserved_qty)]));
}
