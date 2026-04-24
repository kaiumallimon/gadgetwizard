import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { AddressSnapshot, OrderStatus } from "@/lib/client/types";

export interface OrderItemRecord {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface OrderRecord {
  id: number;
  user_id: number;
  status: OrderStatus;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string | null;
  shipping_address_snapshot: string; // JSON string
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  // joins
  user_name?: string;
  user_email?: string;
}

export interface CreateOrderInput {
  userId: number;
  totalAmount: number;
  subtotal: number;
  shippingAmount: number;
  stripePaymentIntentId: string;
  stripePaymentStatus: string;
  shippingAddressSnapshot: AddressSnapshot;
  notes?: string;
  items: Array<{
    productId: number;
    productName: string;
    productSku: string | null;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const result = await execute(
    `INSERT INTO orders
      (user_id, status, total_amount, subtotal, shipping_amount,
       stripe_payment_intent_id, stripe_payment_status,
       shipping_address_snapshot, notes)
     VALUES (?, 'paid', ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.totalAmount,
      input.subtotal,
      input.shippingAmount,
      input.stripePaymentIntentId,
      input.stripePaymentStatus,
      JSON.stringify(input.shippingAddressSnapshot),
      input.notes ?? null,
    ],
  );

  const orderId = result.insertId;

  for (const item of input.items) {
    await execute(
      `INSERT INTO order_items
        (order_id, product_id, product_name, product_sku, product_image_url,
         quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.productId,
        item.productName,
        item.productSku,
        item.productImageUrl,
        item.quantity,
        item.unitPrice,
        item.totalPrice,
      ],
    );
  }

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Failed to retrieve created order");
  return order;
}

export async function getOrderById(orderId: number): Promise<OrderRecord | null> {
  return queryOne<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId],
  );
}

export async function getOrdersByUserId(userId: number): Promise<OrderRecord[]> {
  return queryRows<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId],
  );
}

export async function listOrdersByUserId(input: {
  userId: number;
  page: number;
  pageSize: number;
}): Promise<{ rows: OrderRecord[]; total: number }> {
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM orders WHERE user_id = ?`,
    [input.userId],
  );

  const total = countResult?.total ?? 0;
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [input.userId, input.pageSize, offset],
  );

  return { rows, total };
}

export async function getOrderItemsByOrderId(orderId: number): Promise<OrderItemRecord[]> {
  return queryRows<OrderItemRecord>(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [orderId],
  );
}

export interface ListOrdersFilter {
  status?: OrderStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export async function listOrders(filter: ListOrdersFilter): Promise<{ rows: OrderRecord[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.status) {
    conditions.push("o.status = ?");
    params.push(filter.status);
  }

  if (filter.search) {
    conditions.push("(u.name LIKE ? OR u.email LIKE ? OR o.id = ?)");
    const like = `%${filter.search}%`;
    params.push(like, like, Number(filter.search) || 0);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${where}`,
    params,
  );

  const total = countResult?.total ?? 0;
  const offset = (filter.page - 1) * filter.pageSize;

  const rows = await queryRows<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, filter.pageSize, offset],
  );

  return { rows, total };
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  notes?: string,
): Promise<void> {
  if (notes !== undefined) {
    await execute(
      `UPDATE orders SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
      [status, notes, orderId],
    );
  } else {
    await execute(
      `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, orderId],
    );
  }
}

export async function findOrderByPaymentIntent(paymentIntentId: string): Promise<OrderRecord | null> {
  return queryOne<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.stripe_payment_intent_id = ?`,
    [paymentIntentId],
  );
}

export async function hasUserDeliveredOrderForProduct(
  userId: number,
  productId: number,
): Promise<number | null> {
  const row = await queryOne<{ order_id: number }>(
    `SELECT o.id AS order_id
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
       AND oi.product_id = ?
       AND o.status = 'delivered'
     LIMIT 1`,
    [userId, productId],
  );
  return row?.order_id ?? null;
}

export async function hasUserDeliveredOrderForProductInOrder(
  userId: number,
  productId: number,
  orderId: number,
): Promise<boolean> {
  const row = await queryOne<{ matched: number }>(
    `SELECT 1 AS matched
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = ?
       AND o.user_id = ?
       AND oi.product_id = ?
       AND o.status = 'delivered'
     LIMIT 1`,
    [orderId, userId, productId],
  );

  return Boolean(row?.matched);
}
