"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import type { Order } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminOrderPartialFulfillmentProps {
  order: Order;
}

export function AdminOrderPartialFulfillment({ order }: AdminOrderPartialFulfillmentProps) {
  const { token } = useAuthStore();
  const [orderState, setOrderState] = useState<Order>(order);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const item of order.items) {
      if (item.deliveredQuantity > 0 || item.refundedQuantity > 0) {
        initial[item.id] = item.deliveredQuantity;
      } else {
        initial[item.id] = item.quantity;
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ amount: number; currency: string; stripeRefundId: string; emailSent: boolean } | null>(null);

  const isLocked = useMemo(
    () => orderState.items.some((item) => item.deliveredQuantity > 0 || item.refundedQuantity > 0),
    [orderState.items],
  );

  const summary = useMemo(() => {
    let refundCents = 0;
    const rows = orderState.items.map((item) => {
      const deliveredQuantity = isLocked
        ? item.deliveredQuantity
        : Math.min(item.quantity, Math.max(0, deliveredQuantities[item.id] ?? item.quantity));
      const refundedQuantity = isLocked
        ? item.refundedQuantity
        : Math.max(0, item.quantity - deliveredQuantity);
      const unitCents = Math.round(item.unitPrice * 100);
      const lineRefundCents = refundedQuantity * unitCents;
      refundCents += lineRefundCents;

      return {
        item,
        deliveredQuantity,
        refundedQuantity,
        lineRefundCents,
      };
    });

    const refundAmount = Number((refundCents / 100).toFixed(2));
    return { refundCents, refundAmount, rows };
  }, [orderState.items, deliveredQuantities, isLocked]);

  function updateDeliveredQuantity(itemId: number, value: string) {
    const parsed = Number(value);
    const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

    setDeliveredQuantities((prev) => ({
      ...prev,
      [itemId]: safeValue,
    }));
  }

  async function handleSubmit() {
    if (!token) {
      window.alert("Please sign in again to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: orderState.items.map((item) => ({
          orderItemId: item.id,
          deliveredQuantity: Math.min(item.quantity, Math.max(0, deliveredQuantities[item.id] ?? item.quantity)),
        })),
      };

      const response = await apiClient.adminPartialFulfillOrder(orderState.id, payload, token ?? undefined);
      setOrderState(response.item);
      setResult({
        amount: response.refund.amount,
        currency: response.refund.currency,
        stripeRefundId: response.refund.stripeRefundId,
        emailSent: response.emailSent,
      });

      const nextDelivered: Record<number, number> = {};
      for (const item of response.item.items) {
        nextDelivered[item.id] = item.deliveredQuantity;
      }
      setDeliveredQuantities(nextDelivered);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to process partial fulfillment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Partial Delivery & Refund</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-600">
          Adjust delivered quantities per item. The remaining quantity will be refunded through Stripe, and an apology
          email will be sent automatically.
        </p>

        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Ordered</TableHead>
                <TableHead className="text-center">Delivered</TableHead>
                <TableHead className="text-center">Refunded</TableHead>
                <TableHead className="text-right">Line Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.rows.map((row) => (
                <TableRow key={row.item.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{row.item.productName}</p>
                      {row.item.productSku && <p className="text-xs text-zinc-500">SKU: {row.item.productSku}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-zinc-700">{row.item.quantity}</TableCell>
                  <TableCell className="text-center">
                    {isLocked ? (
                      <span className="font-medium text-zinc-900">{row.deliveredQuantity}</span>
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        max={row.item.quantity}
                        value={deliveredQuantities[row.item.id] ?? row.item.quantity}
                        onChange={(event) => updateDeliveredQuantity(row.item.id, event.target.value)}
                        className="mx-auto h-9 w-24 text-center"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-center text-zinc-700">{row.refundedQuantity}</TableCell>
                  <TableCell className="text-right font-semibold text-zinc-900">
                    A${(row.lineRefundCents / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Refund total</p>
            <p className="text-2xl font-semibold text-zinc-900">A${summary.refundAmount.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">Refunds appear on the original payment method.</p>
          </div>
          {!isLocked && (
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              className="bg-black text-white hover:bg-zinc-800"
              disabled={submitting || summary.refundCents <= 0}
            >
              {submitting ? "Processing..." : "Process partial refund"}
            </Button>
          )}
        </div>

        {isLocked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Partial fulfillment has already been recorded for this order.
          </div>
        )}

        {result && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">Refund processed</p>
              <p>Refund ID: {result.stripeRefundId}</p>
              {!result.emailSent && (
                <p className="mt-1 flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Email delivery failed. Please contact the customer manually.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
