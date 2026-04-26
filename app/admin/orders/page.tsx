import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminOrders } from "@/lib/server/services/order-service";
import { AdminOrdersManager } from "@/components/admin/admin-orders-manager";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseStatus(value: string | undefined):
  | "all"
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded" {
  if (
    value === "pending_payment" ||
    value === "paid" ||
    value === "processing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }

  return "all";
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function parsePageSize(value: string | undefined): number {
  const parsed = parsePositiveInt(value, 20);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 20;
}

export default async function AdminOrdersPage(context: { searchParams: Promise<RawSearchParams> }) {
  await requireServerRole(["admin"]);

  const rawSearchParams = await context.searchParams;
  const page = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));
  const status = parseStatus(firstParam(rawSearchParams.status));
  const search = firstParam(rawSearchParams.search)?.trim() || "";

  const result = await getAdminOrders({
    page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Orders Management</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Track incoming orders and update delivery lifecycle status.
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AdminOrdersManager
        initialOrders={result.items}
        initialTotal={result.total}
        initialPage={page}
        initialPageSize={pageSize}
        initialStatus={status}
        initialSearch={search}
      />
    </div>
  );
}
