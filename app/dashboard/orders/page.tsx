import Link from "next/link";
import { redirect } from "next/navigation";
import { FiShoppingBag } from "react-icons/fi";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getUserOrdersPaginated } from "@/lib/server/services/order-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildLoginRedirect } from "@/lib/shared/return-to";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

type RawSearchParams = Record<string, string | string[] | undefined>;

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid:            { label: "Paid",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  processing:      { label: "Processing",      className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  shipped:         { label: "Shipped",         className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered:       { label: "Delivered",       className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled:       { label: "Cancelled",       className: "bg-red-100 text-red-800 border-red-200" },
  refunded:        { label: "Refunded",        className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

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
  const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : DEFAULT_PAGE_SIZE;
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

function buildOrdersHref(input: { page: number; pageSize: number }): string {
  const query = new URLSearchParams();
  query.set("page", String(input.page));
  query.set("pageSize", String(input.pageSize));
  return `/dashboard/orders?${query.toString()}`;
}

export default async function DashboardOrdersPage(context: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawSearchParams = await context.searchParams;
  const session = await getServerSession();
  if (!session) redirect(buildLoginRedirect("/dashboard/orders", rawSearchParams));
  if (session.role === "admin") redirect("/admin");

  const requestedPage = parsePositiveInt(firstParam(rawSearchParams.page), 1);
  const pageSize = parsePageSize(firstParam(rawSearchParams.pageSize));

  let result = await getUserOrdersPaginated({
    userId: session.userId,
    page: requestedPage,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  let currentPage = requestedPage;
  if (result.total > 0 && requestedPage > totalPages) {
    currentPage = totalPages;
    result = await getUserOrdersPaginated({
      userId: session.userId,
      page: currentPage,
      pageSize,
    });
  }

  const finalTotalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const pages = pageWindow(currentPage, finalTotalPages);
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = result.total === 0 ? 0 : Math.min(currentPage * pageSize, result.total);
  const queryState = { pageSize };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">My Orders</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Showing {rangeStart}-{rangeEnd} of {result.total} orders.
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
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

      {result.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <FiShoppingBag className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-700">No orders yet</p>
              <p className="text-sm text-zinc-500">Your completed orders will appear here.</p>
            </div>
            <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <form className="flex items-end gap-3" action="/dashboard/orders" method="get">
              <div>
                <label
                  htmlFor="orders-page-size"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
                >
                  Per Page
                </label>
                <select
                  id="orders-page-size"
                  name="pageSize"
                  defaultValue={String(pageSize)}
                  className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={String(size)}>{size}</option>
                  ))}
                </select>
              </div>
              <input type="hidden" name="page" value="1" />
              <Button type="submit" variant="outline">Apply</Button>
            </form>

            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((order) => {
                    const config = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-zinc-100 text-zinc-700 border-zinc-200" };
                    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    const previewItem = order.items[0];
                    const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-semibold text-zinc-900">Order #{order.id}</p>
                          <p className="text-xs text-zinc-500">
                            {previewItem?.productName}
                            {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                          </p>
                        </TableCell>
                        <TableCell className="text-zinc-600">{formattedDate}</TableCell>
                        <TableCell>
                          <Badge className={`border text-xs ${config.className}`}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-700">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-zinc-900">
                          A${order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {finalTotalPages > 1 && (
              <Pagination className="justify-start">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={currentPage > 1 ? buildOrdersHref({ ...queryState, page: currentPage - 1 }) : "#"}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {pages[0] !== 1 && (
                    <>
                      <PaginationItem>
                        <PaginationLink href={buildOrdersHref({ ...queryState, page: 1 })}>1</PaginationLink>
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
                        href={buildOrdersHref({ ...queryState, page: pageNumber })}
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
                        <PaginationLink href={buildOrdersHref({ ...queryState, page: finalTotalPages })}>
                          {finalTotalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href={currentPage < finalTotalPages ? buildOrdersHref({ ...queryState, page: currentPage + 1 }) : "#"}
                      className={currentPage >= finalTotalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
