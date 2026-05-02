"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";

import type { Order, OrderStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const STATUS_BADGES: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

interface AdminOrdersManagerProps {
  initialOrders: Order[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialStatus: "all" | OrderStatus;
  initialSearch: string;
}

export function AdminOrdersManager({
  initialOrders,
  initialTotal,
  initialPage,
  initialPageSize,
  initialStatus,
  initialSearch,
}: AdminOrdersManagerProps) {
  const { token } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>(initialStatus);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<number, OrderStatus>>({});

  const firstLoadRef = useRef(true);

  async function loadOrders(overrides?: {
    page?: number;
    pageSize?: number;
    status?: "all" | OrderStatus;
    search?: string;
  }) {
    const queryPage = overrides?.page ?? page;
    const queryPageSize = overrides?.pageSize ?? pageSize;
    const queryStatus = overrides?.status ?? statusFilter;
    const querySearch = overrides?.search ?? appliedSearch;

    setLoading(true);
    try {
      const response = await apiClient.adminGetOrders(
        {
          page: queryPage,
          pageSize: queryPageSize,
          status: queryStatus === "all" ? undefined : queryStatus,
          search: querySearch.trim() || undefined,
        },
        token ?? undefined,
      );

      setOrders(response.items);
      setTotal(response.total);

      const totalPages = Math.max(1, response.pagination.totalPages);
      if (queryPage > totalPages) {
        setPage(totalPages);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  async function updateStatus(order: Order, status: OrderStatus) {
    setUpdatingOrderId(order.id);
    try {
      const { item } = await apiClient.adminUpdateOrderStatus(
        order.id,
        { status },
        token ?? undefined,
      );

      setOrders((prev) => prev.map((entry) => (entry.id === item.id ? item : entry)));
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
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Order ID, user name, email, product..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter((value as "all" | OrderStatus) ?? "all");
              setPage(1);
            }}>
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

          <div className="space-y-1">
            <Label className="text-xs">Per Page</Label>
            <Select value={String(pageSize)} onValueChange={(value) => {
              const nextSize = Number(value);
              if (!Number.isFinite(nextSize)) {
                return;
              }

              setPageSize(nextSize);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void loadOrders()} disabled={loading}>
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              type="button"
              onClick={() => {
                setAppliedSearch(searchInput);
                setPage(1);
              }}
              className="bg-black text-white hover:bg-zinc-800"
              disabled={loading}
            >
              <FiFilter className="h-4 w-4" /> Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-zinc-600">
        Showing {rangeStart}-{rangeEnd} of {total} orders.
      </p>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-zinc-500">
              No orders found with current filters.
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const statusLabel = ORDER_STATUSES.find((s) => s.value === order.status)?.label ?? order.status;
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            const selectedStatus = localStatus[order.id] ?? order.status;
            const hasRefundedItems = order.items.some((item) => item.refundedQuantity > 0);
            const hasDeliveredItems = order.items.some((item) => item.deliveredQuantity > 0);
            const isPartialDelivery = hasRefundedItems && hasDeliveredItems;

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
                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {order.purchaseMode.toUpperCase()}
                        </span>
                        {isPartialDelivery && (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Partial delivery
                          </span>
                        )}
                        {hasRefundedItems && (
                          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                            Refund issued
                          </span>
                        )}
                        {order.isWholesale && (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            WHOLESALE
                          </span>
                        )}
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

                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Update status</Label>
                      <Select
                        value={selectedStatus}
                        onValueChange={(value) => {
                          if (!value) {
                            return;
                          }

                          setLocalStatus((prev) => ({ ...prev, [order.id]: value as OrderStatus }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={() => void updateStatus(order, selectedStatus)}
                      disabled={updatingOrderId === order.id || selectedStatus === order.status}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      {updatingOrderId === order.id ? "Updating..." : "Save Status"}
                    </Button>

                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>View Full Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-start">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) {
                    setPage(page - 1);
                  }
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {pages[0] !== 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(1);
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {pages[0] > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {pages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={page === pageNumber}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {pages[pages.length - 1] !== totalPages && (
              <>
                {pages[pages.length - 1] < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(totalPages);
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (page < totalPages) {
                    setPage(page + 1);
                  }
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
