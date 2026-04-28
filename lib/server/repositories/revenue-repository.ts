import { queryOne, queryRows } from "@/lib/server/core/db";
import type { OrderPurchaseMode, OrderStatus } from "@/lib/client/types";

interface RevenueSeriesRow {
  date_key: Date | string;
  revenue: number | string | null;
  orders: number | string | null;
  units: number | string | null;
}

interface RevenueTotalsRow {
  revenue: number | string | null;
  orders: number | string | null;
  units: number | string | null;
}

interface RevenueByModeRow {
  purchase_mode: OrderPurchaseMode;
  revenue: number | string | null;
  orders: number | string | null;
}

interface OrderStatusRow {
  status: OrderStatus;
  orders: number | string | null;
}

interface TopProductRow {
  product_id: number;
  product_name: string;
  revenue: number | string | null;
  units: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDateKey(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return new Date().toISOString().slice(0, 10);
}

function buildStatusFilter(statuses: OrderStatus[]) {
  return {
    sql: statuses.map(() => "?").join(", "),
    values: statuses,
  };
}

export async function getRevenueSeries(input: {
  startDate: string;
  endDateExclusive: string;
  statuses: OrderStatus[];
}): Promise<Array<{ date: string; revenue: number; orders: number; units: number }>> {
  const statusFilter = buildStatusFilter(input.statuses);

  const rows = await queryRows<RevenueSeriesRow>(
    `
      SELECT
        DATE(o.created_at) AS date_key,
        SUM(o.total_amount) AS revenue,
        COUNT(DISTINCT o.id) AS orders,
        SUM(oi.quantity) AS units
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN (${statusFilter.sql})
        AND o.created_at >= ?
        AND o.created_at < ?
      GROUP BY DATE(o.created_at)
      ORDER BY DATE(o.created_at) ASC
    `,
    [...statusFilter.values, input.startDate, input.endDateExclusive],
  );

  return rows.map((row) => ({
    date: normalizeDateKey(row.date_key),
    revenue: toNumber(row.revenue),
    orders: toNumber(row.orders),
    units: toNumber(row.units),
  }));
}

export async function getRevenueTotals(input: {
  startDate: string;
  endDateExclusive: string;
  statuses: OrderStatus[];
}): Promise<{ revenue: number; orders: number; units: number }> {
  const statusFilter = buildStatusFilter(input.statuses);

  const row = await queryOne<RevenueTotalsRow>(
    `
      SELECT
        SUM(o.total_amount) AS revenue,
        COUNT(DISTINCT o.id) AS orders,
        SUM(oi.quantity) AS units
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN (${statusFilter.sql})
        AND o.created_at >= ?
        AND o.created_at < ?
    `,
    [...statusFilter.values, input.startDate, input.endDateExclusive],
  );

  return {
    revenue: toNumber(row?.revenue),
    orders: toNumber(row?.orders),
    units: toNumber(row?.units),
  };
}

export async function getRevenueByPurchaseMode(input: {
  startDate: string;
  endDateExclusive: string;
  statuses: OrderStatus[];
}): Promise<Array<{ mode: OrderPurchaseMode; revenue: number; orders: number }>> {
  const statusFilter = buildStatusFilter(input.statuses);

  const rows = await queryRows<RevenueByModeRow>(
    `
      SELECT
        o.purchase_mode,
        SUM(o.total_amount) AS revenue,
        COUNT(*) AS orders
      FROM orders o
      WHERE o.status IN (${statusFilter.sql})
        AND o.created_at >= ?
        AND o.created_at < ?
      GROUP BY o.purchase_mode
    `,
    [...statusFilter.values, input.startDate, input.endDateExclusive],
  );

  return rows.map((row) => ({
    mode: row.purchase_mode,
    revenue: toNumber(row.revenue),
    orders: toNumber(row.orders),
  }));
}

export async function getOrderStatusBreakdown(input: {
  startDate: string;
  endDateExclusive: string;
}): Promise<Array<{ status: OrderStatus; orders: number }>> {
  const rows = await queryRows<OrderStatusRow>(
    `
      SELECT o.status, COUNT(*) AS orders
      FROM orders o
      WHERE o.created_at >= ?
        AND o.created_at < ?
      GROUP BY o.status
    `,
    [input.startDate, input.endDateExclusive],
  );

  return rows.map((row) => ({
    status: row.status,
    orders: toNumber(row.orders),
  }));
}

export async function getTopProductsByRevenue(input: {
  startDate: string;
  endDateExclusive: string;
  statuses: OrderStatus[];
  limit?: number;
}): Promise<Array<{ productId: number; productName: string; revenue: number; units: number }>> {
  const statusFilter = buildStatusFilter(input.statuses);
  const limit = Math.max(1, Math.min(20, input.limit ?? 6));

  const rows = await queryRows<TopProductRow>(
    `
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.total_price) AS revenue,
        SUM(oi.quantity) AS units
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN (${statusFilter.sql})
        AND o.created_at >= ?
        AND o.created_at < ?
      GROUP BY oi.product_id, oi.product_name
      ORDER BY revenue DESC
      LIMIT ?
    `,
    [...statusFilter.values, input.startDate, input.endDateExclusive, limit],
  );

  return rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    revenue: toNumber(row.revenue),
    units: toNumber(row.units),
  }));
}
