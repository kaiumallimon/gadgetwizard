"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  ArrowDown, 
  ArrowUp, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  FileText, 
  Layers, 
  Loader2, 
  ShoppingBag, 
  TrendingUp, 
  Users 
} from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { AdminRevenueSnapshot, OrderPurchaseMode, OrderStatus } from "@/lib/client/types";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "Today", value: "1d" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 12 Months", value: "365d" },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "#71717a",
  paid: "#10b981",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#16a34a",
  cancelled: "#ef4444",
  refunded: "#f59e0b",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

// Simple Interactive Line Chart Component
function RevenueLineChart({ series }: { series: AdminRevenueSnapshot["series"] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxRevenue = useMemo(() => Math.max(...series.map((d) => d.revenue), 100), [series]);
  const width = 800;
  const height = 240;
  const padding = { top: 40, right: 20, bottom: 30, left: 60 };

  const points = useMemo(() => {
    return series.map((d, i) => {
      const x = series.length > 1
        ? padding.left + (i / (series.length - 1)) * (width - padding.left - padding.right)
        : padding.left + (width - padding.left - padding.right) / 2;
      const y = height - padding.bottom - (d.revenue / maxRevenue) * (height - padding.top - padding.bottom);
      return { x, y, ...d };
    });
  }, [series, maxRevenue, height, padding, width]);

  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  }, [points]);

  const areaData = useMemo(() => {
    if (points.length < 2) return "";
    return `${pathData} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`;
  }, [pathData, points, height, padding]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = height - padding.bottom - p * (height - padding.top - padding.bottom);
          return (
            <g key={p}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-[10px] fill-zinc-400 font-medium"
              >
                {formatCompactNumber(p * maxRevenue)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient */}
        <defs>
          <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaData} fill="url(#revenue-grad)" />
        <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interaction Points */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIndex(i)}>
            <rect
              x={p.x - (width - padding.left - padding.right) / (Math.max(1, series.length) * 2)}
              y={padding.top}
              width={(width - padding.left - padding.right) / Math.max(1, series.length)}
              height={height - padding.top - padding.bottom}
              fill="transparent"
            />
            {(hoverIndex === i || points.length === 1) && (
              <>
                <line
                  x1={p.x}
                  y1={padding.top}
                  x2={p.x}
                  y2={height - padding.bottom}
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray={points.length === 1 && hoverIndex !== i ? "4 4" : "0"}
                />
                <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
              </>
            )}
          </g>
        ))}

        {/* X-Axis Labels (subset) */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(series.length / 6)) === 0).map((p) => (
          <text
            key={p.date}
            x={p.x}
            y={height - padding.bottom + 18}
            textAnchor="middle"
            className="text-[10px] fill-zinc-400 font-medium"
          >
            {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div 
          className="absolute z-10 pointer-events-none bg-white border border-zinc-200 shadow-xl rounded-lg p-3 text-xs"
          style={{ 
            left: `${(points[hoverIndex].x / width) * 100}%`, 
            top: points[hoverIndex].y > 100 ? points[hoverIndex].y - 85 : points[hoverIndex].y + 15,
            transform: "translateX(-50%)"
          }}
        >
          <p className="font-semibold text-zinc-900 mb-1">{new Date(points[hoverIndex].date).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Revenue:</span>
            <span className="font-bold text-blue-600">{formatCurrency(points[hoverIndex].revenue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-500">Orders:</span>
            <span className="font-medium text-zinc-900">{points[hoverIndex].orders}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminRevenueDashboard() {
  const { token } = useAuthStore();
  const [snapshot, setSnapshot] = useState<AdminRevenueSnapshot | null>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.adminGetRevenue(range, token ?? undefined);
      setSnapshot(response.snapshot);
    } catch (error) {
      console.error("Failed to fetch revenue", error);
    } finally {
      setLoading(false);
    }
  }, [range, token]);

  useEffect(() => {
    void fetchRevenue();
  }, [fetchRevenue]);

  const exportCSV = useCallback(() => {
    if (!snapshot) return;

    const rows = [
      ["Revenue Report", `${snapshot.range.startDate} to ${snapshot.range.endDate}`],
      [],
      ["Summary Metrics"],
      ["Metric", "Value"],
      ["Total Revenue", snapshot.summary.totalRevenue],
      ["Total Orders", snapshot.summary.totalOrders],
      ["Total Units", snapshot.summary.totalUnits],
      ["Avg Order Value", snapshot.summary.averageOrderValue],
      [],
      ["Daily Series"],
      ["Date", "Revenue", "Orders"],
      ...snapshot.series.map((s) => [s.date, s.revenue, s.orders]),
      [],
      ["Top Products"],
      ["Product Name", "Units", "Revenue"],
      ...snapshot.topProducts.map((p) => [p.productName, p.units, p.revenue]),
    ];

    const csvContent = rows.map((r) => r.map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `revenue_report_${range}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [snapshot, range]);

  const summaryCards = useMemo(() => {
    if (!snapshot) return [];
    
    return [
      {
        title: "Total Revenue",
        value: formatCurrency(snapshot.summary.totalRevenue),
        growth: snapshot.summary.revenueGrowthPct,
        icon: DollarSign,
        color: "text-emerald-600 bg-emerald-50 ring-emerald-100",
      },
      {
        title: "Orders Count",
        value: snapshot.summary.totalOrders.toLocaleString(),
        growth: snapshot.summary.orderGrowthPct,
        icon: ShoppingBag,
        color: "text-blue-600 bg-blue-50 ring-blue-100",
      },
      {
        title: "Units Sold",
        value: snapshot.summary.totalUnits.toLocaleString(),
        growth: snapshot.summary.unitGrowthPct,
        icon: Layers,
        color: "text-violet-600 bg-violet-50 ring-violet-100",
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(snapshot.summary.averageOrderValue),
        growth: null,
        icon: TrendingUp,
        color: "text-amber-600 bg-amber-50 ring-amber-100",
      },
    ];
  }, [snapshot]);

  if (loading && !snapshot) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">Revenue Insights</h1>
            <p className="mt-1 text-sm text-zinc-500">Track your financial performance and growth metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-9 px-3 font-medium bg-zinc-50 border-zinc-200 text-zinc-600 hidden sm:flex">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              {new Date(snapshot.range.startDate).toLocaleDateString()} - {new Date(snapshot.range.endDate).toLocaleDateString()}
            </Badge>
            <Select value={range} onValueChange={(val) => setRange(val ?? "30d")}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={fetchRevenue} disabled={loading}>
              <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Revenue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{card.title}</CardTitle>
                <div className={cn("p-2 rounded-full ring-1", card.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900">{card.value}</div>
                {card.growth !== null && (
                  <p className={cn(
                    "mt-1 text-xs font-semibold flex items-center gap-1",
                    card.growth >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {card.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {formatPercent(card.growth)}
                    <span className="text-zinc-400 font-normal ml-0.5">vs previous {snapshot.range.days}d</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Revenue Over Time
            </CardTitle>
            <CardDescription>Daily revenue trends for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueLineChart series={snapshot.series} />
          </CardContent>
        </Card>

        {/* Purchase Mode Split */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-500" />
              Customer Segments
            </CardTitle>
            <CardDescription>Revenue split between Regular and Business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {snapshot.byPurchaseMode.map((mode) => {
              const total = snapshot.byPurchaseMode.reduce((acc, m) => acc + m.revenue, 0);
              const percent = total > 0 ? (mode.revenue / total) * 100 : 0;
              return (
                <div key={mode.mode} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-700 capitalize">{mode.mode} Channel</span>
                    <span className="text-zinc-500">{formatCurrency(mode.revenue)}</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", mode.mode === "regular" ? "bg-blue-500" : "bg-violet-500")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    <span>{percent.toFixed(1)}% Share</span>
                    <span>{mode.orders} Orders</span>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 border-t border-zinc-100">
               <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-sm">
                       <BarChart3 className="h-4 w-4 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Top Segment</p>
                      <p className="text-sm font-bold text-zinc-900 capitalize">
                        {snapshot.byPurchaseMode.reduce((prev, curr) => prev.revenue > curr.revenue ? prev : curr).mode}
                      </p>
                    </div>
                 </div>
                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">Strongest</Badge>
               </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-zinc-500" />
              Order Status Breakdown
            </CardTitle>
            <CardDescription>Current state of orders placed in this period.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {snapshot.statusBreakdown.filter(s => s.orders > 0).map((s) => {
                  const total = snapshot.statusBreakdown.reduce((acc, b) => acc + b.orders, 0);
                  const percent = total > 0 ? (s.orders / total) * 100 : 0;
                  return (
                    <div key={s.status} className="flex items-center gap-4">
                      <div className="w-32 text-xs font-medium text-zinc-600 truncate">{STATUS_LABELS[s.status]}</div>
                      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${percent}%`, backgroundColor: STATUS_COLORS[s.status] }} 
                        />
                      </div>
                      <div className="w-16 text-right text-xs font-bold text-zinc-900">{s.orders}</div>
                    </div>
                  );
                })}
                {snapshot.statusBreakdown.every(s => s.orders === 0) && (
                  <p className="text-sm text-zinc-500 py-4 text-center italic">No orders recorded in this period.</p>
                )}
             </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Best Selling Products
            </CardTitle>
            <CardDescription>Top products by revenue contribution.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-zinc-100">
                    <TableHead className="h-10 text-[10px] uppercase tracking-widest font-bold">Product</TableHead>
                    <TableHead className="h-10 text-right text-[10px] uppercase tracking-widest font-bold">Qty</TableHead>
                    <TableHead className="h-10 text-right text-[10px] uppercase tracking-widest font-bold">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.topProducts.map((p) => (
                    <TableRow key={p.productId} className="border-zinc-50">
                      <TableCell className="py-3">
                        <p className="font-semibold text-zinc-900 line-clamp-1">{p.productName}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right font-medium text-zinc-600">{p.units}</TableCell>
                      <TableCell className="py-3 text-right font-bold text-zinc-900">{formatCurrency(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <p className="text-sm text-zinc-500 py-8 text-center italic">No sales data available for top products.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer Info */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white rounded-lg border border-zinc-200">
              <FileText className="h-5 w-5 text-zinc-400" />
           </div>
           <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Data Integrity</p>
              <p className="text-sm font-semibold text-zinc-700">Snapshot generated at {new Date(snapshot.generatedAt).toLocaleString()}</p>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="text-xs h-8 bg-white" onClick={exportCSV}>
              Export CSV
           </Button>
        </div>
      </footer>
    </div>
  );
}
