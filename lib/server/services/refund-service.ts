import type { AdminOrderRefund, OrderStatus } from "@/lib/client/types";
import { listOrderRefunds, type ListOrderRefundsFilter, type OrderRefundRecord } from "@/lib/server/repositories/order-refund-repository";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRefundRecord(row: OrderRefundRecord): AdminOrderRefund {
  return {
    id: row.id,
    orderId: row.order_id,
    orderStatus: row.order_status as OrderStatus,
    orderTotal: Number(row.order_total),
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    adminUserId: row.admin_user_id,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    provider: row.provider,
    providerRefundId: row.provider_refund_id,
    currency: row.currency,
    amount: Number(row.amount),
    reason: row.reason,
    createdAt: toIso(row.created_at),
  };
}

export async function getAdminRefunds(filter: ListOrderRefundsFilter): Promise<{
  items: AdminOrderRefund[];
  total: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { rows, total } = await listOrderRefunds(filter);
  const items = rows.map(mapRefundRecord);

  return {
    items,
    total,
    pagination: {
      page: filter.page,
      pageSize: filter.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filter.pageSize)),
    },
  };
}
