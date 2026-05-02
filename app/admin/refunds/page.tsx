import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminRefunds } from "@/lib/server/services/refund-service";
import type { OrderStatus } from "@/lib/client/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_BADGES: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parsePageSize(value: string | undefined): number {
  const parsed = parsePositiveInt(value, 20);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : 20;
}

function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

function buildAdminRefundsHref(input: { page: number; pageSize: number; search?: string }): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));
  if (input.search) {
    query.set("search", input.search);
  }

  return `/admin/refunds?${query.toString()}`;
}

export default async function AdminRefundsPage(context: { searchParams: Promise<RawSearchParams> }) {
  await requireServerRole(["admin"]);

  const rawSearchParams = await context.searchParams;
  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));
  const search = firstParam(rawSearchParams.search)?.trim() || "";

  let result = await getAdminRefunds({
    page: requestedPage,
    pageSize,
    search: search || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  let currentPage = requestedPage;
  if (result.total > 0 && requestedPage > totalPages) {
    currentPage = totalPages;
    result = await getAdminRefunds({
      page: currentPage,
      pageSize,
      search: search || undefined,
    });
  }

  const finalTotalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const pages = pageWindow(currentPage, finalTotalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Refund Tracking</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Showing {rangeStart}-{rangeEnd} of {result.total} refunds processed through Stripe.
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
                <BreadcrumbPage>Refunds</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-end" action="/admin/refunds" method="get">
            <div className="w-full max-w-md">
              <label
                htmlFor="admin-refunds-search"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Search
              </label>
              <Input
                id="admin-refunds-search"
                name="search"
                defaultValue={search}
                placeholder="Order ID, refund ID, customer, admin email..."
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              />
            </div>

            <div>
              <label
                htmlFor="admin-refunds-page-size"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Per Page
              </label>
              <Select name="pageSize" defaultValue={String(pageSize)}>
                <SelectTrigger
                  id="admin-refunds-page-size"
                  className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <input type="hidden" name="page" value="1" />

            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/refunds">Reset</Link>
              </Button>
            </div>
          </form>

          {result.items.length === 0 && (
            <p className="text-sm text-zinc-500">No refunds match the current filters.</p>
          )}

          {result.items.length > 0 && (
            <div className="rounded-lg border border-zinc-200">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead>Refund</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Handled By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <p className="font-medium text-zinc-900">{refund.providerRefundId}</p>
                        <p className="text-xs text-zinc-500 uppercase">{refund.provider}</p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${refund.orderId}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          Order #{refund.orderId}
                        </Link>
                        <div className="mt-1">
                          <Badge className={`border text-xs ${STATUS_BADGES[refund.orderStatus]}`}>
                            {STATUS_LABELS[refund.orderStatus]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-zinc-900">{refund.userName}</p>
                        <p className="text-xs text-zinc-500">{refund.userEmail}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-zinc-900">{refund.adminName}</p>
                        <p className="text-xs text-zinc-500">{refund.adminEmail}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-zinc-900">
                          {refund.currency.toUpperCase()} {refund.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500">Order total A${refund.orderTotal.toFixed(2)}</p>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {refund.reason ?? "-"}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {new Date(refund.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {finalTotalPages > 1 && (
            <Pagination className="justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={currentPage > 1
                      ? buildAdminRefundsHref({ page: currentPage - 1, pageSize, search: search || undefined })
                      : "#"}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {pages[0] !== 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href={buildAdminRefundsHref({ page: 1, pageSize, search: search || undefined })}
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
                      href={buildAdminRefundsHref({ page: pageNumber, pageSize, search: search || undefined })}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {pages[pages.length - 1] !== finalTotalPages && (
                  <>
                    {pages[pages.length - 1] < finalTotalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildAdminRefundsHref({ page: finalTotalPages, pageSize, search: search || undefined })}
                      >
                        {finalTotalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href={currentPage < finalTotalPages
                      ? buildAdminRefundsHref({ page: currentPage + 1, pageSize, search: search || undefined })
                      : "#"}
                    className={currentPage >= finalTotalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
