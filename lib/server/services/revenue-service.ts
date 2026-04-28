import type { AdminRevenueSnapshot, OrderPurchaseMode, OrderStatus } from "@/lib/client/types";
import {
  getOrderStatusBreakdown,
  getRevenueByPurchaseMode,
  getRevenueSeries,
  getRevenueTotals,
  getTopProductsByRevenue,
} from "@/lib/server/repositories/revenue-repository";

const REVENUE_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];
const RANGE_DAYS_BY_KEY: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};
const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const PURCHASE_MODES: OrderPurchaseMode[] = ["regular", "business"];

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function resolveRangeDays(rangeKey?: string): number {
  if (rangeKey && RANGE_DAYS_BY_KEY[rangeKey]) {
    return RANGE_DAYS_BY_KEY[rangeKey];
  }

  return RANGE_DAYS_BY_KEY["30d"];
}

function fillMissingSeries(input: {
  startDate: Date;
  days: number;
  series: Array<{ date: string; revenue: number; orders: number; units: number }>;
}) {
  const byDate = new Map(input.series.map((row) => [row.date, row]));
  const filled: Array<{ date: string; revenue: number; orders: number; units: number }> = [];

  for (let index = 0; index < input.days; index += 1) {
    const date = addDays(input.startDate, index);
    const key = toIsoDate(date);
    filled.push(
      byDate.get(key) ?? { date: key, revenue: 0, orders: 0, units: 0 },
    );
  }

  return filled;
}

function formatGrowth(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function getAdminRevenueSnapshot(input: { range?: string }): Promise<AdminRevenueSnapshot> {
  const rangeDays = resolveRangeDays(input.range);
  const endDate = addDays(new Date(), 0);
  const startDate = addDays(endDate, -(rangeDays - 1));
  const endDateExclusive = addDays(endDate, 1);

  const compareEnd = addDays(startDate, -1);
  const compareStart = addDays(compareEnd, -(rangeDays - 1));
  const compareEndExclusive = addDays(compareEnd, 1);

  const [
    series,
    totals,
    compareTotals,
    byPurchaseMode,
    statusBreakdown,
    topProducts,
  ] = await Promise.all([
    getRevenueSeries({
      startDate: toIsoDate(startDate),
      endDateExclusive: toIsoDate(endDateExclusive),
      statuses: REVENUE_STATUSES,
    }),
    getRevenueTotals({
      startDate: toIsoDate(startDate),
      endDateExclusive: toIsoDate(endDateExclusive),
      statuses: REVENUE_STATUSES,
    }),
    getRevenueTotals({
      startDate: toIsoDate(compareStart),
      endDateExclusive: toIsoDate(compareEndExclusive),
      statuses: REVENUE_STATUSES,
    }),
    getRevenueByPurchaseMode({
      startDate: toIsoDate(startDate),
      endDateExclusive: toIsoDate(endDateExclusive),
      statuses: REVENUE_STATUSES,
    }),
    getOrderStatusBreakdown({
      startDate: toIsoDate(startDate),
      endDateExclusive: toIsoDate(endDateExclusive),
    }),
    getTopProductsByRevenue({
      startDate: toIsoDate(startDate),
      endDateExclusive: toIsoDate(endDateExclusive),
      statuses: REVENUE_STATUSES,
      limit: 6,
    }),
  ]);

  const filledSeries = fillMissingSeries({ startDate, days: rangeDays, series });

  const purchaseModeMap = new Map(byPurchaseMode.map((row) => [row.mode, row]));
  const normalizedByPurchaseMode = PURCHASE_MODES.map((mode) =>
    purchaseModeMap.get(mode) ?? { mode, revenue: 0, orders: 0 },
  );

  const statusMap = new Map(statusBreakdown.map((row) => [row.status, row]));
  const normalizedStatusBreakdown = ORDER_STATUSES.map((status) =>
    statusMap.get(status) ?? { status, orders: 0 },
  );

  const averageOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;

  return {
    generatedAt: new Date().toISOString(),
    range: {
      days: rangeDays,
      startDate: toIsoDate(startDate),
      endDate: toIsoDate(endDate),
      compareStartDate: toIsoDate(compareStart),
      compareEndDate: toIsoDate(compareEnd),
    },
    summary: {
      totalRevenue: totals.revenue,
      totalOrders: totals.orders,
      totalUnits: totals.units,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      revenueGrowthPct: formatGrowth(totals.revenue, compareTotals.revenue),
      orderGrowthPct: formatGrowth(totals.orders, compareTotals.orders),
      unitGrowthPct: formatGrowth(totals.units, compareTotals.units),
    },
    series: filledSeries,
    byPurchaseMode: normalizedByPurchaseMode,
    statusBreakdown: normalizedStatusBreakdown,
    topProducts,
  };
}
