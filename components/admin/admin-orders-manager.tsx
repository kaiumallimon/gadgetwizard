"use client";

import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";

import type { Order, OrderStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_BADGES: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

interface AdminOrdersManagerProps {
  initialOrders: Order[];
}

export function AdminOrdersManager({ initialOrders }: AdminOrdersManagerProps) {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<number, OrderStatus>>({});

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await apiClient.adminGetOrders(
        {
          page: 1,
          pageSize: 100,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
        token ?? undefined,
      );
      setOrders(response.items);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((o) => {
      const haystack = [
        String(o.id),
        o.userName ?? "",
        o.userEmail ?? "",
        o.status,
        ...(o.items.map((i) => i.productName)),
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, search]);

  async function updateStatus(order: Order, status: OrderStatus) {
    setUpdatingOrderId(order.id);
    try {
      const { item } = await apiClient.adminUpdateOrderStatus(
        order.id,
        { status },
        token ?? undefined,
      );
      setOrders((prev) => prev.map((o) => (o.id === item.id ? item : o)));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Orders</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order ID, user name, email, product..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void loadOrders()} disabled={loading}>
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button type="button" onClick={() => void loadOrders()} className="bg-black text-white hover:bg-zinc-800">
              <FiFilter className="h-4 w-4" /> Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-zinc-500">
              No orders found with current filters.
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const status = localStatus[order.id] ?? order.status;
            const statusLabel = ORDER_STATUSES.find((s) => s.value === order.status)?.label ?? order.status;
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <Card key={order.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-zinc-900">Order #{order.id}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[order.status]}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">{order.userName ?? "Unknown user"} · {order.userEmail ?? "N/A"}</p>
                      <p className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">${order.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    <p className="font-medium text-zinc-700">Products</p>
                    <p className="mt-0.5 line-clamp-2">{order.items.map((i) => i.productName).join(", ")}</p>
                  </div>

                  <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Update status</Label>
                      <Select
                        value={status}
                        onValueChange={(value) => setLocalStatus((prev) => ({ ...prev, [order.id]: value as OrderStatus }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      disabled={updatingOrderId === order.id || status === order.status}
                      onClick={() => void updateStatus(order, status)}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      {updatingOrderId === order.id ? "Updating..." : "Save Status"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
