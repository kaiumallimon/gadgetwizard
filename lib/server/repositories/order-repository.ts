import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { AddressSnapshot, OrderPurchaseMode, OrderStatus } from "@/lib/client/types";

export interface OrderItemRecord {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  delivered_quantity: number;
  refunded_quantity: number;
  is_wholesale_item: number;
  unit_price: number;
  wholesale_unit_price: number | null;
  total_price: number;
  created_at: Date | string;
}

export interface OrderRecord {
  id: number;
  user_id: number;
  status: OrderStatus;
  purchase_mode: OrderPurchaseMode;
  is_wholesale: number;
  business_account_id: number | null;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string | null;
  shipping_address_snapshot: string;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  // joins
  user_name?: string;
  user_email?: string;
}

export interface CreateOrderInput {
  userId: number;
  purchaseMode: OrderPurchaseMode;
  isWholesale: boolean;
  businessAccountId: number | null;
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
    isWholesaleItem: boolean;
    unitPrice: number;
    wholesaleUnitPrice: number | null;
    totalPrice: number;
  }>;
}

export interface ListOrdersFilter {
  status?: OrderStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export interface CheckoutProductRow {
  id: number;
  name: string;
  sku: string | null;
  images: string | null;
  is_active: number;
  stock: number;
  original_price: number | string;
  discounted_price: number | string | null;
  wholesale_price: number | string | null;
  wholesale_min_quantity: number | null;
}

function parseImagesFirst(imagesJson: string | null): string | null {
  if (!imagesJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(imagesJson) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const first = parsed.find((entry): entry is string => typeof entry === "string" && entry.length > 0);
    return first ?? null;
  } catch {
    return null;
  }
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

async function queryOneWithConnection<T>(
  sql: string,
  params: unknown[] = [],
  connection?: PoolConnection,
): Promise<T | null> {
  if (connection) {
    const [rows] = await connection.query<RowDataPacket[]>(sql, params);
    return (rows as T[])[0] ?? null;
  }

  return queryOne<T>(sql, params);
}

export async function createOrder(
  input: CreateOrderInput,
  connection?: PoolConnection,
): Promise<OrderRecord> {
  const result = await executeWithConnection(
    `INSERT INTO orders
      (
        user_id,
        status,
        purchase_mode,
        is_wholesale,
        business_account_id,
        total_amount,
        subtotal,
        shipping_amount,
        stripe_payment_intent_id,
        stripe_payment_status,
        shipping_address_snapshot,
        notes
      )
     VALUES (?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.purchaseMode,
      input.isWholesale ? 1 : 0,
      input.businessAccountId,
      input.totalAmount,
      input.subtotal,
      input.shippingAmount,
      input.stripePaymentIntentId,
      input.stripePaymentStatus,
      JSON.stringify(input.shippingAddressSnapshot),
      input.notes ?? null,
    ],
    connection,
  );

  const orderId = result.insertId;

  for (const item of input.items) {
    await executeWithConnection(
      `INSERT INTO order_items
        (
          order_id,
          product_id,
          product_name,
          product_sku,
          product_image_url,
          quantity,
          is_wholesale_item,
          unit_price,
          wholesale_unit_price,
          total_price
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.productId,
        item.productName,
        item.productSku,
        item.productImageUrl,
        item.quantity,
        item.isWholesaleItem ? 1 : 0,
        item.unitPrice,
        item.wholesaleUnitPrice,
        item.totalPrice,
      ],
      connection,
    );
  }

  const order = await getOrderById(orderId, connection);
  if (!order) throw new Error("Failed to retrieve created order");
  return order;
}

export async function getOrderById(orderId: number, connection?: PoolConnection): Promise<OrderRecord | null> {
  return queryOneWithConnection<OrderRecord>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId],
    connection,
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

export async function updateOrderItemFulfillment(
  orderId: number,
  updates: Array<{ orderItemId: number; deliveredQuantity: number; refundedQuantity: number }>,
  connection?: PoolConnection,
): Promise<void> {
  for (const update of updates) {
    await executeWithConnection(
      `UPDATE order_items
       SET delivered_quantity = ?, refunded_quantity = ?
       WHERE id = ? AND order_id = ?`,
      [update.deliveredQuantity, update.refundedQuantity, update.orderItemId, orderId],
      connection,
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

export async function lockProductsForCheckout(
  productIds: number[],
  connection: PoolConnection,
): Promise<CheckoutProductRow[]> {
  if (productIds.length === 0) {
    return [];
  }

  const placeholders = productIds.map(() => "?").join(", ");
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT
        id,
        name,
        sku,
        images,
        is_active,
        stock,
        original_price,
        discounted_price,
        wholesale_price,
        wholesale_min_quantity
      FROM products
      WHERE id IN (${placeholders})
      FOR UPDATE
    `,
    productIds,
  );

  return rows as CheckoutProductRow[];
}

export async function decrementProductStock(
  productId: number,
  quantity: number,
  connection: PoolConnection,
): Promise<boolean> {
  const [result] = await connection.query<ResultSetHeader>(
    `
      UPDATE products
      SET stock = stock - ?
      WHERE id = ? AND stock >= ?
    `,
    [quantity, productId, quantity],
  );

  return result.affectedRows > 0;
}

export async function clearCartItemsByCartId(cartId: number, connection: PoolConnection): Promise<void> {
  await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
}

export async function clearCartItemsByProductIds(
  cartId: number,
  productIds: number[],
  connection: PoolConnection,
): Promise<void> {
  if (productIds.length === 0) {
    return;
  }

  const placeholders = productIds.map(() => "?").join(", ");
  await connection.query(
    `DELETE FROM cart_items WHERE cart_id = ? AND product_id IN (${placeholders})`,
    [cartId, ...productIds],
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

export function toOrderItemImageFromProductRow(product: CheckoutProductRow): string | null {
  return parseImagesFirst(product.images);
}
